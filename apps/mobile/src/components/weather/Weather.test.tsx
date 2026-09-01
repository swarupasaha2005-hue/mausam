import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import WeatherScreen from '../../../app/weather';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/weather',
}));

jest.mock('../../hooks/useWeather', () => ({
  useWeather: jest.fn(),
}));

import { useWeather } from '../../hooks/useWeather';

const mockedUseWeather = jest.mocked(useWeather);

const CURRENT_WEATHER = {
  temperature: 29,
  feelsLike: 31,
  humidity: 74,
  precipitation: 0,
  rainProbability: 20,
  windSpeed: 18,
  windDirection: 180,
  uvIndex: 6,
  visibility: 10,
  weatherCode: 'partly_cloudy' as const,
  timestamp: '2026-09-02T16:00',
};

const HOURLY = [
  {
    timestamp: '2026-09-02T16:00',
    temperature: 29,
    precipitation: 0,
    precipitationProbability: 10,
    rainProbability: 10,
    humidity: 70,
    windSpeed: 15,
    uvIndex: 5,
    weatherCode: 'clear' as const,
  },
  {
    timestamp: '2026-09-02T17:00',
    temperature: 28,
    precipitation: 2,
    precipitationProbability: 65,
    rainProbability: 65,
    humidity: 80,
    windSpeed: 18,
    uvIndex: 2,
    weatherCode: 'rain' as const,
  },
];

const DAILY = [
  {
    date: '2026-09-02',
    minTemperature: 25,
    maxTemperature: 31,
    precipitationProbability: 20,
    precipitation: 1,
    sunrise: '2026-09-02T05:32',
    sunset: '2026-09-02T18:12',
    weatherCode: 'clear' as const,
  },
  {
    date: '2026-09-03',
    minTemperature: 24,
    maxTemperature: 29,
    precipitationProbability: 70,
    precipitation: 8,
    sunrise: '2026-09-03T05:32',
    sunset: '2026-09-03T18:11',
    weatherCode: 'rain' as const,
  },
];

function weatherState(overrides: Partial<ReturnType<typeof useWeather>> = {}) {
  return {
    location: null,
    locationError: null,
    locationLoading: false,
    current: null,
    currentError: null,
    currentLoading: false,
    hourly: [],
    hourlyError: null,
    hourlyLoading: false,
    daily: [],
    dailyError: null,
    dailyLoading: false,
    recommendation: null,
    recommendationError: null,
    refresh: jest.fn(),
    ...overrides,
  };
}

let currentRoot: ReturnType<typeof create> | null = null;

function renderJson() {
  let root: ReturnType<typeof create>;
  act(() => {
    root = create(createElement(WeatherScreen));
  });
  currentRoot = root!;
  return root!;
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
});

describe('Weather screen', () => {
  it('renders without crashing', () => {
    mockedUseWeather.mockReturnValue(weatherState());
    const root = renderJson();
    expect(textContains(root, 'CURRENT WEATHER')).toBe(true);
  });

  it('renders the resolved location', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({ location: { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata' } }),
    );
    const root = renderJson();
    expect(textContains(root, 'Kolkata')).toBe(true);
  });

  it('renders the current temperature and condition', () => {
    mockedUseWeather.mockReturnValue(weatherState({ current: CURRENT_WEATHER }));
    const root = renderJson();
    expect(textContains(root, '29°')).toBe(true);
    expect(textContains(root, 'Partly Cloudy')).toBe(true);
  });

  it('renders supporting metrics', () => {
    mockedUseWeather.mockReturnValue(weatherState({ current: CURRENT_WEATHER }));
    const root = renderJson();
    expect(textContains(root, 'Feels like')).toBe(true);
    expect(textContains(root, '31°')).toBe(true);
    expect(textContains(root, 'Humidity')).toBe(true);
    expect(textContains(root, '74%')).toBe(true);
  });

  it('renders the hourly forecast', () => {
    mockedUseWeather.mockReturnValue(weatherState({ hourly: HOURLY }));
    const root = renderJson();
    expect(textContains(root, 'NEXT FEW HOURS')).toBe(true);
    expect(textContains(root, '28°')).toBe(true);
  });

  it('renders rain probability when available in the hourly forecast', () => {
    mockedUseWeather.mockReturnValue(weatherState({ hourly: HOURLY }));
    const root = renderJson();
    expect(textContains(root, '65%')).toBe(true);
  });

  it('renders the daily forecast', () => {
    mockedUseWeather.mockReturnValue(weatherState({ daily: DAILY }));
    const root = renderJson();
    expect(textContains(root, 'THIS WEEK')).toBe(true);
    expect(textContains(root, 'TODAY')).toBe(true);
    expect(textContains(root, '31° / 25°')).toBe(true);
  });

  it('does not render an air quality section (not exposed to mobile)', () => {
    mockedUseWeather.mockReturnValue(weatherState({ current: CURRENT_WEATHER }));
    const root = renderJson();
    expect(textContains(root, 'AIR QUALITY')).toBe(false);
  });

  it('shows a loading state for current weather', () => {
    mockedUseWeather.mockReturnValue(weatherState({ currentLoading: true }));
    const root = renderJson();
    expect(textContains(root, 'Checking current weather')).toBe(true);
  });

  it('shows a loading state for the hourly forecast', () => {
    mockedUseWeather.mockReturnValue(weatherState({ hourlyLoading: true }));
    const root = renderJson();
    expect(textContains(root, 'Loading hourly forecast')).toBe(true);
  });

  it('shows a loading state for the daily forecast', () => {
    mockedUseWeather.mockReturnValue(weatherState({ dailyLoading: true }));
    const root = renderJson();
    expect(textContains(root, 'Loading daily forecast')).toBe(true);
  });

  it('shows a friendly error when current weather fails', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({ currentError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never }),
    );
    const root = renderJson();
    expect(textContains(root, "We couldn't get the current weather right now.")).toBe(true);
  });

  it('keeps current weather visible when the hourly forecast fails', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({
        current: CURRENT_WEATHER,
        hourlyError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never,
      }),
    );
    const root = renderJson();
    expect(textContains(root, '29°')).toBe(true);
    expect(textContains(root, 'Hourly forecast unavailable right now.')).toBe(true);
  });

  it('keeps current weather visible when the daily forecast fails', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({
        current: CURRENT_WEATHER,
        dailyError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never,
      }),
    );
    const root = renderJson();
    expect(textContains(root, '29°')).toBe(true);
    expect(textContains(root, 'Daily forecast unavailable right now.')).toBe(true);
  });

  it('renders a location-unavailable state without fabricating coordinates', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({ locationError: { code: 'LOCATION_UNAVAILABLE', message: 'x' } as never }),
    );
    const root = renderJson();
    expect(textContains(root, 'Location unavailable')).toBe(true);
    expect(textContains(root, "We couldn't determine your current location.")).toBe(true);
    expect(textContains(root, 'CURRENT WEATHER')).toBe(false);
  });

  it('renders partial data (current available, hourly/daily unavailable)', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({
        current: CURRENT_WEATHER,
        hourlyError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never,
        dailyError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never,
      }),
    );
    const root = renderJson();
    expect(textContains(root, '29°')).toBe(true);
    expect(textContains(root, 'Hourly forecast unavailable right now.')).toBe(true);
    expect(textContains(root, 'Daily forecast unavailable right now.')).toBe(true);
  });

  it('renders the insight section when a recommendation is available', () => {
    mockedUseWeather.mockReturnValue(
      weatherState({
        current: CURRENT_WEATHER,
        recommendation: {
          primaryRecommendation: {
            type: 'FAVORABLE',
            priority: 'low',
            title: 'Good day to be outside',
            message: 'Conditions look favorable today.',
            action: 'Enjoy it.',
            reasons: ['FAVORABLE_CONDITIONS'],
          },
          recommendations: [],
          evaluatedFactors: ['FAVORABLE_CONDITIONS'],
        },
      }),
    );
    const root = renderJson();
    expect(textContains(root, "TODAY'S INSIGHT")).toBe(true);
    expect(textContains(root, 'Conditions look favorable today.')).toBe(true);
  });

  it('calls refresh when retrying after a current weather failure', () => {
    const refresh = jest.fn();
    mockedUseWeather.mockReturnValue(
      weatherState({
        refresh,
        currentError: { code: 'WEATHER_REQUEST_FAILED', message: 'x' } as never,
      }),
    );
    const root = renderJson();
    const button = findByText(root, 'Try Again');
    act(() => {
      button.props.onPress();
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('navigates to /journey via the journey CTA', () => {
    mockedUseWeather.mockReturnValue(weatherState({ current: CURRENT_WEATHER }));
    const root = renderJson();
    const button = findByText(root, 'Check Weather Along My Route');
    act(() => {
      button.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('renders the bottom navigation', () => {
    mockedUseWeather.mockReturnValue(weatherState());
    const root = renderJson();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Weather tab' })).not.toThrow();
  });
});
