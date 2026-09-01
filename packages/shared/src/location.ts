import type { GeoPoint } from './geo';

/**
 * A user-facing location: a GeoPoint plus optional human-readable context.
 * Deliberately excludes weather fields — weather is a separate domain that
 * references a Location/GeoPoint rather than being embedded in it.
 */
export interface Location extends GeoPoint {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}
