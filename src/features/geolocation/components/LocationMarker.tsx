/**
 * LocationMarker — A draggable react-leaflet Marker for the user's selected property location.
 *
 * IMPORTANT: Must only be rendered inside MapContainerInner (loaded via dynamic ssr:false).
 * In practice, use MapContainer's `location` prop instead of rendering this directly.
 */
'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:28px">
    <div style="width:20px;height:20px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
  </div>`,
  iconSize: [24, 28],
  iconAnchor: [10, 26],
});

interface LocationMarkerProps {
  latitude: number;
  longitude: number;
  is_draggable: boolean;
  on_drag_end?: (lat: number, lng: number) => void;
}

export function LocationMarker({
  latitude,
  longitude,
  is_draggable,
  on_drag_end,
}: LocationMarkerProps) {
  return (
    <Marker
      position={[latitude, longitude]}
      icon={locationIcon}
      draggable={is_draggable}
      eventHandlers={{
        dragend(e) {
          const ll = (e.target as L.Marker).getLatLng();
          on_drag_end?.(ll.lat, ll.lng);
        },
      }}
    >
      <Popup>
        <span className="font-mono text-xs">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </Popup>
    </Marker>
  );
}
