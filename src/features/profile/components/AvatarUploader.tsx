'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FiUpload, FiUser } from 'react-icons/fi';
import { validateAvatarFile } from '@/features/profile/utils/validation';

interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  onAvatarChange: (newUrl: string) => void;
  isLoading: boolean;
}

function centerSquareCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarUploader({ currentAvatarUrl, onAvatarChange, isLoading }: AvatarUploaderProps) {
  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const imgRef = useRef<HTMLImageElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid file');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setSrcImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1,
    disabled: isLoading || isUploading,
  });

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }

  async function handleSave() {
    if (!completedCrop || !imgRef.current) return;
    setIsUploading(true);
    setError(null);
    try {
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas to blob failed'))),
          'image/png'
        )
      );
      const formData = new FormData();
      formData.append('file', blob, 'avatar.png');
      const res = await fetch('/api/profiles/avatar', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Upload failed');
        return;
      }
      const newUrl: string = json.data?.avatarUrl ?? json.avatar_url ?? '';
      setPreviewUrl(newUrl);
      onAvatarChange(newUrl);
      setSrcImage(null);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Current avatar preview */}
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
        {previewUrl ? (
          <Image src={previewUrl} alt="Avatar" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiUser className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        } ${isLoading || isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <FiUpload className="mx-auto mb-1 h-5 w-5 text-gray-400" />
        <p className="text-sm text-gray-500">
          {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-gray-400">JPEG or PNG, max 2 MB</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Crop modal */}
      {srcImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Crop Avatar</h3>
            <div className="flex justify-center overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcImage}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: '360px' }}
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setSrcImage(null); setError(null); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading || !completedCrop}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUploading ? 'Saving...' : 'Save Avatar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
