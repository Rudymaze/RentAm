'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FiMapPin } from 'react-icons/fi';

// Cameroon bounding box
const CAMEROON_BOUNDS = {
  minLat: 1.65,
  maxLat: 13.08,
  minLng: 8.3,
  maxLng: 16.19,
};
const CAMEROON_CENTER: [number, number] = [5.9631, 10.1591];

function isWithinCameroon(lat: number, lng: number): boolean {
  return (
    lat >= CAMEROON_BOUNDS.minLat &&
    lat <= CAMEROON_BOUNDS.maxLat &&
    lng >= CAMEROON_BOUNDS.minLng &&
    lng <= CAMEROON_BOUNDS.maxLng
  );
}

// Dynamically import the Leaflet map to avoid SSR issues
const LeafletMap = dynamic(() => import('./LocationPickerMap'), { ssr: false });

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ initialLat, initialLng, onCoordinatesChange }: LocationPickerProps) {
  const [lat, setLat] = useState<string>(initialLat != null ? String(initialLat) : '');
  const [lng, setLng] = useState<string>(initialLng != null ? String(initialLng) : '');
  const [marker, setMarker] = useState<[number, number] | null>(
    initialLat != null && initialLng != null ? [initialLat, initialLng] : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleMapClick = useCallback(
    (newLat: number, newLng: number) => {
      if (!isWithinCameroon(newLat, newLng)) {
        setError('Location must be within Cameroon');
        return;
      }
      const rLat = parseFloat(newLat.toFixed(6));
      const rLng = parseFloat(newLng.toFixed(6));
      setMarker([rLat, rLng]);
      setLat(String(rLat));
      setLng(String(rLng));
      setError(null);
      onCoordinatesChange(rLat, rLng);
    },
    [onCoordinatesChange]
  );

  function handleManualChange() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError('Please enter valid numeric coordinates');
      return;
    }
    if (!isWithinCameroon(parsedLat, parsedLng)) {
      setError('Coordinates must be within Cameroon bounds');
      return;
    }
    setMarker([parsedLat, parsedLng]);
    setError(null);
    onCoordinatesChange(parsedLat, parsedLng);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-gray-200" style={{ height: 320 }}>
        <LeafletMap
          center={marker ?? CAMEROON_CENTER}
          marker={marker}
          onMapClick={handleMapClick}
        />
      </div>

      {marker && (
        <p className="flex items-center gap-1.5 text-xs text-indigo-600">
          <FiMapPin className="h-3.5 w-3.5" />
          Selected: {marker[0]}, {marker[1]}
        </p>
      )}

      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-gray-600">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onBlur={handleManualChange}
            placeholder="e.g. 3.8480"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-medium text-gray-600">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onBlur={handleManualChange}
            placeholder="e.g. 11.5021"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
