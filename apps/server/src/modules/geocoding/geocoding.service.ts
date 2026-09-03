import { LocationError, type GeoPoint } from '@cloud6/shared';
import { openMeteoGeocodingProvider } from '../../integrations/geocoding/openmeteo/openMeteo.geocoding.provider';
import { haversineDistanceKm } from '../journey/journey.distance';
import type { GeocodingProvider } from './geocoding.types';

/**
 * Open-Meteo's geocoder matches single place names well but often returns
 * nothing for a compound "neighborhood, city" query — its database simply
 * doesn't index that exact string. A neighborhood is expected to be close
 * to its containing city, so results further than this from the city
 * anchor are treated as an unrelated same-named place (e.g. "Salt Lake"
 * the city in Utah), not a real match.
 */
const FALLBACK_MAX_DISTANCE_KM = 150;

function splitQueryParts(query: string): string[] {
  return query
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function nearest(points: GeoPoint[], anchor: GeoPoint): GeoPoint {
  return points.reduce((closest, point) =>
    haversineDistanceKm(point, anchor) < haversineDistanceKm(closest, anchor) ? point : closest,
  );
}

/**
 * Application-facing geocoding interface. Depends on GeocodingProvider,
 * never on Open-Meteo directly. Exists so destination search works on
 * every platform — Expo's on-device geocoder is native-only, so the web
 * client routes through this endpoint instead.
 */
export class GeocodingService {
  constructor(private readonly provider: GeocodingProvider = openMeteoGeocodingProvider) {}

  async geocode(query: string): Promise<GeoPoint[]> {
    const trimmed = query?.trim();
    if (!trimmed) {
      throw new LocationError('GEOCODING_FAILED', 'query is required');
    }

    try {
      const exact = await this.provider.geocode(trimmed);
      if (exact.length > 0) {
        return exact;
      }
      return await this.geocodeWithFallback(trimmed);
    } catch (cause) {
      throw cause instanceof LocationError
        ? cause
        : new LocationError('GEOCODING_FAILED', 'Unexpected geocoding provider failure');
    }
  }

  /**
   * Only engages for a compound "specific, broader" query (e.g. "Salt
   * Lake, Kolkata") that returned zero exact matches. Geocodes the
   * broader part (last segment) as an anchor, then geocodes the specific
   * part (first segment) and keeps only the candidate closest to that
   * anchor — and only if it's plausibly the same place
   * (FALLBACK_MAX_DISTANCE_KM). A single-word query that fails outright
   * has nothing to disambiguate against, so it stays empty rather than
   * guessing.
   */
  private async geocodeWithFallback(query: string): Promise<GeoPoint[]> {
    const parts = splitQueryParts(query);
    if (parts.length < 2) {
      return [];
    }

    const specific = parts[0];
    const broader = parts[parts.length - 1];

    const anchorResults = await this.provider.geocode(broader);
    if (anchorResults.length === 0) {
      return [];
    }
    const anchor = anchorResults[0];

    const specificResults = await this.provider.geocode(specific);
    if (specificResults.length === 0) {
      // The specific part didn't resolve at all — silently falling back
      // to the broader anchor would mean guessing a location the user
      // never actually named (e.g. a typo in "specific" resolving to the
      // city center regardless). Ambiguous, so report no match instead.
      return [];
    }

    const closest = nearest(specificResults, anchor);
    return haversineDistanceKm(closest, anchor) <= FALLBACK_MAX_DISTANCE_KM ? [closest] : [];
  }
}

export const geocodingService = new GeocodingService();
