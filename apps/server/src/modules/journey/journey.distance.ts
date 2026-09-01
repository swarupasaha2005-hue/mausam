import type { GeoPoint } from '@cloud6/shared';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle (Haversine) distance between two points, in kilometers. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

/**
 * Cumulative distance (km) from the first coordinate to each coordinate
 * in order. `cumulativeDistanceKm(coords)[0]` is always 0; the last
 * entry is the total polyline distance.
 */
export function cumulativeDistanceKm(coordinates: GeoPoint[]): number[] {
  const cumulative: number[] = [0];
  for (let i = 1; i < coordinates.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineDistanceKm(coordinates[i - 1], coordinates[i]));
  }
  return cumulative;
}
