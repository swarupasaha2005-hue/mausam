import { Platform } from 'react-native';
import { LocationError, type GeoPoint, type Location } from '@cloud6/shared';
import { backendGeocodingProvider } from './backendGeocodingProvider';
import { expoGeocodingProvider } from './expoGeocodingProvider';
import type { GeocodingProvider } from './geocodingProvider';

function resolveDefaultProvider(): GeocodingProvider {
  // ExpoLocation.geocodeAsync/reverseGeocodeAsync are native-only — they
  // throw unconditionally on web (no browser has a built-in geocoder), so
  // web goes through the backend's Open-Meteo-backed /api/geocoding
  // instead. Native keeps the on-device geocoder — it's already fast and
  // reliable there, no network round trip needed.
  return Platform.OS === 'web' ? backendGeocodingProvider : expoGeocodingProvider;
}

/**
 * The rest of the app should depend on this service, not on a specific
 * GeocodingProvider. Swapping providers means changing the constructor
 * argument here only.
 */
export class GeocodingService {
  constructor(private readonly provider: GeocodingProvider) {}

  async reverseGeocode(point: GeoPoint): Promise<Partial<Location>> {
    try {
      return await this.provider.reverseGeocode(point);
    } catch (cause) {
      throw new LocationError(
        'GEOCODING_FAILED',
        cause instanceof Error ? cause.message : undefined,
      );
    }
  }

  async geocode(query: string): Promise<GeoPoint[]> {
    try {
      return await this.provider.geocode(query);
    } catch (cause) {
      throw new LocationError(
        'GEOCODING_FAILED',
        cause instanceof Error ? cause.message : undefined,
      );
    }
  }
}

export const geocodingService = new GeocodingService(resolveDefaultProvider());
