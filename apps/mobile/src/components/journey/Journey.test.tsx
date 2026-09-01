import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import JourneyScreen from '../../../app/journey';

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
    analyzeWeather: jest.fn(),
    analyzeJourney: jest.fn(),
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
    (node) => typeof node.props.onPress === 'function' && instanceText(node).includes(needle),
  )[0];
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
      result.props.onPress();
    });

    expect(selectDestination).toHaveBeenCalledWith(DESTINATION);
  });

  it('disables Plan Journey until a destination is selected', async () => {
    mockedUseJourney.mockReturnValue(journeyState({ start: START }));
    const root = await renderJsonAndFlush();
    const button = findByText(root, 'Plan Journey');
    expect(button.props.disabled).toBe(true);
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
});
