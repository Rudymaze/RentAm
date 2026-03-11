'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import type { Image as ListingImage } from '../types';

interface PhotoUploaderProps {
  images: ListingImage[];
  onImagesChange: (images: ListingImage[]) => void;
  maxImages?: number;
  listingId?: string;
  draftId?: string;
}

interface UploadProgress {
  name: string;
  progress: number;
}

export function PhotoUploader({
  images,
  onImagesChange,
  maxImages = 10,
  listingId,
  draftId,
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const remaining = maxImages - images.length;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const toUpload = acceptedFiles.slice(0, remaining);
      if (toUpload.length === 0) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setError(null);
      setUploading(toUpload.map((f) => ({ name: f.name, progress: 0 })));

      const formData = new FormData();
      toUpload.forEach((f) => formData.append('files', f));
      if (listingId) formData.append('listing_id', listingId);
      if (draftId) formData.append('draft_id', draftId);

      try {
        const res = await fetch('/api/properties/upload-images', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error ?? 'Upload failed');
          return;
        }
        const uploaded: ListingImage[] = (json.data?.images ?? []).map(
          (img: { url: string; display_order: number; uploaded_at: string }) => ({
            url: img.url,
            order: img.display_order,
            uploadedAt: img.uploaded_at ?? new Date().toISOString(),
          })
        );
        onImagesChange([...images, ...uploaded]);
      } catch {
        setError('Upload failed. Please try again.');
      } finally {
        setUploading([]);
      }
    },
    [images, onImagesChange, maxImages, remaining, listingId, draftId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 5 * 1024 * 1024, // 5 MB
    disabled: remaining <= 0,
  });

  function removeImage(index: number) {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, order: i }));
    onImagesChange(updated);
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onImagesChange(updated.map((img, i) => ({ ...img, order: i })));
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {remaining > 0 && (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <FiUpload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive ? 'Drop images here' : 'Drag & drop or click to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            JPEG or PNG, max 5 MB each · {remaining} slot{remaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-1">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <FiImage className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{u.name}</span>
              <span>Uploading…</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, idx) => (
            <div key={img.url + idx} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <Image src={img.url} alt={`Photo ${idx + 1}`} fill className="object-cover" />

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx - 1)}
                    className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-white"
                  >
                    ←
                  </button>
                )}
                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, idx + 1)}
                    className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-bold text-gray-700 hover:bg-white"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
              >
                <FiX className="h-3 w-3" />
              </button>

              {/* Primary badge */}
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-indigo-600 px-1 py-0.5 text-xs font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
