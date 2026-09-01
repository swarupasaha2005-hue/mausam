import { LocationError, RouteError } from '@cloud6/shared';
import { useJourney } from './useJourney';
import { geocodingService, locationService } from '../services/location';
import { routingService } from '../services/routing';
import { act, flush, renderHook } from '../test-utils/renderHook';

jest.mock('../services/location', () => ({
  locationService: { getCurrentLocation: jest.fn() },
  geocodingService: { geocode: jest.fn() },
}));
jest.mock('../services/routing', () => ({ routingService: { getRoute: jest.fn() } }));

const mockedLocationService = jest.mocked(locationService);
const mockedGeocodingService = jest.mocked(geocodingService);
const mockedRoutingService = jest.mocked(routingService);

const START = { latitude: 22.5726, longitude: 88.3639 };
const DESTINATION = { latitude: 22.5958, longitude: 88.4497 };
const ROUTE = {
  start: START,
  destination: DESTINATION,
  distanceKm: 18.4,
  durationMinutes: 47,
  coordinates: [START, DESTINATION],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useJourney', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useJourney());

    expect(result.current.start).toBeNull();
    expect(result.current.destination).toBeNull();
    expect(result.current.route).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loadStart populates the start point from LocationService', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.loadStart();
    });

    expect(result.current.start).toEqual(START);
    expect(result.current.loading).toBe(false);
  });

  it('surfaces a location error without crashing', async () => {
    mockedLocationService.getCurrentLocation.mockRejectedValue(
      new LocationError('LOCATION_PERMISSION_DENIED'),
    );
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.loadStart();
    });

    expect(result.current.start).toBeNull();
    expect(result.current.error).toBeInstanceOf(LocationError);
  });

  it('searchDestination geocodes text into a destination point', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.searchDestination('Salt Lake, Kolkata');
    });

    expect(result.current.destination).toEqual(DESTINATION);
  });

  it('surfaces GEOCODING_FAILED when nothing matches', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([]);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.searchDestination('nowhere');
    });

    expect(result.current.destination).toBeNull();
    expect(result.current.error).toBeInstanceOf(LocationError);
    expect(result.current.error).toMatchObject({ code: 'GEOCODING_FAILED' });
  });

  it('getRoute requires both start and destination', async () => {
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.getRoute();
    });

    expect(mockedRoutingService.getRoute).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(RouteError);
  });

  it('getRoute fetches and stores a route once start and destination are set', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.loadStart();
    });
    await act(async () => {
      await result.current.searchDestination('Salt Lake, Kolkata');
    });
    await act(async () => {
      await result.current.getRoute();
    });

    expect(mockedRoutingService.getRoute).toHaveBeenCalledWith(START, DESTINATION);
    expect(result.current.route).toEqual(ROUTE);
  });

  it('does not refetch a route on its own — only via getRoute/refresh', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.loadStart();
    });
    await act(async () => {
      await result.current.searchDestination('Salt Lake, Kolkata');
    });
    await flush();

    expect(mockedRoutingService.getRoute).not.toHaveBeenCalled();
  });

  it('refresh re-fetches location and route when a destination is already set', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.loadStart();
    });
    await act(async () => {
      await result.current.searchDestination('Salt Lake, Kolkata');
    });
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockedLocationService.getCurrentLocation).toHaveBeenCalledTimes(2);
    expect(mockedRoutingService.getRoute).toHaveBeenCalledTimes(1);
    expect(result.current.route).toEqual(ROUTE);
  });
});
