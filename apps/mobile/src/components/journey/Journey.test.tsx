import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import JourneyScreen from '../../../app/journey';
import { JourneyIntelligenceSection } from './JourneyIntelligenceSection';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/journey',
}));

jest.mock('../../hooks/useJourney', () => ({
  useJourney: jest.fn(),
}));

jest.mock('../../services/location', () => ({
  geocodingService: {
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
  },
}));

import { useJourney } from '../../hooks/useJourney';
import { geocodingService } from '../../services/location';

const mockedUseJourney = jest.mocked(useJourney);
const mockedGeocodingService = jest.mocked(geocodingService);

const START = { latitude: 22.5726, longitude: 88.3639 };
const DESTINATION = { latitude: 22.5958, longitude: 88.4497 };
const ROUTE = {
  start: START,
  destination: DESTINATION,
  distanceKm: 12.7,
  durationMinutes: 18,
  coordinates: [START, DESTINATION],
};

const JOURNEY_PLAN = {
  route: ROUTE,
  departureTime: '2026-09-01T16:00:00.000Z',
  estimatedArrivalTime: '2026-09-01T16:18:00.000Z',
  durationMinutes: 18,
  checkpoints: [
    { sequence: 1, point: START, distanceFromStartKm: 0, estimatedArrivalTime: '2026-09-01T16:00:00.000Z' },
    {
      sequence: 2,
      point: DESTINATION,
      distanceFromStartKm: 12.7,
      estimatedArrivalTime: '2026-09-01T16:18:00.000Z',
    },
  ],
};

function makeWeatherCheckpoint(
  overrides: Partial<{
    sequence: number;
    distanceFromStartKm: number;
    estimatedArrivalTime: string;
    weatherCode: 'clear' | 'rain' | 'thunderstorm';
    temperature: number;
    rainProbability: number;
    weather: null;
  }> = {},
) {
  const { weather, ...rest } = overrides;
  return {
    sequence: rest.sequence ?? 1,
    point: START,
    distanceFromStartKm: rest.distanceFromStartKm ?? 0,
    estimatedArrivalTime: rest.estimatedArrivalTime ?? '2026-09-01T16:00:00.000Z',
    weather:
      weather === null
        ? null
        : {
            timestamp: rest.estimatedArrivalTime ?? '2026-09-01T16:00:00.000Z',
            temperature: rest.temperature ?? 31,
            precipitation: 0,
            precipitationProbability: rest.rainProbability ?? 0,
            rainProbability: rest.rainProbability ?? 0,
            humidity: 70,
            windSpeed: 10,
            uvIndex: 5,
            weatherCode: rest.weatherCode ?? 'clear',
          },
  };
}

const DETERIORATING_WEATHER_PLAN = {
  route: ROUTE,
  departureTime: '2026-09-01T16:00:00.000Z',
  estimatedArrivalTime: '2026-09-01T16:18:00.000Z',
  durationMinutes: 18,
  checkpoints: [
    makeWeatherCheckpoint({
      sequence: 1,
      distanceFromStartKm: 0,
      estimatedArrivalTime: '2026-09-01T16:00:00.000Z',
      weatherCode: 'clear',
      temperature: 31,
      rainProbability: 0,
    }),
    makeWeatherCheckpoint({
      sequence: 2,
      distanceFromStartKm: 7.2,
      estimatedArrivalTime: '2026-09-01T16:12:00.000Z',
      weatherCode: 'rain',
      temperature: 29,
      rainProbability: 72,
    }),
    makeWeatherCheckpoint({
      sequence: 3,
      distanceFromStartKm: 12.7,
      estimatedArrivalTime: '2026-09-01T16:18:00.000Z',
      weatherCode: 'rain',
      temperature: 28,
      rainProbability: 78,
    }),
  ],
  summary: {
    weatherAvailableCheckpoints: 3,
    weatherUnavailableCheckpoints: 0,
    rainAffectedCheckpointCount: 2,
    firstRainCheckpointSequence: 2,
    transitions: [{ fromSequence: 1, toSequence: 2, fromCondition: 'clear', toCondition: 'rain' }],
  },
};

const PARTIAL_WEATHER_PLAN = {
  ...DETERIORATING_WEATHER_PLAN,
  checkpoints: [
    DETERIORATING_WEATHER_PLAN.checkpoints[0],
    makeWeatherCheckpoint({ sequence: 2, distanceFromStartKm: 7.2, weather: null }),
    DETERIORATING_WEATHER_PLAN.checkpoints[2],
  ],
  summary: {
    weatherAvailableCheckpoints: 2,
    weatherUnavailableCheckpoints: 1,
    rainAffectedCheckpointCount: 1,
    firstRainCheckpointSequence: 3,
    transitions: [],
  },
};

const ALL_UNAVAILABLE_WEATHER_PLAN = {
  ...DETERIORATING_WEATHER_PLAN,
  checkpoints: DETERIORATING_WEATHER_PLAN.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    weather: null,
  })),
  summary: {
    weatherAvailableCheckpoints: 0,
    weatherUnavailableCheckpoints: 3,
    rainAffectedCheckpointCount: 0,
    firstRainCheckpointSequence: null,
    transitions: [],
  },
};

const RAIN_INTELLIGENCE = {
  journeyWeatherPlan: DETERIORATING_WEATHER_PLAN,
  analysis: {
    riskLevel: 'medium' as const,
    primaryConcern: 'Rain probability is elevated during part of your journey.',
    factors: ['RAIN_DURING_JOURNEY' as const],
    affectedCheckpointSequences: [2],
    affectedSegment: { fromDistanceKm: 3.6, toDistanceKm: 9.4 },
    firstAffectedCheckpointSequence: 2,
    transitions: DETERIORATING_WEATHER_PLAN.summary.transitions,
    weatherAvailableCheckpoints: 3,
    weatherUnavailableCheckpoints: 0,
    confidence: 'high' as const,
    reasons: [
      'Rain probability is elevated during part of your journey. (checkpoint 2, 7.2 km).',
      'Multiple checkpoints are affected.',
    ],
  },
  recommendation: {
    type: 'CAUTION' as const,
    priority: 'medium' as const,
    title: 'Rain expected during part of your run',
    message: 'Rain probability is elevated during part of your journey.',
    action: 'Carry rain protection or plan an alternate window.',
    reasons: ['RAIN_DURING_JOURNEY' as const],
  },
};

const COMMUTER_RAIN_INTELLIGENCE = {
  ...RAIN_INTELLIGENCE,
  recommendation: {
    ...RAIN_INTELLIGENCE.recommendation,
    title: 'Rain may affect part of your commute',
    action: 'Allow extra travel time and bring rain gear.',
  },
};

const FAVORABLE_INTELLIGENCE = {
  journeyWeatherPlan: DETERIORATING_WEATHER_PLAN,
  analysis: {
    riskLevel: 'low' as const,
    primaryConcern: 'Conditions look favorable along your journey.',
    factors: ['FAVORABLE_JOURNEY' as const],
    affectedCheckpointSequences: [],
    affectedSegment: null,
    firstAffectedCheckpointSequence: null,
    transitions: [],
    weatherAvailableCheckpoints: 3,
    weatherUnavailableCheckpoints: 0,
    confidence: 'high' as const,
    reasons: ['Conditions look favorable along your journey.'],
  },
  recommendation: {
    type: 'FAVORABLE' as const,
    priority: 'low' as const,
    title: 'Great conditions for your run',
    message: 'Conditions look favorable throughout your journey.',
    action: 'Enjoy your run.',
    reasons: ['FAVORABLE_JOURNEY' as const],
  },
};

const PARTIAL_INTELLIGENCE = {
  journeyWeatherPlan: PARTIAL_WEATHER_PLAN,
  analysis: {
    ...RAIN_INTELLIGENCE.analysis,
    weatherAvailableCheckpoints: 2,
    weatherUnavailableCheckpoints: 1,
    confidence: 'medium' as const,
  },
  recommendation: RAIN_INTELLIGENCE.recommendation,
};

const UNAVAILABLE_INTELLIGENCE = {
  journeyWeatherPlan: ALL_UNAVAILABLE_WEATHER_PLAN,
  analysis: {
    riskLevel: 'low' as const,
    primaryConcern: 'Weather information is unavailable for this journey.',
    factors: [] as const,
    affectedCheckpointSequences: [],
    affectedSegment: null,
    firstAffectedCheckpointSequence: null,
    transitions: [],
    weatherAvailableCheckpoints: 0,
    weatherUnavailableCheckpoints: 3,
    confidence: 'low' as const,
    reasons: ['No weather data could be retrieved for this journey.'],
  },
  recommendation: {
    type: 'FAVORABLE' as const,
    priority: 'low' as const,
    title: 'Not enough data',
    message: 'Weather information is unavailable for this journey.',
    action: 'Try again later.',
    reasons: [] as const,
  },
};

function journeyState(overrides: Partial<ReturnType<typeof useJourney>> = {}) {
  return {
    start: null,
    destination: null,
    route: null,
    journeyPlan: null,
    journeyWeather: null,
    journeyIntelligence: null,
    persona: 'runner' as const,
    preferredTimeOfDay: 'flexible' as const,
    loading: false,
    error: null,
    loadStart: jest.fn(),
    searchDestination: jest.fn(),
    selectDestination: jest.fn(),
    getRoute: jest.fn(),
    planTimeline: jest.fn().mockResolvedValue(undefined),
    analyzeWeather: jest.fn().mockResolvedValue(undefined),
    analyzeJourney: jest.fn().mockResolvedValue(undefined),
    setPersona: jest.fn(),
    setPreferredTimeOfDay: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  };
}

let currentRoot: ReturnType<typeof create> | null = null;

function renderJson() {
  let root: ReturnType<typeof create>;
  act(() => {
    root = create(createElement(JourneyScreen));
  });
  currentRoot = root!;
  return root!;
}

async function renderJsonAndFlush() {
  const root = renderJson();
  await act(async () => {
    await Promise.resolve();
  });
  return root;
}

afterEach(() => {
  act(() => {
    currentRoot?.unmount();
  });
  currentRoot = null;
});

function collectStrings(json: unknown, out: string[]): void {
  if (json == null) return;
  if (typeof json === 'string' || typeof json === 'number') {
    out.push(String(json));
    return;
  }
  if (Array.isArray(json)) {
    json.forEach((child) => collectStrings(child, out));
    return;
  }
  if (typeof json === 'object' && 'children' in (json as Record<string, unknown>)) {
    collectStrings((json as { children: unknown }).children, out);
  }
}

function textContains(root: ReturnType<typeof create>, needle: string): boolean {
  const strings: string[] = [];
  collectStrings(root.toJSON(), strings);
  return strings.join('').includes(needle);
}

function instanceText(instance: import('react-test-renderer').ReactTestInstance): string {
  const parts: string[] = [];
  const walk = (node: import('react-test-renderer').ReactTestInstance | string) => {
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    node.children.forEach(walk);
  };
  walk(instance);
  return parts.join('');
}

function findByText(root: ReturnType<typeof create>, needle: string) {
  return root.root.findAll(
    (node) =>
      (typeof node.props.onPress === 'function' || typeof node.props.onPressIn === 'function') &&
      instanceText(node).includes(needle),
  )[0];
}

/** Simulates the real activation event for a pressable found via findByText — onPressIn if present (destination result rows), otherwise onPress. */
function activate(node: ReturnType<typeof findByText>) {
  (node.props.onPressIn ?? node.props.onPress)();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedGeocodingService.reverseGeocode.mockResolvedValue({});
});

describe('Journey screen', () => {
  it('renders the planning state', () => {
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();
    expect(textContains(root, 'Plan a Journey')).toBe(true);
    expect(textContains(root, 'Where are you going?')).toBe(true);
  });

  it('shows the current location when available', async () => {
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ city: 'Kolkata' });
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = renderJson();
    await act(async () => {
      await Promise.resolve();
    });
    expect(textContains(root, 'FROM')).toBe(true);
    expect(textContains(root, 'Kolkata')).toBe(true);
  });

  it('shows a coordinate fallback when start exists but reverse geocoding returns nothing', async () => {
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = renderJson();
    await act(async () => {
      await Promise.resolve();
    });
    expect(textContains(root, '22.57, 88.36')).toBe(true);
    expect(textContains(root, 'Current location unavailable')).toBe(false);
  });

  it('does not offer Retry on the FROM field when start exists (even without a place name)', async () => {
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = renderJson();
    await act(async () => {
      await Promise.resolve();
    });
    expect(findByText(root, 'Retry')).toBeUndefined();
  });

  it('shows a locating state while start has not loaded yet', () => {
    mockedUseJourney.mockReturnValue(journeyState({ start: null, loading: true }));
    const root = renderJson();
    expect(textContains(root, 'Locating…')).toBe(true);
    expect(textContains(root, 'Current location unavailable')).toBe(false);
  });

  it('shows a clear message and Retry when location permission is denied', () => {
    mockedUseJourney.mockReturnValue(
      journeyState({
        start: null,
        loading: false,
        error: { code: 'LOCATION_PERMISSION_DENIED', message: 'x' } as never,
      }),
    );
    const root = renderJson();
    expect(textContains(root, 'Current location unavailable')).toBe(true);
    expect(textContains(root, 'Location access is required to plan a journey.')).toBe(true);
    expect(findByText(root, 'Retry')).toBeDefined();
  });

  it('renders the destination input', () => {
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();
    expect(() => root.root.findByProps({ placeholder: 'Where are you headed?' })).not.toThrow();
  });

  it('renders destination search results after a search', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({
      name: 'New Town',
      city: 'Kolkata',
      state: 'West Bengal',
    });
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('New Town');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });

    expect(textContains(root, 'New Town')).toBe(true);
    expect(textContains(root, 'Kolkata, West Bengal')).toBe(true);
  });

  it('falls back to the search query as the label when reverse geocoding returns nothing (single result)', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('Salt Lake, Kolkata');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });

    expect(textContains(root, 'Salt Lake, Kolkata')).toBe(true);
    expect(textContains(root, '22.60, 88.45')).toBe(false);
  });

  it('falls back to coordinates (not the ambiguous query text) when multiple candidates have no name', async () => {
    const SECOND_CANDIDATE = { latitude: 40.76078, longitude: -111.89105 };
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION, SECOND_CANDIDATE]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({});
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('Salt Lake');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });

    expect(textContains(root, '22.60, 88.45')).toBe(true);
    expect(textContains(root, '40.76, -111.89')).toBe(true);
  });

  it('selecting a destination calls selectDestination with the chosen point', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ name: 'New Town', city: 'Kolkata' });
    const selectDestination = jest.fn();
    mockedUseJourney.mockReturnValue(journeyState({ selectDestination }));
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('New Town');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });

    const result = findByText(root, 'New Town');
    await act(async () => {
      activate(result);
    });

    expect(selectDestination).toHaveBeenCalledWith(DESTINATION);
  });

  it('clears the search results and closes the list once a destination is selected', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ name: 'New Town' });
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('New Town');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });
    expect(textContains(root, 'Search results')).toBe(true);

    const result = findByText(root, 'New Town');
    await act(async () => {
      activate(result);
    });

    expect(textContains(root, 'Search results')).toBe(false);
  });

  it('updates selectedDestination (local UI state) so Plan Journey reflects the selection immediately', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ name: 'New Town' });
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = renderJson();

    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('New Town');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });

    let button = findByText(root, 'Plan Journey');
    expect(button.props.disabled).toBe(true);

    const result = findByText(root, 'New Town');
    await act(async () => {
      activate(result);
    });

    button = findByText(root, 'Plan Journey');
    expect(button.props.disabled).toBe(false);
  });

  it('disables Plan Journey until a destination is selected', async () => {
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = await renderJsonAndFlush();
    const button = findByText(root, 'Plan Journey');
    expect(button.props.disabled).toBe(true);
  });

  it('enables Plan Journey once start and destination both exist and nothing is loading', async () => {
    mockedGeocodingService.geocode.mockResolvedValue([DESTINATION]);
    mockedGeocodingService.reverseGeocode.mockResolvedValue({ name: 'New Town' });
    mockedUseJourney.mockReturnValue(
      journeyState({ start: START, destination: DESTINATION, loading: false }),
    );
    const root = await renderJsonAndFlush();

    // The "Plan Journey" disabled state depends on the destination the
    // user actually selected from search results (local UI state), not
    // just useJourney()'s destination field — select one the same way a
    // real user would.
    const input = root.root.findByProps({ placeholder: 'Where are you headed?' });
    await act(async () => {
      input.props.onChangeText('New Town');
    });
    await act(async () => {
      await input.props.onSubmitEditing();
    });
    const result = findByText(root, 'New Town');
    await act(async () => {
      activate(result);
    });

    const button = findByText(root, 'Plan Journey');
    expect(button.props.disabled).toBe(false);
  });

  it('Plan Journey triggers route planning', async () => {
    const getRoute = jest.fn();
    mockedUseJourney.mockReturnValue(
      journeyState({ start: START, destination: DESTINATION, getRoute }),
    );
    const root = await renderJsonAndFlush();
    const button = findByText(root, 'Plan Journey');
    act(() => {
      button.props.onPress();
    });
    expect(getRoute).toHaveBeenCalled();
  });

  it('shows a loading state while the route is being calculated', async () => {
    mockedUseJourney.mockReturnValue(
      journeyState({ start: START, destination: DESTINATION, loading: true }),
    );
    const root = await renderJsonAndFlush();
    expect(textContains(root, 'Planning your route')).toBe(true);
  });

  it('renders the map and route summary once a route exists', async () => {
    mockedUseJourney.mockReturnValue(journeyState({ start: START, destination: DESTINATION, route: ROUTE }));
    const root = await renderJsonAndFlush();
    expect(textContains(root, 'Your Journey')).toBe(true);
    expect(textContains(root, '12.7 km')).toBe(true);
    expect(textContains(root, '18 min')).toBe(true);
  });

  it('shows a friendly message on route failure', async () => {
    mockedUseJourney.mockReturnValue(
      journeyState({
        start: START,
        destination: DESTINATION,
        error: { code: 'ROUTE_NOT_FOUND', message: 'x' } as never,
      }),
    );
    const root = await renderJsonAndFlush();
    expect(textContains(root, "We couldn't plan this route right now.")).toBe(true);
  });

  it('shows a friendly message when destination search fails', () => {
    mockedUseJourney.mockReturnValue(
      journeyState({ error: { code: 'GEOCODING_FAILED', message: 'x' } as never }),
    );
    const root = renderJson();
    expect(textContains(root, "We couldn't find that place.")).toBe(true);
  });

  it('back button navigates to Home', () => {
    mockedUseJourney.mockReturnValue(journeyState());
    const root = renderJson();
    const back = root.root.findAll(
      (node) => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === 'Back',
    )[0];
    act(() => {
      back.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows the Analyze Weather CTA once a route exists', async () => {
    mockedUseJourney.mockReturnValue(journeyState({ start: START, destination: DESTINATION, route: ROUTE }));
    const root = await renderJsonAndFlush();
    expect(textContains(root, 'Analyze Weather')).toBe(true);
  });

  describe('Journey Weather experience', () => {
    function weatherReadyState(overrides: Partial<ReturnType<typeof useJourney>> = {}) {
      return journeyState({
        start: START,
        destination: DESTINATION,
        route: ROUTE,
        journeyPlan: JOURNEY_PLAN as never,
        journeyWeather: DETERIORATING_WEATHER_PLAN as never,
        ...overrides,
      });
    }

    it('renders the weather timeline with checkpoints', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'WEATHER TIMELINE')).toBe(true);
      expect(textContains(root, 'START')).toBe(true);
      expect(textContains(root, 'DESTINATION')).toBe(true);
    });

    it('renders ETA, distance, temperature, and condition for a checkpoint', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, '31°')).toBe(true);
      expect(textContains(root, 'Clear')).toBe(true);
      expect(textContains(root, '7.2 km')).toBe(true);
    });

    it('renders rain probability when available', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, '72% rain probability')).toBe(true);
    });

    it('renders the weather hero with a consistent-vs-changing message', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'WEATHER ALONG YOUR ROUTE')).toBe(true);
      expect(textContains(root, 'Conditions change during your journey.')).toBe(true);
    });

    it('renders the backend-provided weather transition', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'Clear → Rainy')).toBe(true);
    });

    it('renders the journey weather summary', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'JOURNEY WEATHER')).toBe(true);
      expect(textContains(root, 'Rain expected')).toBe(true);
      expect(textContains(root, '2 checkpoints affected')).toBe(true);
    });

    it('highlights the first rain checkpoint', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'Rain begins around here')).toBe(true);
    });

    it('renders all checkpoints, including unavailable ones, on partial failure', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ journeyWeather: PARTIAL_WEATHER_PLAN as never }),
      );
      const root = await renderJsonAndFlush();
      expect(textContains(root, "We couldn't retrieve weather here.")).toBe(true);
      expect(textContains(root, 'Weather coverage')).toBe(true);
      expect(textContains(root, '2 / 3 checkpoints')).toBe(true);
      // Still shows the available checkpoints' real data, not fabricated values.
      expect(textContains(root, '31°')).toBe(true);
      expect(textContains(root, '28°')).toBe(true);
    });

    it('never shows a temperature for a checkpoint with no weather', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ journeyWeather: PARTIAL_WEATHER_PLAN as never }),
      );
      const root = await renderJsonAndFlush();
      const cards = root.root.findAll(
        (node) =>
          typeof node.type !== 'string' && instanceText(node).includes("couldn't retrieve weather"),
      );
      expect(cards.length).toBeGreaterThan(0);
    });

    it('shows the all-weather-unavailable state without destroying the route', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ journeyWeather: ALL_UNAVAILABLE_WEATHER_PLAN as never }),
      );
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'WEATHER UNAVAILABLE')).toBe(true);
      expect(textContains(root, '12.7 km')).toBe(true);
      expect(textContains(root, '18 min')).toBe(true);
      expect(textContains(root, 'WEATHER TIMELINE')).toBe(false);
    });

    it('shows a loading state and triggers planTimeline then analyzeWeather', async () => {
      const planTimeline = jest.fn().mockResolvedValue(undefined);
      const analyzeWeather = jest.fn().mockResolvedValue(undefined);
      mockedUseJourney.mockReturnValue(
        journeyState({ start: START, destination: DESTINATION, route: ROUTE, planTimeline, analyzeWeather }),
      );
      const root = await renderJsonAndFlush();
      const button = findByText(root, 'Analyze Weather');
      await act(async () => {
        button.props.onPress();
      });
      expect(planTimeline).toHaveBeenCalled();
    });

    it('shows the Journey Insight CTA once weather analysis is available', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'See Journey Insight')).toBe(true);
    });

    it('does not personalize checkpoint weather by persona', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState({ persona: 'commuter' }));
      const root = await renderJsonAndFlush();
      expect(textContains(root, '31°')).toBe(true);
      expect(textContains(root, 'Clear')).toBe(true);
    });
  });

  describe('Journey Intelligence experience', () => {
    function weatherReadyState(overrides: Partial<ReturnType<typeof useJourney>> = {}) {
      return journeyState({
        start: START,
        destination: DESTINATION,
        route: ROUTE,
        journeyPlan: JOURNEY_PLAN as never,
        journeyWeather: DETERIORATING_WEATHER_PLAN as never,
        ...overrides,
      });
    }

    it('shows the See Journey Insight CTA before it has been requested', async () => {
      mockedUseJourney.mockReturnValue(weatherReadyState());
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'See Journey Insight')).toBe(true);
    });

    it('triggers analyzeJourney when the CTA is pressed', async () => {
      const analyzeJourney = jest.fn().mockResolvedValue(undefined);
      mockedUseJourney.mockReturnValue(weatherReadyState({ analyzeJourney }));
      const root = await renderJsonAndFlush();
      const button = findByText(root, 'See Journey Insight');
      await act(async () => {
        button.props.onPress();
      });
      expect(analyzeJourney).toHaveBeenCalled();
    });

    it('shows a loading state while intelligence is being generated', async () => {
      const analyzeJourney = jest.fn(() => new Promise<void>(() => {}));
      mockedUseJourney.mockReturnValue(weatherReadyState({ analyzeJourney, loading: true }));
      const root = await renderJsonAndFlush();
      const button = findByText(root, 'See Journey Insight');
      await act(async () => {
        button.props.onPress();
      });
      expect(textContains(root, 'Understanding your journey')).toBe(true);
    });

    it('renders the primary insight, risk, recommendation, reasons, segment, and confidence', async () => {
      const analyzeJourney = jest.fn().mockResolvedValue(undefined);
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ analyzeJourney, journeyIntelligence: RAIN_INTELLIGENCE as never }),
      );
      const root = await renderJsonAndFlush();

      expect(textContains(root, 'Rain expected during part of your run')).toBe(true);
      expect(textContains(root, 'MODERATE IMPACT')).toBe(true);
      expect(textContains(root, 'Rain probability is elevated during part of your journey.')).toBe(
        true,
      );
      expect(textContains(root, 'Carry rain protection or plan an alternate window.')).toBe(true);
      expect(textContains(root, "WHY WE'RE SAYING THIS")).toBe(true);
      expect(textContains(root, 'Multiple checkpoints are affected.')).toBe(true);
      expect(textContains(root, 'AFFECTED PART OF YOUR JOURNEY')).toBe(true);
      expect(textContains(root, '3.6 km')).toBe(true);
      expect(textContains(root, '9.4 km')).toBe(true);
      expect(textContains(root, 'Weather confidence · High')).toBe(true);
    });

    it('renders a favorable journey positively', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ journeyIntelligence: FAVORABLE_INTELLIGENCE as never }),
      );
      const root = await renderJsonAndFlush();
      expect(textContains(root, '✓')).toBe(true);
      expect(textContains(root, 'Great conditions for your run')).toBe(true);
      expect(textContains(root, 'LOW IMPACT')).toBe(true);
    });

    it('shows reduced confidence and coverage for partial weather data', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({
          journeyWeather: PARTIAL_WEATHER_PLAN as never,
          journeyIntelligence: PARTIAL_INTELLIGENCE as never,
        }),
      );
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'Weather confidence · Medium')).toBe(true);
      expect(textContains(root, 'Based on 2 of 3 checkpoints')).toBe(true);
    });

    it('never shows favorable/low-risk copy when weather is entirely unavailable', () => {
      let componentRoot: ReturnType<typeof create>;
      act(() => {
        componentRoot = create(
          createElement(JourneyIntelligenceSection, {
            journeyWeather: ALL_UNAVAILABLE_WEATHER_PLAN as never,
            journeyIntelligence: UNAVAILABLE_INTELLIGENCE as never,
            persona: 'runner',
            requested: true,
            loading: false,
            error: null,
            onAnalyze: jest.fn(),
          }),
        );
      });
      expect(textContains(componentRoot!, 'JOURNEY INSIGHT UNAVAILABLE')).toBe(true);
      expect(textContains(componentRoot!, "We don't have enough weather data")).toBe(true);
      expect(textContains(componentRoot!, 'LOW IMPACT')).toBe(false);
      expect(textContains(componentRoot!, 'Not enough data')).toBe(false);
      act(() => {
        componentRoot.unmount();
      });
    });

    it('shows an error state with retry when intelligence generation fails', async () => {
      const analyzeJourney = jest.fn().mockResolvedValue(undefined);
      mockedUseJourney.mockReturnValue(
        weatherReadyState({
          analyzeJourney,
          error: { code: 'JOURNEY_INVALID_ROUTE', message: 'x' } as never,
        }),
      );
      const root = await renderJsonAndFlush();
      const cta = findByText(root, 'See Journey Insight');
      await act(async () => {
        cta.props.onPress();
      });
      expect(textContains(root, 'JOURNEY INSIGHT UNAVAILABLE')).toBe(true);
      expect(textContains(root, "We couldn't generate an insight")).toBe(true);
      expect(() => findByText(root, 'Try Again')).not.toThrow();
    });

    it('shows an empty state when there is no journey weather plan', () => {
      let componentRoot: ReturnType<typeof create>;
      act(() => {
        componentRoot = create(
          createElement(JourneyIntelligenceSection, {
            journeyWeather: null,
            journeyIntelligence: null,
            persona: 'runner',
            requested: false,
            loading: false,
            error: null,
            onAnalyze: jest.fn(),
          }),
        );
      });
      expect(textContains(componentRoot!, 'PLAN A JOURNEY FIRST')).toBe(true);
      act(() => {
        componentRoot.unmount();
      });
    });

    it('displays the persona context', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ persona: 'runner', journeyIntelligence: RAIN_INTELLIGENCE as never }),
      );
      const root = await renderJsonAndFlush();
      expect(textContains(root, 'For your runner plans')).toBe(true);
    });

    it('renders different recommendation copy for different personas from the same weather', async () => {
      mockedUseJourney.mockReturnValue(
        weatherReadyState({ persona: 'runner', journeyIntelligence: RAIN_INTELLIGENCE as never }),
      );
      const runnerRoot = await renderJsonAndFlush();
      expect(textContains(runnerRoot, 'Rain expected during part of your run')).toBe(true);

      act(() => {
        currentRoot?.unmount();
      });
      currentRoot = null;

      mockedUseJourney.mockReturnValue(
        weatherReadyState({
          persona: 'commuter',
          journeyIntelligence: COMMUTER_RAIN_INTELLIGENCE as never,
        }),
      );
      const commuterRoot = await renderJsonAndFlush();
      expect(textContains(commuterRoot, 'Rain may affect part of your commute')).toBe(true);
    });
  });
});
