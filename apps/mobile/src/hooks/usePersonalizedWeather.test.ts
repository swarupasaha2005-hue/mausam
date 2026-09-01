import { usePersonalizedWeather } from './usePersonalizedWeather';
import { dashboardService } from '../services/dashboard';
import { act, flush, renderHook } from '../test-utils/renderHook';

jest.mock('../services/dashboard', () => ({
  dashboardService: {
    getPersonalizedWeatherExperience: jest.fn(),
    regenerateRecommendation: jest.fn(),
  },
}));

const mockedDashboardService = jest.mocked(dashboardService);

const POINT_RESULT = {
  location: { latitude: 22.5726, longitude: 88.3639, city: 'Kolkata' },
  locationError: null,
  weather: {
    temperature: 31,
    feelsLike: 35,
    humidity: 78,
    precipitation: 1,
    rainProbability: 72,
    windSpeed: 14,
    windDirection: 180,
    uvIndex: 8,
    visibility: 8,
    weatherCode: 'rain' as const,
    timestamp: '2026-09-01T12:00',
  },
  weatherError: null,
  userContext: {
    persona: 'runner' as const,
    activities: ['running' as const],
    preferredTimeOfDay: 'flexible' as const,
    weatherPriorities: ['temperature' as const],
  },
  personalizationError: null,
  recommendation: {
    primaryRecommendation: {
      type: 'CAUTION' as const,
      priority: 'high' as const,
      title: 't',
      message: 'm',
      action: 'a',
      reasons: ['HIGH_TEMPERATURE' as const],
    },
    recommendations: [],
    evaluatedFactors: ['HIGH_TEMPERATURE' as const],
  },
  recommendationError: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePersonalizedWeather', () => {
  it('starts idle/empty and auto-loads on mount', async () => {
    mockedDashboardService.getPersonalizedWeatherExperience.mockResolvedValue(POINT_RESULT);

    const { result } = renderHook(() => usePersonalizedWeather());
    await flush();

    expect(mockedDashboardService.getPersonalizedWeatherExperience).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
    expect(result.current.weather).toEqual(POINT_RESULT.weather);
    expect(result.current.recommendation).toEqual(POINT_RESULT.recommendation);
  });

  it('surfaces a location error as status error', async () => {
    mockedDashboardService.getPersonalizedWeatherExperience.mockResolvedValue({
      ...POINT_RESULT,
      location: null,
      weather: null,
      recommendation: null,
      locationError: { code: 'LOCATION_PERMISSION_DENIED' } as never,
    });

    const { result } = renderHook(() => usePersonalizedWeather());
    await flush();

    expect(result.current.status).toBe('error');
    expect(result.current.statusMessage.length).toBeGreaterThan(0);
  });

  it('refresh re-triggers the full pipeline', async () => {
    mockedDashboardService.getPersonalizedWeatherExperience.mockResolvedValue(POINT_RESULT);

    const { result } = renderHook(() => usePersonalizedWeather());
    await flush();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockedDashboardService.getPersonalizedWeatherExperience).toHaveBeenCalledTimes(2);
  });

  it('changing persona regenerates the recommendation without a full refresh', async () => {
    mockedDashboardService.getPersonalizedWeatherExperience.mockResolvedValue(POINT_RESULT);
    mockedDashboardService.regenerateRecommendation.mockResolvedValue({
      userContext: { ...POINT_RESULT.userContext, persona: 'commuter' },
      personalizationError: null,
      recommendation: { ...POINT_RESULT.recommendation, primaryRecommendation: null },
      recommendationError: null,
    });

    const { result } = renderHook(() => usePersonalizedWeather());
    await flush();

    await act(async () => {
      result.current.setPersona('commuter');
    });
    await flush();

    expect(mockedDashboardService.regenerateRecommendation).toHaveBeenCalledWith(
      POINT_RESULT.weather,
      { persona: 'commuter', preferredTimeOfDay: 'flexible' },
    );
    expect(mockedDashboardService.getPersonalizedWeatherExperience).toHaveBeenCalledTimes(1);
    expect(result.current.userContext?.persona).toBe('commuter');
  });
});
