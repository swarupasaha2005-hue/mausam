import { WeatherError, type GeoPoint } from '@cloud6/shared';
import { env } from '../../../config/env';
import type { OpenMeteoAirQualityResponse, OpenMeteoForecastResponse } from './openMeteo.types';

async function requestJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.weatherRequestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (cause) {
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new WeatherError('WEATHER_TIMEOUT', 'Open-Meteo request timed out');
    }
    throw new WeatherError(
      'WEATHER_REQUEST_FAILED',
      cause instanceof Error ? cause.message : 'Network request to Open-Meteo failed',
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new WeatherError('WEATHER_RATE_LIMITED', 'Open-Meteo rate limit exceeded');
  }
  if (!response.ok) {
    throw new WeatherError(
      'WEATHER_PROVIDER_ERROR',
      `Open-Meteo responded with HTTP ${response.status}`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new WeatherError('WEATHER_INVALID_RESPONSE', 'Open-Meteo response was not valid JSON');
  }
}

function buildForecastUrl(point: GeoPoint, { hours, days }: { hours: number; days: number }) {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    timezone: 'auto',
    forecast_hours: String(hours),
    forecast_days: String(days),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation',
      'precipitation_probability',
      'relative_humidity_2m',
      'wind_speed_10m',
      'uv_index',
      'visibility',
      'weather_code',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'sunrise',
      'sunset',
      'weather_code',
    ].join(','),
  });
  return `${env.openMeteoBaseUrl}?${params.toString()}`;
}

function buildAirQualityUrl(point: GeoPoint) {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    timezone: 'auto',
    hourly: ['us_aqi', 'pm2_5', 'pm10'].join(','),
    forecast_hours: '1',
  });
  return `${env.openMeteoAirQualityBaseUrl}?${params.toString()}`;
}

/**
 * Fetches current + hourly + daily blocks in a single Open-Meteo request.
 * `hours`/`days` bound how much forecast data the response includes.
 */
export function fetchOpenMeteoForecast(
  point: GeoPoint,
  options: { hours?: number; days?: number } = {},
): Promise<OpenMeteoForecastResponse> {
  const hours = options.hours ?? 24;
  const days = options.days ?? 7;
  return requestJson<OpenMeteoForecastResponse>(buildForecastUrl(point, { hours, days }));
}

export function fetchOpenMeteoAirQuality(point: GeoPoint): Promise<OpenMeteoAirQualityResponse> {
  return requestJson<OpenMeteoAirQualityResponse>(buildAirQualityUrl(point));
}
