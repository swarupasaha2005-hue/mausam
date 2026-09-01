import type { CurrentWeather, DailyWeather, HourlyWeather } from '@cloud6/shared';

/** Expected CurrentWeather after mapping openMeteoForecastFixture. */
export const cloud6CurrentWeatherFixture: CurrentWeather = {
  temperature: 31.2,
  feelsLike: 35.1,
  humidity: 78,
  precipitation: 0,
  rainProbability: 25,
  windSpeed: 14.4,
  windDirection: 180,
  uvIndex: 7,
  visibility: 24,
  weatherCode: 'partly_cloudy',
  timestamp: '2026-09-01T12:00',
};

/** Expected HourlyWeather[] after mapping openMeteoForecastFixture.hourly. */
export const cloud6HourlyWeatherFixture: HourlyWeather[] = [
  {
    timestamp: '2026-09-01T11:00',
    temperature: 30.1,
    precipitation: 0,
    precipitationProbability: 10,
    rainProbability: 10,
    humidity: 80,
    windSpeed: 13.1,
    uvIndex: 5,
    weatherCode: 'partly_cloudy',
  },
  {
    timestamp: '2026-09-01T12:00',
    temperature: 31.2,
    precipitation: 0,
    precipitationProbability: 25,
    rainProbability: 25,
    humidity: 78,
    windSpeed: 14.4,
    uvIndex: 7,
    weatherCode: 'partly_cloudy',
  },
  {
    timestamp: '2026-09-01T13:00',
    temperature: 31.8,
    precipitation: 0.2,
    precipitationProbability: 30,
    rainProbability: 30,
    humidity: 76,
    windSpeed: 15.0,
    uvIndex: 7.5,
    weatherCode: 'cloudy',
  },
];

/** Expected DailyWeather[] after mapping openMeteoForecastFixture.daily. */
export const cloud6DailyWeatherFixture: DailyWeather[] = [
  {
    date: '2026-09-01',
    minTemperature: 26.0,
    maxTemperature: 33.5,
    precipitationProbability: 40,
    precipitation: 2.1,
    sunrise: '2026-09-01T05:32',
    sunset: '2026-09-01T18:12',
    weatherCode: 'partly_cloudy',
  },
  {
    date: '2026-09-02',
    minTemperature: 25.4,
    maxTemperature: 32.1,
    precipitationProbability: 55,
    precipitation: 5.4,
    sunrise: '2026-09-02T05:33',
    sunset: '2026-09-02T18:11',
    weatherCode: 'rain',
  },
];
