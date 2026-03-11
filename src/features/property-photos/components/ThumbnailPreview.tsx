'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiImage } from 'react-icons/fi';

interface ThumbnailPreviewProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ThumbnailPreview({
  src,
  alt = 'Image',
  width = 120,
  height = 90,
  className = '',
}: ThumbnailPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <FiImage className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={!className.includes('h-') ? { width, height } : undefined}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 rounded" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 120px, 240px"
        className={`object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}
