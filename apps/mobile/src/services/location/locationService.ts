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

/**
 * Isolates all device location access behind a stable interface. Nothing
 * outside this module should talk to a DeviceLocationProvider directly.
 */
export class LocationService {
  constructor(private readonly provider: DeviceLocationProvider = resolveDefaultProvider()) {}

  checkPermission(): Promise<LocationPermissionStatus> {
    return this.provider.checkPermission();
  }

  requestPermission(): Promise<LocationPermissionStatus> {
    return this.provider.requestPermission();
  }

  async getCurrentLocation(): Promise<GeoPoint> {
    const permission = await this.provider.checkPermission();
    if (permission !== 'granted') {
      throw new LocationError('LOCATION_PERMISSION_DENIED');
    }

    const enabled = await this.provider.isLocationEnabled();
    if (!enabled) {
      throw new LocationError('LOCATION_UNAVAILABLE');
    }

    let point: GeoPoint;
    try {
      point = await this.provider.getCurrentPosition();
    } catch (cause) {
      if (cause instanceof LocationError) {
        throw cause;
      }
      throw new LocationError(
        'LOCATION_TIMEOUT',
        cause instanceof Error ? cause.message : undefined,
      );
    }

    if (!isValidGeoPoint(point)) {
      throw new LocationError('LOCATION_INVALID');
    }

    return point;
  }
}

export const locationService = new LocationService();
