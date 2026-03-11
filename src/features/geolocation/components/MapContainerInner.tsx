'use client';

import { useEffect, useRef } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { City } from '../types';

// ─── Icons ──────────────────────────────────────────────────────────────────

const cityIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#6366f1;border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const selectedCityIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#4f46e5;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="width:18px;height:18px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [9, 22],
});

// ─── Internal sub-components ────────────────────────────────────────────────

interface EventHandlerProps {
  on_center_change?: (lat: number, lng: number) => void;
  on_zoom_change?: (zoom: number) => void;
  on_map_click?: (lat: number, lng: number) => void;
}

function MapEventHandler({ on_center_change, on_zoom_change, on_map_click }: EventHandlerProps) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      on_center_change?.(c.lat, c.lng);
    },
    zoomend(e) {
      on_zoom_change?.(e.target.getZoom());
    },
    click(e) {
      on_map_click?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapViewController({
  center_lat,
  center_lng,
  zoom_level,
}: {
  center_lat: number;
  center_lng: number;
  zoom_level: number;
}) {
  const map = useMap();
  const prev = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

  useEffect(() => {
    const p = prev.current;
    if (!p || p.lat !== center_lat || p.lng !== center_lng || p.zoom !== zoom_level) {
      map.setView([center_lat, center_lng], zoom_level, { animate: true });
      prev.current = { lat: center_lat, lng: center_lng, zoom: zoom_level };
    }
  }, [center_lat, center_lng, zoom_level, map]);

  return null;
}

// ─── City pin marker ─────────────────────────────────────────────────────────

interface CityPinMarkerInnerProps {
  city: City;
  is_selected: boolean;
  on_click: (city: City) => void;
}

function CityPinMarkerInner({ city, is_selected, on_click }: CityPinMarkerInnerProps) {
  return (
    <Marker
      position={[city.latitude, city.longitude]}
      icon={is_selected ? selectedCityIcon : cityIcon}
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

// ─── Location marker ─────────────────────────────────────────────────────────

interface LocationMarkerInnerProps {
  latitude: number;
  longitude: number;
  is_draggable: boolean;
  on_drag_end?: (lat: number, lng: number) => void;
}

function LocationMarkerInner({
  latitude,
  longitude,
  is_draggable,
  on_drag_end,
}: LocationMarkerInnerProps) {
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

// ─── Main export ─────────────────────────────────────────────────────────────

export interface MapContainerInnerProps {
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  cities?: Array<{ city: City; is_selected: boolean }>;
  location?: { latitude: number; longitude: number; is_draggable: boolean };
  on_center_change?: (lat: number, lng: number) => void;
  on_zoom_change?: (zoom: number) => void;
  on_city_click?: (city: City) => void;
  on_location_drag_end?: (lat: number, lng: number) => void;
  on_map_click?: (lat: number, lng: number) => void;
}

export function MapContainerInner({
  center_lat,
  center_lng,
  zoom_level,
  cities = [],
  location,
  on_center_change,
  on_zoom_change,
  on_city_click,
  on_location_drag_end,
  on_map_click,
}: MapContainerInnerProps) {
  return (
    <LeafletMapContainer
      center={[center_lat, center_lng]}
      zoom={zoom_level}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEventHandler
        on_center_change={on_center_change}
        on_zoom_change={on_zoom_change}
        on_map_click={on_map_click}
      />
      <MapViewController
        center_lat={center_lat}
        center_lng={center_lng}
        zoom_level={zoom_level}
      />

      {cities.map(({ city, is_selected }) => (
        <CityPinMarkerInner
          key={city.id}
          city={city}
          is_selected={is_selected}
          on_click={on_city_click ?? (() => {})}
        />
      ))}

      {location && (
        <LocationMarkerInner
          latitude={location.latitude}
          longitude={location.longitude}
          is_draggable={location.is_draggable}
          on_drag_end={on_location_drag_end}
        />
      )}
    </LeafletMapContainer>
  );
}
