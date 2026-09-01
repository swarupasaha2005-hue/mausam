import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@cloud6/shared';
import type { MapViewProps } from './types';

// Leaflet's default marker icon paths break under bundlers unless
// explicitly re-pointed at CDN assets — a well-known Leaflet/webpack quirk.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function toLatLng(point: GeoPoint): [number, number] {
  return [point.latitude, point.longitude];
}

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(points.map(toLatLng), { padding: [24, 24] });
  }, [map, points]);
  return null;
}

/**
 * Web map rendering, backed by Leaflet (via react-leaflet). Resolved
 * automatically by Metro's `.web.tsx` platform extension — only the web
 * bundle imports Leaflet. Pure visualization: no routing requests here.
 */
export default function MapView({ start, destination, routeCoordinates }: MapViewProps) {
  const points =
    routeCoordinates.length > 0
      ? routeCoordinates
      : ([start, destination].filter(Boolean) as GeoPoint[]);
  const center = points[0] ?? { latitude: 20, longitude: 0 };

  return (
    <MapContainer
      center={toLatLng(center)}
      zoom={12}
      style={{ height: 300, width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {start && <Marker position={toLatLng(start)} />}
      {destination && <Marker position={toLatLng(destination)} />}
      {routeCoordinates.length > 1 && (
        <Polyline positions={routeCoordinates.map(toLatLng)} color="#2563eb" />
      )}
      {points.length > 0 && <FitBounds points={points} />}
    </MapContainer>
  );
}
