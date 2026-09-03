import { LocationError, isValidGeoPoint, type GeoPoint } from '@cloud6/shared';
import { expoDeviceLocationProvider } from './expoDeviceLocationProvider';
import { mockDeviceLocationProvider } from './mockDeviceLocationProvider';
import type { DeviceLocationProvider } from './deviceLocationProvider';
import type { LocationPermissionStatus } from './permission';

function resolveDefaultProvider(): DeviceLocationProvider {
  return process.env.EXPO_PUBLIC_LOCATION_PROVIDER === 'mock'
    ? mockDeviceLocationProvider
    : expoDeviceLocationProvider;
}

function devLog(...args: unknown[]): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[Cloud6 Location]', ...args);
  }
}

/**
 * Isolates all device location access behind a stable interface. Nothing
 * outside this module should talk to a DeviceLocationProvider directly.
 */
export class LocationService {
  constructor(private provider: DeviceLocationProvider = resolveDefaultProvider()) {}

  /**
   * Development-only: swap the active provider at runtime, e.g. the
   * /dev/connection diagnostic screen's "Use Test Location" control. Lets
   * the rest of the app (Home, Journey) be proven end-to-end even when
   * browser/device GPS permission isn't available in the current
   * environment. Never called from production code paths.
   */
  useDevProvider(provider: DeviceLocationProvider): void {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return;
    this.provider = provider;
  }

  checkPermission(): Promise<LocationPermissionStatus> {
    return this.provider.checkPermission();
  }

  requestPermission(): Promise<LocationPermissionStatus> {
    return this.provider.requestPermission();
  }

  async getCurrentLocation(): Promise<GeoPoint> {
    devLog('requesting permission (checking current status)');
    let permission = await this.provider.checkPermission();
    devLog('permission status:', permission);
    // 'undetermined' means the OS/browser has never actually shown the
    // permission prompt yet — checkPermission() only reads the current
    // state, it never triggers the dialog. Without this, the app would
    // fail with LOCATION_PERMISSION_DENIED on every first launch, before
    // the user ever had a chance to grant access.
    if (permission === 'undetermined') {
      devLog('permission undetermined — actively requesting it now');
      permission = await this.provider.requestPermission();
      devLog('permission result after request:', permission);
    }
    if (permission !== 'granted') {
      devLog('error: LOCATION_PERMISSION_DENIED');
      throw new LocationError('LOCATION_PERMISSION_DENIED');
    }

    const enabled = await this.provider.isLocationEnabled();
    if (!enabled) {
      devLog('error: LOCATION_UNAVAILABLE (location services disabled)');
      throw new LocationError('LOCATION_UNAVAILABLE');
    }

    let point: GeoPoint;
    try {
      point = await this.provider.getCurrentPosition();
      devLog('provider result:', point);
    } catch (cause) {
      devLog('error from provider.getCurrentPosition:', cause);
      if (cause instanceof LocationError) {
        throw cause;
      }
      throw new LocationError(
        'LOCATION_TIMEOUT',
        cause instanceof Error ? cause.message : undefined,
      );
    }

    if (!isValidGeoPoint(point)) {
      devLog('error: LOCATION_INVALID', point);
      throw new LocationError('LOCATION_INVALID');
    }

    return point;
  }
}

export const locationService = new LocationService();
