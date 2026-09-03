import { LocationError, isValidGeoPoint, type GeoPoint } from '@cloud6/shared';
import { env } from '../../../config/env';
import type { GeocodingProvider } from '../../../modules/geocoding/geocoding.types';

interface OpenMeteoGeocodingResult {
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoGeocodingResult[];
}

/** GeocodingProvider backed by Open-Meteo's free, keyless Geocoding API — the same provider family already used for weather. */
export const openMeteoGeocodingProvider: GeocodingProvider = {
  async geocode(query: string): Promise<GeoPoint[]> {
    const url = `${env.geocodingBaseUrl}?name=${encodeURIComponent(query)}&count=5`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.geocodingRequestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (cause) {
      const isAbort = cause instanceof Error && cause.name === 'AbortError';
      throw new LocationError(
        'GEOCODING_FAILED',
        isAbort ? 'Geocoding request timed out' : 'Geocoding request failed',
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new LocationError('GEOCODING_FAILED', `Geocoding provider responded with HTTP ${response.status}`);
    }

    let body: OpenMeteoGeocodingResponse;
    try {
      body = (await response.json()) as OpenMeteoGeocodingResponse;
    } catch {
      throw new LocationError('GEOCODING_FAILED', 'Geocoding provider response was not valid JSON');
    }

    return (body.results ?? [])
      .map((result) => ({ latitude: result.latitude, longitude: result.longitude }))
      .filter(isValidGeoPoint);
  },
};
