'use client';

import { useState } from 'react';
import { FiTrash2, FiMenu } from 'react-icons/fi';
import { ThumbnailPreview } from './ThumbnailPreview';
import type { PropertyImage } from '../types';

interface ImageCardProps {
  image: PropertyImage;
  onDelete: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('fr-CM', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ImageCard({ image, onDelete, dragHandleProps }: ImageCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <FiMenu className="h-5 w-5" />
      </div>

      {/* Thumbnail */}
      <ThumbnailPreview
        src={image.thumbnail_url ?? image.url}
        alt="property photo"
        width={64}
        height={48}
        className="rounded shrink-0"
      />

      {/* Meta */}
      <div className="flex flex-1 flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-700">
          #{image.display_order + 1}
        </span>
        <span className="text-xs text-gray-500">{formatBytes(image.file_size)}</span>
        <span className="text-xs text-gray-400">{formatDate(image.uploaded_at)}</span>
      </div>

      {/* Delete with confirmation */}
      {confirming ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => { onDelete(image.id); setConfirming(false); }}
            className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete image"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
