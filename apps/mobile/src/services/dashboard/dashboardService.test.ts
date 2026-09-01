import {
  LocationError,
  PersonalizationError,
  RecommendationError,
  WeatherError,
} from '@cloud6/shared';
import { dashboardService } from './dashboardService';
import { geocodingService, locationService } from '../location';
import { weatherService } from '../weather';
import { personalizationService } from '../personalization';
import { recommendationsService } from '../recommendations';

jest.mock('../location', () => ({
  locationService: { getCurrentLocation: jest.fn() },
  geocodingService: { reverseGeocode: jest.fn() },
}));
jest.mock('../weather', () => ({ weatherService: { getCurrentWeather: jest.fn() } }));
jest.mock('../personalization', () => ({
  personalizationService: { createUserContext: jest.fn() },
}));
jest.mock('../recommendations', () => ({ recommendationsService: { generate: jest.fn() } }));

const mockedLocationService = jest.mocked(locationService);
const mockedGeocodingService = jest.mocked(geocodingService);
const mockedWeatherService = jest.mocked(weatherService);
const mockedPersonalizationService = jest.mocked(personalizationService);
const mockedRecommendationsService = jest.mocked(recommendationsService);

const POINT = { latitude: 22.5726, longitude: 88.3639 };
const WEATHER = {
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
};
const CONTEXT = {
  persona: 'runner' as const,
  activities: ['running' as const],
  preferredTimeOfDay: 'morning' as const,
  weatherPriorities: ['temperature' as const],
};
const RECOMMENDATION = {
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
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedGeocodingService.reverseGeocode.mockResolvedValue({ city: 'Kolkata' });
});

describe('dashboardService.getPersonalizedWeatherExperience — successful end-to-end', () => {
  it('returns location, weather, userContext, and recommendation', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(POINT);
    mockedWeatherService.getCurrentWeather.mockResolvedValue({ location: POINT, current: WEATHER });
    mockedPersonalizationService.createUserContext.mockResolvedValue(CONTEXT);
    mockedRecommendationsService.generate.mockResolvedValue(RECOMMENDATION);

    const result = await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });

    expect(result.location).toEqual({ ...POINT, city: 'Kolkata' });
    expect(result.weather).toEqual(WEATHER);
    expect(result.userContext).toEqual(CONTEXT);
    expect(result.recommendation).toEqual(RECOMMENDATION);
    expect(result.locationError).toBeNull();
    expect(result.weatherError).toBeNull();
    expect(result.personalizationError).toBeNull();
    expect(result.recommendationError).toBeNull();
  });
});

describe('dashboardService.getPersonalizedWeatherExperience — location failure', () => {
  it('does not request weather and returns a location error', async () => {
    mockedLocationService.getCurrentLocation.mockRejectedValue(
      new LocationError('LOCATION_PERMISSION_DENIED'),
    );

    const result = await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });

    expect(result.locationError).toBeInstanceOf(LocationError);
    expect(result.locationError?.code).toBe('LOCATION_PERMISSION_DENIED');
    expect(mockedWeatherService.getCurrentWeather).not.toHaveBeenCalled();
    expect(mockedRecommendationsService.generate).not.toHaveBeenCalled();
  });
});

describe('dashboardService.getPersonalizedWeatherExperience — weather failure', () => {
  it('does not generate a recommendation and returns a weather error', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(POINT);
    mockedWeatherService.getCurrentWeather.mockRejectedValue(new WeatherError('WEATHER_TIMEOUT'));
    mockedPersonalizationService.createUserContext.mockResolvedValue(CONTEXT);

    const result = await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });

    expect(result.weatherError).toBeInstanceOf(WeatherError);
    expect(result.weather).toBeNull();
    expect(mockedRecommendationsService.generate).not.toHaveBeenCalled();
    expect(result.recommendation).toBeNull();
  });
});

describe('dashboardService.getPersonalizedWeatherExperience — personalization failure', () => {
  it('does not generate a recommendation', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(POINT);
    mockedWeatherService.getCurrentWeather.mockResolvedValue({ location: POINT, current: WEATHER });
    mockedPersonalizationService.createUserContext.mockRejectedValue(
      new PersonalizationError('PERSONA_INVALID'),
    );

    const result = await dashboardService.getPersonalizedWeatherExperience({
      persona: 'astronaut' as never,
    });

    expect(result.personalizationError).toBeInstanceOf(PersonalizationError);
    expect(mockedRecommendationsService.generate).not.toHaveBeenCalled();
    expect(result.recommendation).toBeNull();
    // weather is still available even though personalization failed
    expect(result.weather).toEqual(WEATHER);
  });
});

describe('dashboardService.getPersonalizedWeatherExperience — recommendation failure', () => {
  it('keeps location and weather available and represents the error gracefully', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(POINT);
    mockedWeatherService.getCurrentWeather.mockResolvedValue({ location: POINT, current: WEATHER });
    mockedPersonalizationService.createUserContext.mockResolvedValue(CONTEXT);
    mockedRecommendationsService.generate.mockRejectedValue(
      new RecommendationError('RECOMMENDATION_INVALID_WEATHER'),
    );

    const result = await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });

    expect(result.location).not.toBeNull();
    expect(result.weather).toEqual(WEATHER);
    expect(result.recommendationError).toBeInstanceOf(RecommendationError);
    expect(result.recommendation).toBeNull();
  });
});

describe('dashboardService.regenerateRecommendation — persona change', () => {
  it('requests a new UserContext and recommendation without touching location/weather services', async () => {
    mockedPersonalizationService.createUserContext.mockResolvedValue({
      ...CONTEXT,
      persona: 'commuter',
    });
    mockedRecommendationsService.generate.mockResolvedValue(RECOMMENDATION);

    const result = await dashboardService.regenerateRecommendation(WEATHER, {
      persona: 'commuter',
    });

    expect(mockedPersonalizationService.createUserContext).toHaveBeenCalledWith({
      persona: 'commuter',
    });
    expect(mockedRecommendationsService.generate).toHaveBeenCalledWith(
      { ...CONTEXT, persona: 'commuter' },
      WEATHER,
    );
    expect(mockedLocationService.getCurrentLocation).not.toHaveBeenCalled();
    expect(mockedWeatherService.getCurrentWeather).not.toHaveBeenCalled();
    expect(result.userContext?.persona).toBe('commuter');
    expect(result.recommendation).toEqual(RECOMMENDATION);
  });
});

describe('dashboardService.getPersonalizedWeatherExperience — refresh', () => {
  it('re-triggers location, weather, personalization, and recommendation', async () => {
    mockedLocationService.getCurrentLocation.mockResolvedValue(POINT);
    mockedWeatherService.getCurrentWeather.mockResolvedValue({ location: POINT, current: WEATHER });
    mockedPersonalizationService.createUserContext.mockResolvedValue(CONTEXT);
    mockedRecommendationsService.generate.mockResolvedValue(RECOMMENDATION);

    await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });
    await dashboardService.getPersonalizedWeatherExperience({ persona: 'runner' });

    expect(mockedLocationService.getCurrentLocation).toHaveBeenCalledTimes(2);
    expect(mockedWeatherService.getCurrentWeather).toHaveBeenCalledTimes(2);
    expect(mockedRecommendationsService.generate).toHaveBeenCalledTimes(2);
  });
});
