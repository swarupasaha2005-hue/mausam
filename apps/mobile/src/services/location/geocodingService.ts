import { LocationError, type GeoPoint, type Location } from '@cloud6/shared';
import { expoGeocodingProvider } from './expoGeocodingProvider';
import type { GeocodingProvider } from './geocodingProvider';

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

export const geocodingService = new GeocodingService(expoGeocodingProvider);
