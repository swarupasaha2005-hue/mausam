import {
  WeatherError,
  type DailyWeather,
  type GeoPoint,
  type HourlyWeather,
  type WeatherErrorCode,
  type WeatherSnapshot,
} from '@cloud6/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

interface HourlyForecastResponse {
  location: GeoPoint;
  hourly: HourlyWeather[];
}

interface DailyForecastResponse {
  location: GeoPoint;
  daily: DailyWeather[];
}

async function requestJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch (cause) {
    throw new WeatherError(
      'WEATHER_REQUEST_FAILED',
      cause instanceof Error ? cause.message : 'Network request to CLOUD6 backend failed',
    );
  }

  if (!response.ok) {
    let code: WeatherErrorCode = 'WEATHER_PROVIDER_ERROR';
    try {
      const body = (await response.json()) as { error?: { code?: WeatherErrorCode } };
      if (body?.error?.code) {
        code = body.error.code;
      }
    } catch {
      // response body wasn't JSON — fall back to the generic code above.
    }
    throw new WeatherError(code, `CLOUD6 backend responded with HTTP ${response.status}`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new WeatherError(
      'WEATHER_INVALID_RESPONSE',
      'CLOUD6 backend response was not valid JSON',
    );
  }
}

function buildQuery(point: GeoPoint, extra?: Record<string, string>): string {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    ...extra,
  });
  return params.toString();
}

/**
 * Mobile-side weather client. Talks only to the CLOUD6 backend
 * (`/api/weather/*`) — never to Open-Meteo directly, and never imports
 * anything from the server's integrations layer.
 */
export const weatherService = {
  async getCurrentWeather(point: GeoPoint): Promise<WeatherSnapshot> {
    return requestJson<WeatherSnapshot>(`/api/weather/current?${buildQuery(point)}`);
  },

  async getHourlyForecast(point: GeoPoint, hours?: number): Promise<HourlyForecastResponse> {
    const extra = hours ? { hours: String(hours) } : undefined;
    return requestJson<HourlyForecastResponse>(`/api/weather/hourly?${buildQuery(point, extra)}`);
  },

  async getDailyForecast(point: GeoPoint, days?: number): Promise<DailyForecastResponse> {
    const extra = days ? { days: String(days) } : undefined;
    return requestJson<DailyForecastResponse>(`/api/weather/daily?${buildQuery(point, extra)}`);
  },
};
