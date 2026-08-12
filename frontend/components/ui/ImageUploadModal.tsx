'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { siteConfig } from '@/config/siteConfig';
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
  const [isPhotosPublished, setIsPhotosPublished] = useState<boolean>(true);
  const [fetchingImages, setFetchingImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBaseUrl = siteConfig.apiBaseUrl.replace(/\/+$/, "");

  const getImageUrl = (path: string) => {
    if (!path.startsWith("http://") && !path.startsWith("https://")) {
      return `${apiBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    }
    return path;
  };

  const fetchProductDetails = async () => {
    setFetchingImages(true);
    try {
      // 1. Fetch images
      const imagesRes = await fetch(`${apiBaseUrl}/store/products/${productId}/images/`, { cache: 'no-store' });
      if (imagesRes.ok) {
        const data = await imagesRes.json();
        setExistingImages(Array.isArray(data) ? data : data.results || []);
      }

      // 2. Fetch product info to get publish status
      const productRes = await fetch(`${apiBaseUrl}/store/products/${productId}/`, { cache: 'no-store' });
      if (productRes.ok) {
        const prodData = await productRes.json();
        if (prodData.is_photos_published !== undefined) {
          setIsPhotosPublished(prodData.is_photos_published);
        }
      }
    } catch (e) {
      console.error("Failed to load product details", e);
    } finally {
      setFetchingImages(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const handleUploadClick = () => {
    if (existingImages.length >= 5) return;
    fileInputRef.current?.click();
  };

  const handleTogglePublishPhotos = async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('jwt');
    try {
      const newStatus = !isPhotosPublished;
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
        body: JSON.stringify({ is_photos_published: newStatus }),
      });

      if (res.ok) {
        setIsPhotosPublished(newStatus);
        setMessage({
          type: 'success',
          text: newStatus ? 'Photos published! Visible on public store.' : 'Photos set to Draft mode (hidden from public).',
        });
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error(err);
    }
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
      fetchProductDetails();
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
      cancelButtonColor: 'var(--primary)',
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
        fetchProductDetails();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header with Photo Count and Publish Toggle */}
      <div className="flex items-center justify-between gap-2 border-b border-foreground/10 pb-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            Product Photos ({existingImages.length}/5)
          </h4>
          <p className="text-[10px] font-bold text-foreground/60 mt-0.5">
            {isPhotosPublished ? '🟢 Publicly Visible on Store' : '🔴 Draft Mode (Hidden from Store)'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleTogglePublishPhotos}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
            isPhotosPublished
              ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
              : 'bg-button-bg text-button-fg hover:opacity-90'
          }`}
        >
          {isPhotosPublished ? 'Photos Published' : 'Publish Photos'}
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChangeAndUpload}
        className="hidden"
      />

      {fetchingImages ? (
        <p className="text-xs text-foreground/50 animate-pulse py-4">Loading photos...</p>
      ) : (
        <div className="space-y-4">
          {/* Main Cover Photo */}
          {existingImages[0] ? (
            <div className="relative group rounded-2xl overflow-hidden border border-foreground/20 shadow-sm bg-secondary aspect-[4/3] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getImageUrl(existingImages[0].image)} alt="Main Photo" className="object-cover w-full h-full" />
              <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-accent border border-foreground/10 shadow-sm">
                Main Cover Photo
              </div>
              <button
                type="button"
                onClick={() => handleDeleteImage(existingImages[0].id)}
                className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                Delete Main Photo
              </button>
            </div>
          ) : (
            <div 
              onClick={!loading ? handleUploadClick : undefined}
              className={`rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5 hover:bg-accent/10 cursor-pointer flex flex-col gap-2 items-center justify-center p-8 aspect-[4/3] w-full transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="text-xs text-accent font-bold uppercase tracking-tight animate-pulse">UPLOADING MAIN PHOTO...</span>
              ) : (
                <>
                  <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-black uppercase text-accent tracking-wider">
                    Upload Main Cover Photo (Required)
                  </span>
                </>
              )}
            </div>
          )}

          {/* Detail Photos Grid (Only existing detail photos 2..5) */}
          {existingImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {existingImages.slice(1).map((img, idx) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-foreground/20 shadow-sm bg-secondary aspect-square w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getImageUrl(img.image)} alt={`Detail ${idx + 1}`} className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Photo Slot Button (If < 5 photos) */}
          {existingImages.length > 0 && existingImages.length < 5 && (
            <button
              type="button"
              onClick={!loading ? handleUploadClick : undefined}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {loading ? 'Uploading...' : `+ Add Photo Slot (Photo ${existingImages.length + 1} of 5)`}
            </button>
          )}
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
