'use client';

import { useState, useRef } from 'react';
import { FiSave, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { ImageCard } from './ImageCard';
import type { PropertyImage } from '../types';

interface ReorderableImageListProps {
  images: PropertyImage[];
  listingId: string;
  onReordered?: (images: PropertyImage[]) => void;
  onDelete: (id: string) => void;
}

export function ReorderableImageList({
  images: initialImages,
  listingId,
  onReordered,
  onDelete,
}: ReorderableImageListProps) {
  const [images, setImages] = useState<PropertyImage[]>(
    [...initialImages].sort((a, b) => a.display_order - b.display_order)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragIndex = useRef<number | null>(null);

  function handleDragStart(idx: number) {
    dragIndex.current = idx;
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setDragOverIndex(idx);

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(idx, 0, moved);
    dragIndex.current = idx;
    setImages(reordered.map((img, i) => ({ ...img, display_order: i })));
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOverIndex(null);
  }

  function handleDelete(id: string) {
    setImages((prev) =>
      prev
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, display_order: i }))
    );
    onDelete(id);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);

    try {
      const res = await fetch(`/api/properties/${listingId}/images/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          imageOrder: images.map((img) => ({ id: img.id, display_order: img.display_order })),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'Failed to save order. Please try again.');
        return;
      }

      setSavedOk(true);
      onReordered?.(images);
      setTimeout(() => setSavedOk(false), 2500);
    } catch {
      setSaveError('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
        No images to reorder
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Drag items to change the display order.</p>

      <div className="space-y-2">
        {images.map((img, idx) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`select-none transition-opacity ${
              dragOverIndex === idx ? 'opacity-60 scale-[0.98]' : 'opacity-100'
            }`}
          >
            <ImageCard
              image={img}
              onDelete={handleDelete}
              dragHandleProps={{ style: { cursor: 'grab' } }}
            />
          </div>
        ))}
      </div>

      {saveError && (
        <p className="flex items-center gap-1.5 text-sm text-red-500">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {saveError}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {savedOk ? (
          <>
            <FiCheckCircle className="h-4 w-4" />
            Saved!
          </>
        ) : (
          <>
            <FiSave className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Order'}
          </>
        )}
      </button>
    </div>
  );
}
