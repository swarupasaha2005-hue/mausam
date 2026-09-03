import { LocationError, type GeoPoint, type Location } from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';
import type { GeocodingProvider } from './geocodingProvider';

interface GeocodingResponse {
  results: GeoPoint[];
}

/**
 * GeocodingProvider backed by the CLOUD6 backend's `/api/geocoding`
 * (Open-Meteo Geocoding API). Expo's on-device geocoder
 * (`ExpoLocation.geocodeAsync`) is native-only — it throws unconditionally
 * on web — so this is the provider used on the web platform. Reverse
 * geocoding has no backend endpoint (it's a "nice to have" city label,
 * not required by any flow), so it resolves to an empty result rather
 * than failing the caller.
 */
export const backendGeocodingProvider: GeocodingProvider = {
  async reverseGeocode(_point: GeoPoint): Promise<Partial<Location>> {
    return {};
  },

  async geocode(query: string): Promise<GeoPoint[]> {
    try {
      const response = await apiRequest<GeocodingResponse>('/api/geocoding', { query: { query } });
      return response.results;
    } catch (cause) {
      if (cause instanceof ApiHttpError) {
        throw new LocationError('GEOCODING_FAILED', cause.message);
      }
      if (cause instanceof ApiInvalidResponseError) {
        throw new LocationError('GEOCODING_FAILED', cause.message);
      }
      if (cause instanceof ApiRequestFailedError) {
        throw new LocationError('GEOCODING_FAILED', cause.message);
      }
      throw new LocationError('GEOCODING_FAILED');
    }
  },
};
