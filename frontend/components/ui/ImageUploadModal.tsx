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
  onUnsavedChange?: (hasUnsaved: boolean) => void;
}

export default function ImageUploadModal({ productId, onSuccess, onUnsavedChange }: ImageUploadModalProps) {
  const { user } = useAuth();
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
      setSelectedFiles([]);
      setPreviewUrls([]);
      if (onUnsavedChange) onUnsavedChange(false);
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (onUnsavedChange) {
      onUnsavedChange(selectedFiles.length > 0);
    }
  }, [selectedFiles, onUnsavedChange]);

  const totalPhotosCount = existingImages.length + selectedFiles.length;

  const handleSelectFilesClick = () => {
    if (totalPhotosCount >= 5) return;
    fileInputRef.current?.click();
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - totalPhotosCount;
    const newFiles = Array.from(files).slice(0, remainingSlots);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAllSelected = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setMessage(null);

    const token = localStorage.getItem('access_token') || localStorage.getItem('jwt');
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${apiBaseUrl}/store/products/${productId}/images/`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `JWT ${token}` } : {}),
          },
          body: formData,
        });

        if (response.ok) {
          successCount++;
        }
      }

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);

      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: `${successCount} photo(s) uploaded successfully!`,
        showConfirmButton: false,
        timer: 2000,
        toast: true,
      });

      setMessage({ type: 'success', text: `${successCount} photo(s) uploaded successfully!` });
      fetchProductDetails();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong during upload.' });
    } finally {
      setLoading(false);
    }
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

  const handleDeleteImage = async (imageId: number) => {
    const confirmResult = await Swal.fire({
      title: 'Delete Photo?',
      text: "Are you sure you want to delete this photo from the store?",
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
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileSelection}
        className="hidden"
      />

      {fetchingImages ? (
        <p className="text-xs text-foreground/50 animate-pulse py-4">Loading photos...</p>
      ) : (
        <div className="space-y-4">
          {/* Photos Grid */}
          <div className="space-y-3">
            {/* Main Cover Photo (Existing or Newly Selected #1) */}
            {existingImages.length > 0 ? (
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
            ) : previewUrls.length > 0 ? (
              <div className="relative group rounded-2xl overflow-hidden border-2 border-yellow-500/80 shadow-sm bg-secondary aspect-[4/3] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[0]} alt="Selected Main Preview" className="object-cover w-full h-full opacity-90" />
                <div className="absolute top-3 left-3 bg-yellow-500 text-black font-black px-2.5 py-1 rounded-lg text-[9px] uppercase shadow-sm">
                  Pending Upload (Cover)
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSelectedFile(0)}
                  className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  Remove Selected
                </button>
              </div>
            ) : (
              <div 
                onClick={handleSelectFilesClick}
                className="rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5 hover:bg-accent/10 cursor-pointer flex flex-col gap-2 items-center justify-center p-8 aspect-[4/3] w-full transition-all"
              >
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-black uppercase text-accent tracking-wider">
                  Select Main Cover Photo
                </span>
              </div>
            )}

            {/* Additional Photos Grid (Existing 2..5 and Selected previews) */}
            {(existingImages.length > 1 || (existingImages.length === 0 && previewUrls.length > 1) || (existingImages.length > 0 && previewUrls.length > 0)) && (
              <div className="grid grid-cols-4 gap-3">
                {/* Existing Detail Photos */}
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

                {/* Newly Selected Previews */}
                {previewUrls.slice(existingImages.length === 0 ? 1 : 0).map((url, idx) => {
                  const fileIdx = existingImages.length === 0 ? idx + 1 : idx;
                  return (
                    <div key={url} className="relative group rounded-xl overflow-hidden border-2 border-yellow-500/80 shadow-sm bg-secondary aspect-square w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Pending ${idx + 1}`} className="object-cover w-full h-full opacity-90" />
                      <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                        Pending
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(fileIdx)}
                        className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons: Select Photos & Save/Upload Button */}
          <div className="flex flex-col gap-2">
            {totalPhotosCount < 5 && (
              <button
                type="button"
                onClick={handleSelectFilesClick}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {totalPhotosCount === 0 ? "Select Photos" : `+ Select More Photos (${totalPhotosCount}/5)`}
              </button>
            )}

            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleUploadAllSelected}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {loading ? 'Uploading Photos...' : `Upload Selected Photos (${selectedFiles.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <p className={`text-xs font-bold ${message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

