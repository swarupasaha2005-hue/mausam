import {
  WeatherError,
  isValidGeoPoint,
  type AirQuality,
  type CurrentWeather,
  type DailyWeather,
  type GeoPoint,
  type HourlyWeather,
} from '@cloud6/shared';
import { openMeteoWeatherProvider } from '../../integrations/weather/openmeteo/openMeteo.provider';
import { buildCacheKey, TTLCache } from './weather.cache';
import { toWeatherError } from './weather.errors';
import type { DailyForecastOptions, HourlyForecastOptions, WeatherProvider } from './weather.types';

const CURRENT_WEATHER_TTL_MS = 2 * 60 * 1000;
const HOURLY_FORECAST_TTL_MS = 10 * 60 * 1000;
const DAILY_FORECAST_TTL_MS = 30 * 60 * 1000;
const AIR_QUALITY_TTL_MS = 10 * 60 * 1000;

function assertValidPoint(point: GeoPoint): void {
  if (!isValidGeoPoint(point)) {
    throw new WeatherError('WEATHER_INVALID_COORDINATES', 'Invalid latitude/longitude');
  }
}

/**
 * Application-facing weather interface. Depends on WeatherProvider, never
 * on Open-Meteo directly, and owns caching so the provider stays a pure
 * fetch-and-map adapter.
 */
export class WeatherService {
  private readonly currentCache = new TTLCache<CurrentWeather>(CURRENT_WEATHER_TTL_MS);
  private readonly hourlyCache = new TTLCache<HourlyWeather[]>(HOURLY_FORECAST_TTL_MS);
  private readonly dailyCache = new TTLCache<DailyWeather[]>(DAILY_FORECAST_TTL_MS);
  private readonly airQualityCache = new TTLCache<AirQuality>(AIR_QUALITY_TTL_MS);

  constructor(private readonly provider: WeatherProvider = openMeteoWeatherProvider) {}

  async getCurrentWeather(point: GeoPoint): Promise<CurrentWeather> {
    assertValidPoint(point);
    const key = buildCacheKey(point);
    const cached = this.currentCache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.provider.getCurrentWeather(point);
      this.currentCache.set(key, result);
      return result;
    } catch (cause) {
      throw toWeatherError(cause);
    }
  }

  async getHourlyForecast(
    point: GeoPoint,
    options: HourlyForecastOptions = {},
  ): Promise<HourlyWeather[]> {
    assertValidPoint(point);
    const key = buildCacheKey(point, options);
    const cached = this.hourlyCache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.provider.getHourlyForecast(point, options);
      this.hourlyCache.set(key, result);
      return result;
    } catch (cause) {
      throw toWeatherError(cause);
    }
  }

  async getDailyForecast(
    point: GeoPoint,
    options: DailyForecastOptions = {},
  ): Promise<DailyWeather[]> {
    assertValidPoint(point);
    const key = buildCacheKey(point, options);
    const cached = this.dailyCache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.provider.getDailyForecast(point, options);
      this.dailyCache.set(key, result);
      return result;
    } catch (cause) {
      throw toWeatherError(cause);
    }
  }

  async getAirQuality(point: GeoPoint): Promise<AirQuality> {
    assertValidPoint(point);
    const key = buildCacheKey(point);
    const cached = this.airQualityCache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.provider.getAirQuality(point);
      this.airQualityCache.set(key, result);
      return result;
    } catch (cause) {
      throw toWeatherError(cause);
    }
  }

  /**
   * Finds the hourly forecast entry closest to `timestamp`. This is the
   * building block a future Journey Engine needs — weather for an
   * arbitrary point at an arbitrary estimated-arrival time — without
   * requiring route/journey logic in this phase.
   */
  async getWeatherAt(point: GeoPoint, timestamp: string | Date): Promise<HourlyWeather> {
    const hourly = await this.getHourlyForecast(point, { hours: 24 });
    if (hourly.length === 0) {
      throw new WeatherError('WEATHER_INVALID_RESPONSE', 'No hourly forecast data available');
    }

    const target = new Date(timestamp).getTime();
    let closest = hourly[0];
    let smallestDiff = Math.abs(new Date(closest.timestamp).getTime() - target);
    for (const entry of hourly) {
      const diff = Math.abs(new Date(entry.timestamp).getTime() - target);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = entry;
      }
    }
    return closest;
  }
}

export const weatherService = new WeatherService();
