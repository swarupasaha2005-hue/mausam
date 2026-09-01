import type {
  AirQuality,
  CurrentWeather,
  DailyWeather,
  GeoPoint,
  HourlyWeather,
} from '@cloud6/shared';
import type {
  DailyForecastOptions,
  HourlyForecastOptions,
  WeatherProvider,
} from '../../../modules/weather/weather.types';
import { fetchOpenMeteoAirQuality, fetchOpenMeteoForecast } from './openMeteo.client';
import {
  mapAirQuality,
  mapCurrentWeather,
  mapDailyWeather,
  mapHourlyWeather,
} from './openMeteo.mapper';

/** WeatherProvider backed by the public Open-Meteo API. */
export const openMeteoWeatherProvider: WeatherProvider = {
  async getCurrentWeather(point: GeoPoint): Promise<CurrentWeather> {
    const response = await fetchOpenMeteoForecast(point, { hours: 24, days: 1 });
    return mapCurrentWeather(response);
  },

  async getHourlyForecast(
    point: GeoPoint,
    options: HourlyForecastOptions = {},
  ): Promise<HourlyWeather[]> {
    const hours = options.hours ?? 24;
    const response = await fetchOpenMeteoForecast(point, { hours, days: 1 });
    return mapHourlyWeather(response.hourly);
  },

  async getDailyForecast(
    point: GeoPoint,
    options: DailyForecastOptions = {},
  ): Promise<DailyWeather[]> {
    const days = options.days ?? 7;
    const response = await fetchOpenMeteoForecast(point, { hours: 1, days });
    return mapDailyWeather(response.daily);
  },

  async getAirQuality(point: GeoPoint): Promise<AirQuality> {
    const response = await fetchOpenMeteoAirQuality(point);
    return mapAirQuality(point, response);
  },
};
