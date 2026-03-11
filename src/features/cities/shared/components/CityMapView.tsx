'use client';

import { useEffect, useRef } from 'react';
import type { City } from '@/features/cities/shared/types';

// Leaflet is imported dynamically to avoid SSR issues
interface CityMapViewProps {
  cities: City[];
  selectedCities?: string[];
  onCityClick?: (city: City) => void;
  center?: { lat: number; lon: number };
  zoom?: number;
  className?: string;
}

const CAMEROON_CENTER = { lat: 5.9631, lon: 12.3581 };
const DEFAULT_ZOOM = 6;

export function CityMapView({
  cities,
  selectedCities = [],
  onCityClick,
  center = CAMEROON_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
}: CityMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    let map: ReturnType<typeof import('leaflet')['map']>;

    import('leaflet').then((L) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(mapRef.current!).setView([center.lat, center.lon], zoom);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      cities.forEach((city) => {
        const isSelected = selectedCities.includes(city.id);
        const icon = isSelected
          ? L.divIcon({
              html: `<div style="background:#6366f1;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #6366f1"></div>`,
              className: '',
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })
          : L.divIcon({
              html: `<div style="background:#94a3b8;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>`,
              className: '',
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            });

        const marker = L.marker([city.latitude, city.longitude], { icon }).addTo(map);

        marker.bindPopup(
          `<div style="min-width:120px">
            <p style="font-weight:600;margin:0 0 2px">${city.nameEn}</p>
            <p style="color:#6b7280;font-size:12px;margin:0">${city.region}</p>
          </div>`
        );

        if (onCityClick) {
          marker.on('click', () => onCityClick(city));
        }
      });
    });

    return () => {
      if (map) map.remove();
      leafletMapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-xl overflow-hidden border border-gray-200 ${className}`}
      style={{ minHeight: '320px' }}
      aria-label="City map"
    />
  );
}
