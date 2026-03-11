// SSR-safe exports (safe to import anywhere)
export { MapContainer } from './MapContainer';
export type { MapContainerProps } from './MapContainer';
export { SearchBar } from './SearchBar';
export { CoordinateDisplay } from './CoordinateDisplay';
export { FavoritesBar } from './FavoritesBar';
export { ZoomControls } from './ZoomControls';

// Leaflet-dependent exports — must only be used inside MapContainerInner (ssr:false context)
// Prefer using MapContainer's `cities` / `location` props instead.
export { CityPinMarker } from './CityPinMarker';
export { LocationMarker } from './LocationMarker';
