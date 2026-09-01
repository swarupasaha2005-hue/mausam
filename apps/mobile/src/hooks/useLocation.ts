import { useCallback, useEffect, useState } from 'react';
import { LocationError, type Location } from '@cloud6/shared';
import {
  geocodingService,
  locationService,
  type LocationPermissionStatus,
} from '../services/location';

interface UseLocationState {
  location: Location | null;
  loading: boolean;
  error: LocationError | null;
  permissionStatus: LocationPermissionStatus;
}

interface UseLocationResult extends UseLocationState {
  requestPermission: () => Promise<LocationPermissionStatus>;
  refreshLocation: () => Promise<void>;
}

/**
 * Clean interface for the rest of the app. All Expo/device-specific
 * behavior lives in LocationService and GeocodingService, not here.
 */
export function useLocation(): UseLocationResult {
  const [state, setState] = useState<UseLocationState>({
    location: null,
    loading: false,
    error: null,
    permissionStatus: 'undetermined',
  });

  useEffect(() => {
    let cancelled = false;
    locationService.checkPermission().then((permissionStatus) => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, permissionStatus }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const permissionStatus = await locationService.requestPermission();
    setState((prev) => ({ ...prev, permissionStatus }));
    return permissionStatus;
  }, []);

  const refreshLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const point = await locationService.getCurrentLocation();
      const place = await geocodingService.reverseGeocode(point).catch(() => ({}));

      setState((prev) => ({
        ...prev,
        location: { ...point, ...place },
        loading: false,
        permissionStatus: 'granted',
      }));
    } catch (cause) {
      const error =
        cause instanceof LocationError ? cause : new LocationError('LOCATION_UNAVAILABLE');
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, []);

  return { ...state, requestPermission, refreshLocation };
}
