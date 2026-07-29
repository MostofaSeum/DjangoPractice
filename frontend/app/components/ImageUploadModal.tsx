'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';

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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

  // Fetch existing product images
  const fetchImages = async () => {
    setFetchingImages(true);
    try {
      const res = await fetch(`${apiBaseUrl}/store/products/${productId}/images/`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setExistingImages(data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('image', file);

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
      setFile(null);
      setPreview(null);
      fetchImages(); // Refresh thumbnail list
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
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

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
          Product Photos ({existingImages.length})
        </h4>
      </div>

      {/* Existing Images Thumbnails */}
      {fetchingImages ? (
        <p className="text-xs text-[#3a3532]/50 animate-pulse">Loading photos...</p>
      ) : existingImages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {existingImages.map((img) => (
            <div key={img.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#3a3532]/20 shadow-sm bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image} alt="Product Thumbnail" className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.id)}
                title="Delete Photo"
                className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#3a3532]/50 italic">No photo uploaded yet.</p>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="space-y-3 pt-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#3a3532]/70">
            Upload New Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-[#3a3532]
              file:mr-3 file:py-1.5 file:px-3
              file:rounded-xl file:border-0
              file:text-xs file:font-bold
              file:bg-[#3a3532] file:text-[#e6e0d4]
              hover:file:opacity-90 cursor-pointer"
          />
        </div>

        {preview && (
          <div className="flex items-center gap-3 p-2 bg-[#f4f1eb] rounded-xl border border-[#3a3532]/10">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#3a3532]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="New Preview" className="object-cover w-full h-full" />
            </div>
            <span className="text-xs font-bold text-[#3a3532]/70">New photo selected</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="w-full py-2.5 bg-[#8b7a66] hover:bg-[#726453] text-white text-xs font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 transition-colors"
        >
          {loading ? 'Uploading...' : 'Save & Attach Photo'}
        </button>
      </form>

      {message && (
        <p className={`text-xs font-bold ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
