import * as ExpoLocation from 'expo-location';
import type { GeoPoint, Location } from '@cloud6/shared';
import type { GeocodingProvider } from './geocodingProvider';

/** GeocodingProvider backed by Expo's device reverse-geocoding API. */
export const expoGeocodingProvider: GeocodingProvider = {
  async reverseGeocode(point: GeoPoint): Promise<Partial<Location>> {
    const [result] = await ExpoLocation.reverseGeocodeAsync({
      latitude: point.latitude,
      longitude: point.longitude,
    });

    if (!result) {
      return {};
    }

    return {
      name: result.name ?? undefined,
      address: result.street ?? undefined,
      city: result.city ?? undefined,
      state: result.region ?? undefined,
      country: result.country ?? undefined,
    };
  },
};
