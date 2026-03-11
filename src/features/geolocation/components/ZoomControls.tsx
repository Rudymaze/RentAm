'use client';

import { FiPlus, FiMinus } from 'react-icons/fi';

const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

interface ZoomControlsProps {
  zoom_level: number;
  on_zoom_change: (zoom: number) => void;
  className?: string;
}

export function ZoomControls({ zoom_level, on_zoom_change, className = '' }: ZoomControlsProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => on_zoom_change(Math.min(zoom_level + 1, MAX_ZOOM))}
        disabled={zoom_level >= MAX_ZOOM}
        aria-label="Zoom in"
        className="flex h-8 w-8 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiPlus className="h-4 w-4" />
      </button>

      <div className="border-t border-gray-200" />

      <button
        type="button"
        onClick={() => on_zoom_change(Math.max(zoom_level - 1, MIN_ZOOM))}
        disabled={zoom_level <= MIN_ZOOM}
        aria-label="Zoom out"
        className="flex h-8 w-8 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FiMinus className="h-4 w-4" />
      </button>
    </div>
  );
}
