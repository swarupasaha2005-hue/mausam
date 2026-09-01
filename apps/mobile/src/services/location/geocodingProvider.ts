import type { GeoPoint, Location } from '@cloud6/shared';

/**
 * Provider-agnostic contract for turning coordinates into a human-readable
 * location. The rest of the app depends on GeocodingService, never on a
 * specific provider implementation.
 */
export interface GeocodingProvider {
  reverseGeocode(point: GeoPoint): Promise<Partial<Location>>;
  /** Forward geocoding: free-text address/place → candidate coordinates. */
  geocode(query: string): Promise<GeoPoint[]>;
}
