import { JourneyError, LocationError, RouteError } from '@cloud6/shared';
import { useJourney } from './useJourney';
import { geocodingService, locationService } from '../services/location';
import { journeyService } from '../services/journey';
import { personalizationService } from '../services/personalization';
import { routingService } from '../services/routing';
import { act, flush, renderHook } from '../test-utils/renderHook';

jest.mock('../services/location', () => ({
  locationService: { getCurrentLocation: jest.fn() },
  geocodingService: { geocode: jest.fn() },
}));
jest.mock('../services/routing', () => ({ routingService: { getRoute: jest.fn() } }));
jest.mock('../services/journey', () => ({
  journeyService: {
    planJourney: jest.fn(),
    getJourneyWeather: jest.fn(),
    getJourneyIntelligence: jest.fn(),
  },
}));
jest.mock('../services/personalization', () => ({
  personalizationService: { createUserContext: jest.fn() },
}));

const mockedLocationService = jest.mocked(locationService);
const mockedGeocodingService = jest.mocked(geocodingService);
const mockedRoutingService = jest.mocked(routingService);
const mockedJourneyService = jest.mocked(journeyService);
const mockedPersonalizationService = jest.mocked(personalizationService);

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

  it('planTimeline requires a route first', async () => {
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.planTimeline();
    });

    expect(mockedJourneyService.planJourney).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(JourneyError);
  });

  it('planTimeline fetches and stores a journey plan once a route exists', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const plan = {
      route: ROUTE,
      departureTime: '2026-09-01T16:00:00.000Z',
      estimatedArrivalTime: '2026-09-01T16:47:00.000Z',
      durationMinutes: 47,
      checkpoints: [],
    };
    mockedJourneyService.planJourney.mockResolvedValue(plan);

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
    await act(async () => {
      await result.current.planTimeline();
    });

    expect(mockedJourneyService.planJourney).toHaveBeenCalledWith(ROUTE);
    expect(result.current.journeyPlan).toEqual(plan);
  });

  it('analyzeWeather requires a journey plan first', async () => {
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.analyzeWeather();
    });

    expect(mockedJourneyService.getJourneyWeather).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(JourneyError);
  });

  it('analyzeWeather runs the full JourneyPlan -> JourneyWeatherPlan integration flow', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const plan = {
      route: ROUTE,
      departureTime: '2026-09-01T16:00:00.000Z',
      estimatedArrivalTime: '2026-09-01T16:47:00.000Z',
      durationMinutes: 47,
      checkpoints: [],
    };
    const weatherPlan = {
      ...plan,
      summary: {
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        rainAffectedCheckpointCount: 0,
        firstRainCheckpointSequence: null,
        transitions: [],
      },
    };
    mockedJourneyService.planJourney.mockResolvedValue(plan);
    mockedJourneyService.getJourneyWeather.mockResolvedValue(weatherPlan);

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
    await act(async () => {
      await result.current.planTimeline();
    });
    await act(async () => {
      await result.current.analyzeWeather();
    });

    expect(mockedJourneyService.getJourneyWeather).toHaveBeenCalledWith(plan);
    expect(result.current.journeyWeather).toEqual(weatherPlan);
  });

  it('analyzeJourney requires journey weather first', async () => {
    const { result } = renderHook(() => useJourney());

    await act(async () => {
      await result.current.analyzeJourney();
    });

    expect(mockedJourneyService.getJourneyIntelligence).not.toHaveBeenCalled();
    expect(result.current.error).toBeInstanceOf(JourneyError);
  });

  it('analyzeJourney builds a UserContext for the selected persona and fetches intelligence', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(START);
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedRoutingService.getRoute.mockResolvedValue(ROUTE);
    const plan = {
      route: ROUTE,
      departureTime: '2026-09-01T16:00:00.000Z',
      estimatedArrivalTime: '2026-09-01T16:47:00.000Z',
      durationMinutes: 47,
      checkpoints: [],
    };
    const weatherPlan = {
      ...plan,
      summary: {
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        rainAffectedCheckpointCount: 0,
        firstRainCheckpointSequence: null,
        transitions: [],
      },
    };
    const context = {
      persona: 'runner' as const,
      activities: ['running' as const],
      preferredTimeOfDay: 'flexible' as const,
      weatherPriorities: ['temperature' as const],
    };
    const intelligence = {
      journeyWeatherPlan: weatherPlan,
      analysis: {
        riskLevel: 'low' as const,
        primaryConcern: 'Conditions look favorable along your entire route.',
        factors: ['FAVORABLE_JOURNEY' as const],
        affectedCheckpointSequences: [],
        affectedSegment: null,
        firstAffectedCheckpointSequence: null,
        transitions: [],
        weatherAvailableCheckpoints: 0,
        weatherUnavailableCheckpoints: 0,
        confidence: 'low' as const,
        reasons: [],
      },
      recommendation: {
        type: 'FAVORABLE' as const,
        priority: 'low' as const,
        title: 'Good conditions for your run',
        message: 'Conditions look favorable for your entire route.',
        action: 'Enjoy your run.',
        reasons: ['FAVORABLE_JOURNEY' as const],
      },
    };
    mockedJourneyService.planJourney.mockResolvedValue(plan);
    mockedJourneyService.getJourneyWeather.mockResolvedValue(weatherPlan);
    mockedPersonalizationService.createUserContext.mockResolvedValue(context);
    mockedJourneyService.getJourneyIntelligence.mockResolvedValue(intelligence);

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
    await act(async () => {
      await result.current.planTimeline();
    });
    await act(async () => {
      await result.current.analyzeWeather();
    });
    await act(async () => {
      await result.current.analyzeJourney();
    });

    expect(mockedPersonalizationService.createUserContext).toHaveBeenCalledWith({
      persona: 'runner',
      preferredTimeOfDay: 'flexible',
    });
    expect(mockedJourneyService.getJourneyIntelligence).toHaveBeenCalledWith(weatherPlan, context);
    expect(result.current.journeyIntelligence).toEqual(intelligence);
  });

  it('changing persona does not refetch location, route, or weather', async () => {
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

    act(() => {
      result.current.setPersona('commuter');
    });

    expect(result.current.persona).toBe('commuter');
    expect(mockedLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
    expect(mockedRoutingService.getRoute).toHaveBeenCalledTimes(1);
    expect(mockedJourneyService.getJourneyWeather).not.toHaveBeenCalled();
  });
});
