import type { CurrentWeather, UserContext } from '@cloud6/shared';

const BASE_TIMESTAMP = '2026-09-01T12:00';

export const favorableWeatherFixture: CurrentWeather = {
  temperature: 24,
  feelsLike: 25,
  humidity: 50,
  precipitation: 0,
  rainProbability: 5,
  windSpeed: 10,
  windDirection: 180,
  uvIndex: 3,
  visibility: 10,
  weatherCode: 'clear',
  timestamp: BASE_TIMESTAMP,
};

export const hotWeatherFixture: CurrentWeather = {
  ...favorableWeatherFixture,
  temperature: 34,
  feelsLike: 38,
  humidity: 80,
};

export const rainyWeatherFixture: CurrentWeather = {
  ...favorableWeatherFixture,
  rainProbability: 85,
  precipitation: 6,
  weatherCode: 'rain',
};

export const highUvWeatherFixture: CurrentWeather = {
  ...favorableWeatherFixture,
  uvIndex: 9,
};

export const windyWeatherFixture: CurrentWeather = {
  ...favorableWeatherFixture,
  windSpeed: 40,
};

export const severeWeatherFixture: CurrentWeather = {
  ...favorableWeatherFixture,
  weatherCode: 'thunderstorm',
  rainProbability: 90,
  windSpeed: 45,
};

export const combinedRiskWeatherFixture: CurrentWeather = {
  temperature: 34,
  feelsLike: 38,
  humidity: 85,
  precipitation: 8,
  rainProbability: 82,
  windSpeed: 35,
  windDirection: 180,
  uvIndex: 9,
  visibility: 4,
  weatherCode: 'thunderstorm',
  timestamp: BASE_TIMESTAMP,
};

export function makeUserContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    persona: 'runner',
    activities: ['running'],
    preferredTimeOfDay: 'morning',
    weatherPriorities: [
      'temperature',
      'feels_like',
      'humidity',
      'precipitation',
      'rain_probability',
      'wind',
      'uv',
    ],
    ...overrides,
  };
}

export const runnerContextFixture = makeUserContext({ persona: 'runner' });

export const commuterContextFixture = makeUserContext({
  persona: 'commuter',
  activities: ['commuting'],
  weatherPriorities: [
    'precipitation',
    'rain_probability',
    'wind',
    'visibility',
    'severe_weather',
    'temperature',
  ],
});
