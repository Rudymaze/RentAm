/**
 * CityPinMarker — A react-leaflet Marker for a Cameroon city.
 *
 * IMPORTANT: This component uses Leaflet internals and must only be rendered
 * inside a MapContainerInner (which is loaded via dynamic with ssr:false).
 * Do NOT import this file in code that runs during SSR.
 *
 * In practice, use MapContainer's `cities` prop instead of rendering this directly.
 */
'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { City } from '../types';

const defaultIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#6366f1;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const selectedIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#4f46e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface CityPinMarkerProps {
  city: City;
  is_selected: boolean;
  on_click: (city: City) => void;
}

export function CityPinMarker({ city, is_selected, on_click }: CityPinMarkerProps) {
  return (
    <Marker
      position={[city.latitude, city.longitude]}
      icon={is_selected ? selectedIcon : defaultIcon}
      eventHandlers={{ click: () => on_click(city) }}
    >
      <Popup>
        <strong>{city.nameEn}</strong>
        <br />
        <span className="text-xs text-gray-500">{city.region}</span>
      </Popup>
    </Marker>
  );
}
