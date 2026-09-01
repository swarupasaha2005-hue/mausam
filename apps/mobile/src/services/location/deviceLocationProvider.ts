import type { GeoPoint } from '@cloud6/shared';
import type { LocationPermissionStatus } from './permission';

/**
 * Contract for anything that can supply device coordinates — the real Expo
 * GPS provider, or a development mock. LocationService depends on this
 * interface, never on a concrete provider.
 */
export interface DeviceLocationProvider {
  checkPermission(): Promise<LocationPermissionStatus>;
  requestPermission(): Promise<LocationPermissionStatus>;
  isLocationEnabled(): Promise<boolean>;
  getCurrentPosition(): Promise<GeoPoint>;
}
