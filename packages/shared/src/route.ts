import type { GeoPoint } from './geo';

/**
 * Normalized route between two points — purely geographic/travel data.
 * Deliberately excludes weather and recommendation fields; a future
 * Journey Weather Engine will consume `coordinates` + `durationMinutes`
 * to sample points and query weather at estimated arrival times, but
 * that logic does not belong on this model.
 */
export interface Route {
  start: GeoPoint;
  destination: GeoPoint;
  distanceKm: number;
  durationMinutes: number;
  coordinates: GeoPoint[];
}
