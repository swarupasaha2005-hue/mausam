import { LocationError } from '@cloud6/shared';
import { useLocation } from './useLocation';
import { geocodingService, locationService } from '../services/location';
import { act, flush, renderHook } from '../test-utils/renderHook';

jest.mock('../services/location', () => ({
  locationService: {
    checkPermission: jest.fn(),
    requestPermission: jest.fn(),
    getCurrentLocation: jest.fn(),
  },
  geocodingService: {
    reverseGeocode: jest.fn(),
  },
}));

const mockedLocationService = jest.mocked(locationService);
const mockedGeocodingService = jest.mocked(geocodingService);

beforeEach(() => {
  jest.clearAllMocks();
  mockedLocationService.checkPermission.mockResolvedValue('undetermined');
});

describe('useLocation', () => {
  it('starts with an empty, non-loading, error-free state', async () => {
    const { result } = renderHook(() => useLocation());
    await flush();

    expect(result.current.permissionStatus).toBe('undetermined');
    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reflects an already-granted permission on mount', async () => {
    mockedLocationService.checkPermission.mockResolvedValue('granted');
    const { result } = renderHook(() => useLocation());
    await flush();

    expect(result.current.permissionStatus).toBe('granted');
  });

  it('updates permission state after requestPermission succeeds', async () => {
    mockedLocationService.requestPermission.mockResolvedValue('granted');
    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permissionStatus).toBe('granted');
  });

  it('updates permission state after requestPermission is denied', async () => {
    mockedLocationService.requestPermission.mockResolvedValue('denied');
    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.permissionStatus).toBe('denied');
  });

  it('populates location and clears loading/error after a successful refresh', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue({
      latitude: 22.5726,
      longitude: 88.3639,
    });
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ city: 'Kolkata' });

    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.location).toEqual({
      latitude: 22.5726,
      longitude: 88.3639,
      city: 'Kolkata',
    });
  });

  it('sets loading true while a refresh is in flight', async () => {
    let resolvePosition: (value: { latitude: number; longitude: number }) => void;
    mockedLocationService.getCurrentLocation.mockReturnValue(
      new Promise((resolve) => {
        resolvePosition = resolve;
      }),
    );
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});

    const { result } = renderHook(() => useLocation());
    await flush();

    let refreshPromise!: Promise<void>;
    act(() => {
      refreshPromise = result.current.refreshLocation();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePosition({ latitude: 1, longitude: 2 });
      await refreshPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it('keeps coordinates visible when reverse geocoding fails', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue({
      latitude: 22.5726,
      longitude: 88.3639,
    });
    mockedGeocodingService.reverseGeocode.mockRejectedValue(new LocationError('GEOCODING_FAILED'));

    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.location).toEqual({ latitude: 22.5726, longitude: 88.3639 });
  });

  it('surfaces LOCATION_PERMISSION_DENIED without location data or a crash', async () => {
    mockedLocationService.getCurrentLocation.mockRejectedValue(
      new LocationError('LOCATION_PERMISSION_DENIED'),
    );

    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeInstanceOf(LocationError);
    expect(result.current.error?.code).toBe('LOCATION_PERMISSION_DENIED');
  });

  it('surfaces a generic failure as an error without crashing', async () => {
    mockedLocationService.getCurrentLocation.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeInstanceOf(LocationError);
    expect(result.current.error?.code).toBe('LOCATION_UNAVAILABLE');
  });

  it('re-fetches location every time refreshLocation is called', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue({
      latitude: 1,
      longitude: 2,
    });
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});

    const { result } = renderHook(() => useLocation());
    await flush();

    await act(async () => {
      await result.current.refreshLocation();
    });
    await act(async () => {
      await result.current.refreshLocation();
    });

    expect(mockedLocationService.getCurrentLocation).toHaveBeenCalledTimes(2);
  });
});
