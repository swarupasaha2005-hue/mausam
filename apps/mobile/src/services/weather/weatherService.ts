import {
  WeatherError,
  type DailyWeather,
  type GeoPoint,
  type HourlyWeather,
  type WeatherErrorCode,
  type WeatherSnapshot,
} from '@cloud6/shared';
import { apiRequest, ApiHttpError, ApiInvalidResponseError, ApiRequestFailedError } from '../apiClient';

interface HourlyForecastResponse {
  location: GeoPoint;
  hourly: HourlyWeather[];
}

interface DailyForecastResponse {
  location: GeoPoint;
  daily: DailyWeather[];
}

async function requestJson<T>(path: string, query: Record<string, string>): Promise<T> {
  try {
    return await apiRequest<T>(path, { query });
  } catch (cause) {
    if (cause instanceof ApiHttpError) {
      throw new WeatherError(
        (cause.errorCode as WeatherErrorCode) ?? 'WEATHER_PROVIDER_ERROR',
        cause.message,
      );
    }
    if (cause instanceof ApiInvalidResponseError) {
      throw new WeatherError('WEATHER_INVALID_RESPONSE', cause.message);
    }
    if (cause instanceof ApiRequestFailedError) {
      throw new WeatherError('WEATHER_REQUEST_FAILED', cause.message);
    }
    throw new WeatherError('WEATHER_REQUEST_FAILED');
  }
}

function buildQuery(point: GeoPoint, extra?: Record<string, string>): Record<string, string> {
  return {
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    ...extra,
  };
}

/**
 * Mobile-side weather client. Talks only to the CLOUD6 backend
 * (`/api/weather/*`) — never to Open-Meteo directly, and never imports
 * anything from the server's integrations layer.
 */
export const weatherService = {
  async getCurrentWeather(point: GeoPoint): Promise<WeatherSnapshot> {
    return requestJson<WeatherSnapshot>('/api/weather/current', buildQuery(point));
  },

  async getHourlyForecast(point: GeoPoint, hours?: number): Promise<HourlyForecastResponse> {
    const extra = hours ? { hours: String(hours) } : undefined;
    return requestJson<HourlyForecastResponse>('/api/weather/hourly', buildQuery(point, extra));
  },

  async getDailyForecast(point: GeoPoint, days?: number): Promise<DailyForecastResponse> {
    const extra = days ? { days: String(days) } : undefined;
    return requestJson<DailyForecastResponse>('/api/weather/daily', buildQuery(point, extra));
  },
};
