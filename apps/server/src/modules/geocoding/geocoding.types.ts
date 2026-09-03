import type { GeoPoint } from '@cloud6/shared';

/**
 * Port the geocoding module depends on. `openMeteoGeocodingProvider` is the
 * only adapter today, but nothing here is Open-Meteo-specific.
 */
export interface GeocodingProvider {
  geocode(query: string): Promise<GeoPoint[]>;
}
