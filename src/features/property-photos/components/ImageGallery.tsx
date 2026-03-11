'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ThumbnailPreview } from './ThumbnailPreview';
import type { PropertyImage } from '../types';

interface ImageGalleryProps {
  images: PropertyImage[];
  loading?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageGallery({ images, loading = false }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
        No photos yet
      </div>
    );
  }

  const current = lightboxIndex !== null ? images[lightboxIndex] : null;

  function prev() {
    if (lightboxIndex !== null && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  }
  function next() {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) setLightboxIndex(lightboxIndex + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') setLightboxIndex(null);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ThumbnailPreview
              src={img.thumbnail_url ?? img.url}
              alt={`Photo ${idx + 1}`}
              className="absolute inset-0 h-full w-full"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 to-transparent">
              <div />
              <span className="self-end text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                {formatBytes(img.file_size)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && lightboxIndex !== null && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightboxIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div
            className="relative flex h-full w-full max-h-screen max-w-5xl items-center justify-center p-12"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-full w-full">
              <Image
                src={current.url}
                alt="Full size"
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
                aria-label="Previous"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Next */}
            {lightboxIndex < images.length - 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
                aria-label="Next"
              >
                <FiChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-sm text-white">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
