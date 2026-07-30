'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Swal from 'sweetalert2';

interface ProductImage {
  id: number;
  image: string;
}

interface ImageUploadModalProps {
  productId: number;
  onSuccess?: () => void;
}

export default function ImageUploadModal({ productId, onSuccess }: ImageUploadModalProps) {
  const { user } = useAuth();
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [fetchingImages, setFetchingImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

  const fetchImages = async () => {
    setFetchingImages(true);
    try {
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/images/`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setExistingImages(Array.isArray(data) ? data : data.results || []);
      }
    } catch (e) {
      console.error("Failed to load product images", e);
    } finally {
      setFetchingImages(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const handleUploadClick = () => {
    if (existingImages.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleFileChangeAndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('jwt');
      const response = await fetch(`${apiBaseUrl}/store/products/${productId}/images/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.image?.[0] || errData.detail || 'Upload failed.');
      }

      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      fetchImages();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const confirmResult = await Swal.fire({
      title: 'Delete Photo?',
      text: "Are you sure you want to delete this photo?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#cc5555',
      cancelButtonColor: '#3a3532',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!confirmResult.isConfirmed) return;

    const token = localStorage.getItem('access_token') || localStorage.getItem('jwt');
    try {
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      });

      if (res.ok || res.status === 204) {
        setMessage({ type: 'success', text: 'Photo removed!' });
        fetchImages();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderSlot = (index: number) => {
    const isMain = index === 0;
    const img = existingImages[index];
    const isNextAvailable = index === existingImages.length;

    // Resolve full URL for rendering if it's a relative path from Django
    const getImageUrl = (path: string) => {
      if (!path.startsWith("http://") && !path.startsWith("https://")) {
        return `${apiBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
      }
      return path;
    };

    if (img) {
      return (
        <div key={img.id} className={`relative group rounded-xl overflow-hidden border border-[#3a3532]/20 shadow-sm bg-white ${isMain ? 'w-full aspect-[4/3]' : 'w-full aspect-square'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(img.image)} alt={`Slot ${index}`} className="object-cover w-full h-full" />
          <button
            type="button"
            onClick={() => handleDeleteImage(img.id)}
            title="Delete Photo"
            className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            Delete
          </button>
        </div>
      );
    }

    // Empty slot (clickable for upload)
    return (
      <div 
        key={`empty-${index}`} 
        onClick={!loading ? handleUploadClick : undefined}
        className={`relative rounded-xl border-2 border-dashed border-[#8b7a66]/50 bg-[#8b7a66]/5 hover:bg-[#8b7a66]/10 cursor-pointer flex flex-col gap-1 items-center justify-center p-1 transition-colors ${isMain ? 'w-full aspect-[4/3]' : 'w-full aspect-square'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <span className="text-[9px] text-[#8b7a66] font-bold uppercase tracking-tight animate-pulse text-center">UPLOADING...</span>
        ) : (
          <>
            <svg className={`${isMain ? 'w-6 h-6' : 'w-4 h-4'} text-[#8b7a66]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className={`${isMain ? 'text-[10px] tracking-wider' : 'text-[8.5px] sm:text-[9px] tracking-tight whitespace-nowrap'} text-[#8b7a66] font-bold uppercase text-center`}>
              {isMain ? 'ADD MAIN IMAGE' : `ADD DETAIL ${index}`}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
          Product Photos ({existingImages.length}/5)
        </h4>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChangeAndUpload}
        className="hidden"
      />

      {fetchingImages ? (
        <p className="text-xs text-[#3a3532]/50 animate-pulse">Loading photos...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Main Image Slot */}
          {renderSlot(0)}
          
          {/* Detail Images Slots (4 in a row) */}
          <div className="grid grid-cols-4 gap-2">
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
            {renderSlot(4)}
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs font-bold ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
