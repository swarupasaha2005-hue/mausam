import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import Home from '../../../app/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

jest.mock('../../hooks/usePersonalizedWeather', () => ({
  usePersonalizedWeather: jest.fn(),
}));

jest.mock('../../hooks/useHourlyPreview', () => ({
  useHourlyPreview: jest.fn(() => ({ hours: [], loading: false, error: null })),
}));

import { usePersonalizedWeather } from '../../hooks/usePersonalizedWeather';

const mockedUsePersonalizedWeather = jest.mocked(usePersonalizedWeather);

function emptyHookResult(overrides: Partial<ReturnType<typeof usePersonalizedWeather>> = {}) {
  return {
    location: null,
    locationError: null,
    weather: null,
    weatherError: null,
    userContext: null,
    personalizationError: null,
    recommendation: null,
    recommendationError: null,
    status: 'idle' as const,
    statusMessage: '',
    persona: 'runner' as const,
    preferredTimeOfDay: 'flexible' as const,
    setPersona: jest.fn(),
    setPreferredTimeOfDay: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  };
}

function renderJson() {
  let root: ReturnType<typeof create>;
  act(() => {
    root = create(createElement(Home));
  });
  return root!;
}

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
  return strings.join('').includes(needle) || strings.some((s) => s.includes(needle));
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Home screen', () => {
  it('renders without crashing', () => {
    mockedUsePersonalizedWeather.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'CURRENT WEATHER')).toBe(true);
  });

  it('shows a loading placeholder while weather is loading', () => {
    mockedUsePersonalizedWeather.mockReturnValue(emptyHookResult({ status: 'loading' }));
    const root = renderJson();
    expect(textContains(root, 'Checking the weather')).toBe(true);
  });

  it('renders current weather data correctly', () => {
    mockedUsePersonalizedWeather.mockReturnValue(
      emptyHookResult({
        status: 'success',
        location: { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata' },
        weather: {
          temperature: 31,
          feelsLike: 34,
          humidity: 76,
          precipitation: 0,
          rainProbability: 20,
          windSpeed: 10,
          windDirection: 180,
          uvIndex: 5,
          visibility: 10,
          weatherCode: 'partly_cloudy',
          timestamp: '2026-09-01T12:00',
        },
      }),
    );
    const root = renderJson();
    expect(textContains(root, '31°')).toBe(true);
    expect(textContains(root, 'Partly Cloudy')).toBe(true);
    expect(textContains(root, 'Feels like 34°')).toBe(true);
    expect(textContains(root, 'Kolkata')).toBe(true);
  });

  it('renders the recommendation when available', () => {
    mockedUsePersonalizedWeather.mockReturnValue(
      emptyHookResult({
        status: 'success',
        recommendation: {
          primaryRecommendation: {
            type: 'FAVORABLE',
            priority: 'low',
            title: 'Good time to be outside',
            message: 'Conditions look favorable for outdoor activity.',
            action: 'Enjoy it.',
            reasons: ['FAVORABLE_CONDITIONS'],
          },
          recommendations: [],
          evaluatedFactors: ['FAVORABLE_CONDITIONS'],
        },
      }),
    );
    const root = renderJson();
    expect(textContains(root, 'Good time to be outside')).toBe(true);
  });

  it('does not crash when the recommendation fails', () => {
    mockedUsePersonalizedWeather.mockReturnValue(
      emptyHookResult({
        status: 'success',
        weather: {
          temperature: 30,
          feelsLike: 32,
          humidity: 60,
          precipitation: 0,
          rainProbability: 10,
          windSpeed: 8,
          windDirection: 90,
          uvIndex: 3,
          visibility: 10,
          weatherCode: 'clear',
          timestamp: '2026-09-01T12:00',
        },
        recommendationError: { code: 'RECOMMENDATION_INVALID_WEATHER', message: 'x' } as never,
      }),
    );
    expect(() => renderJson()).not.toThrow();
    const root = renderJson();
    expect(textContains(root, '30°')).toBe(true);
  });

  it('shows the Plan Journey CTA', () => {
    mockedUsePersonalizedWeather.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'Plan Journey')).toBe(true);
    expect(textContains(root, 'See the weather along your route')).toBe(true);
  });

  it('navigates to /journey when the Journey CTA is pressed', () => {
    mockedUsePersonalizedWeather.mockReturnValue(emptyHookResult());
    const root = renderJson();
    const button = root.root.findAll(
      (node) => typeof node.props.onPress === 'function' && instanceText(node).includes('Plan Journey'),
    )[0];
    act(() => {
      button.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('renders the bottom navigation', () => {
    mockedUsePersonalizedWeather.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Home tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Journey tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Weather tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Profile tab' })).not.toThrow();
  });

  it('handles missing location/weather gracefully', () => {
    mockedUsePersonalizedWeather.mockReturnValue(
      emptyHookResult({
        status: 'error',
        locationError: { code: 'LOCATION_UNAVAILABLE', message: 'x' } as never,
        weatherError: null,
      }),
    );
    expect(() => renderJson()).not.toThrow();
    const root = renderJson();
    expect(textContains(root, 'Location unavailable')).toBe(true);
  });
});
