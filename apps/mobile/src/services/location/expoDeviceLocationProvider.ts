import * as ExpoLocation from 'expo-location';
import type { GeoPoint } from '@cloud6/shared';
import type { DeviceLocationProvider } from './deviceLocationProvider';
import type { LocationPermissionStatus } from './permission';

function mapPermissionStatus(
  status: ExpoLocation.PermissionStatus,
  canAskAgain: boolean,
): LocationPermissionStatus {
  switch (status) {
    case ExpoLocation.PermissionStatus.GRANTED:
      return 'granted';
    case ExpoLocation.PermissionStatus.DENIED:
      return canAskAgain ? 'denied' : 'restricted';
    default:
      return 'undetermined';
  }
}

/** DeviceLocationProvider backed by the real Expo/device GPS. */
export const expoDeviceLocationProvider: DeviceLocationProvider = {
  async checkPermission(): Promise<LocationPermissionStatus> {
    const { status, canAskAgain } = await ExpoLocation.getForegroundPermissionsAsync();
    return mapPermissionStatus(status, canAskAgain);
  },

  async requestPermission(): Promise<LocationPermissionStatus> {
    const { status, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
    return mapPermissionStatus(status, canAskAgain);
  },

  async isLocationEnabled(): Promise<boolean> {
    return ExpoLocation.hasServicesEnabledAsync();
  },

  async getCurrentPosition(): Promise<GeoPoint> {
    const result = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  },
};
