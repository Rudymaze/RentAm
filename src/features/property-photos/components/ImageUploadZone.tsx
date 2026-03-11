'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import type { PropertyImage } from '../types';

interface FileEntry {
  file: File;
  preview: string;
  error?: string;
}

interface UploadProgress {
  filename: string;
  progress: number;
  done: boolean;
  error?: string;
}

interface ImageUploadZoneProps {
  listingId?: string;
  draftId?: string;
  maxFiles?: number;
  onUploaded: (images: PropertyImage[]) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MIN_WIDTH = 400;
const MIN_HEIGHT = 300;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function validateImageFile(file: File): Promise<string | undefined> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Only JPEG and PNG are allowed';
  if (file.size > MAX_SIZE) return 'File must be smaller than 5 MB';

  const url = URL.createObjectURL(file);
  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });
  URL.revokeObjectURL(url);

  if (dims.w < MIN_WIDTH) return `Image must be at least ${MIN_WIDTH}px wide (got ${dims.w}px)`;
  if (dims.h < MIN_HEIGHT) return `Image must be at least ${MIN_HEIGHT}px tall (got ${dims.h}px)`;
  return undefined;
}

export function ImageUploadZone({
  listingId,
  draftId,
  maxFiles = 10,
  onUploaded,
}: ImageUploadZoneProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setGlobalError(null);
      const limited = acceptedFiles.slice(0, maxFiles);
      const validated: FileEntry[] = await Promise.all(
        limited.map(async (file) => ({
          file,
          preview: URL.createObjectURL(file),
          error: await validateImageFile(file),
        }))
      );
      setEntries(validated);
      setProgress([]);
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: MAX_SIZE,
    disabled: uploading,
  });

  function removeEntry(index: number) {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleUpload() {
    const valid = entries.filter((e) => !e.error);
    if (valid.length === 0) return;

    setUploading(true);
    setGlobalError(null);
    setProgress(valid.map((e) => ({ filename: e.file.name, progress: 0, done: false })));

    // Simulate incremental progress while the request is in flight
    const timer = setInterval(() => {
      setProgress((prev) =>
        prev.map((p) =>
          p.done || p.error ? p : { ...p, progress: Math.min(p.progress + 15, 85) }
        )
      );
    }, 300);

    const formData = new FormData();
    valid.forEach((e) => formData.append('files', e.file));
    if (listingId) formData.append('listing_id', listingId);
    if (draftId) formData.append('draft_id', draftId);

    try {
      const res = await fetch('/api/properties/upload-images', { method: 'POST', body: formData });
      const json = await res.json();
      clearInterval(timer);

      if (!res.ok || !json.success) {
        setGlobalError(json.error ?? 'Upload failed, please try again.');
        setProgress((prev) => prev.map((p) => ({ ...p, error: 'Failed' })));
        return;
      }

      setProgress((prev) => prev.map((p) => ({ ...p, progress: 100, done: true })));
      onUploaded(json.data?.images ?? []);

      // Clean up after a short delay so the user sees the success state
      setTimeout(() => {
        entries.forEach((e) => URL.revokeObjectURL(e.preview));
        setEntries([]);
        setProgress([]);
      }, 1200);
    } catch {
      clearInterval(timer);
      setGlobalError('Upload failed, please try again.');
      setProgress((prev) => prev.map((p) => ({ ...p, error: 'Failed' })));
    } finally {
      setUploading(false);
    }
  }

  const validCount = entries.filter((e) => !e.error).length;
  const totalSize = entries.reduce((acc, e) => acc + e.file.size, 0);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          uploading
            ? 'pointer-events-none border-gray-200 bg-gray-50 opacity-60'
            : isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <p className="font-medium text-gray-700">
          {isDragActive ? 'Drop images here' : 'Drag & drop images, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          JPEG or PNG · max 5 MB each · min 400&times;300 px · up to {maxFiles} files
        </p>
      </div>

      {/* Selected file previews */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {entries.length} file{entries.length !== 1 ? 's' : ''} selected ·{' '}
              {formatBytes(totalSize)} total
            </span>
            <button
              type="button"
              onClick={() => {
                entries.forEach((e) => URL.revokeObjectURL(e.preview));
                setEntries([]);
                setProgress([]);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.preview}
                  alt={entry.file.name}
                  className="h-full w-full object-cover"
                />
                {/* Validation error overlay */}
                {entry.error && (
                  <div className="absolute inset-0 flex items-end bg-red-500/70 p-1.5">
                    <span className="text-xs text-white leading-tight">{entry.error}</span>
                  </div>
                )}
                {/* Remove button */}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    aria-label="Remove"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-file upload progress */}
      {progress.length > 0 && (
        <div className="space-y-2">
          {progress.map((p, i) => (
            <div key={i} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="truncate max-w-[200px]">{p.filename}</span>
                <span className="flex items-center gap-1 shrink-0 ml-2">
                  {p.done ? (
                    <FiCheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : p.error ? (
                    <FiAlertCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    `${p.progress}%`
                  )}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.error ? 'bg-red-400' : p.done ? 'bg-green-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <p className="flex items-center gap-1.5 text-sm text-red-500">
          <FiAlertCircle className="h-4 w-4 shrink-0" />
          {globalError}
        </p>
      )}

      {/* Upload button */}
      {validCount > 0 && !uploading && progress.length === 0 && (
        <button
          type="button"
          onClick={handleUpload}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Upload {validCount} image{validCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
