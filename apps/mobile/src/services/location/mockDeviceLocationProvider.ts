import type { GeoPoint } from '@cloud6/shared';
import type { DeviceLocationProvider } from './deviceLocationProvider';

/**
 * Development-only stand-in for the real device GPS. Selected by
 * LocationService only when EXPO_PUBLIC_LOCATION_PROVIDER=mock is set —
 * useful when a simulator or dev environment can't provide real location.
 * Never used implicitly; must be opted into explicitly, and never in
 * production builds.
 */
const MOCK_COORDINATES: GeoPoint = { latitude: 22.5726, longitude: 88.3639 };

export const mockDeviceLocationProvider: DeviceLocationProvider = {
  async checkPermission() {
    return 'granted';
  },

  async requestPermission() {
    return 'granted';
  },

  async isLocationEnabled() {
    return true;
  },

  async getCurrentPosition(): Promise<GeoPoint> {
    return { ...MOCK_COORDINATES };
  },
};
