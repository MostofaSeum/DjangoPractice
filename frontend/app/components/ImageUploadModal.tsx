'use client';

import { useState, useEffect } from 'react';

interface ImageUploadModalProps {
  productId: number;
  onSuccess?: () => void;
}

export default function ImageUploadModal({ productId, onSuccess }: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if user is staff/admin from stored user info or token
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(Boolean(user.is_staff));
      } catch (e) {
        setIsAdmin(false);
      }
    }
  }, []);

  if (!isAdmin) {
    return null; // Only render for admins
  }

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

    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

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
        throw new Error(errData.image?.[0] || errData.detail || 'Upload failed. Only admins can upload.');
      }

      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setFile(null);
      setPreview(null);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6 p-4 border border-dashed border-[#3a3532]/30 rounded-lg bg-[#3a3532]/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#3a3532]">
          🔒 Admin Control: Upload Product Photo
        </h4>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-xs text-[#3a3532]
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-xs file:font-semibold
            file:bg-[#3a3532] file:text-[#e6e0d4]
            hover:file:opacity-90 cursor-pointer"
        />

        {preview && (
          <div className="relative w-24 h-24 rounded border border-[#3a3532]/20 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="object-cover w-full h-full" />
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="px-6 py-2 bg-[#3a3532] text-[#e6e0d4] text-xs font-bold uppercase tracking-wider rounded disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </form>

      {message && (
        <p className={`mt-3 text-xs font-bold ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
