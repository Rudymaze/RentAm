'use client';

import dynamic from 'next/dynamic';
import type { MapContainerInnerProps } from './MapContainerInner';

export type { MapContainerInnerProps as MapContainerProps };

const MapInner = dynamic(
  () => import('./MapContainerInner').then((m) => ({ default: m.MapContainerInner })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    ),
  }
);

interface MapContainerWrapperProps extends MapContainerInnerProps {
  className?: string;
}

/**
 * SSR-safe Leaflet map wrapper.
 * Loads the map only on the client to avoid Leaflet's window access at SSR time.
 */
export function MapContainer({ className = 'h-full w-full', ...props }: MapContainerWrapperProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <MapInner {...props} />
    </div>
  );
}
