import { WeatherError } from '@cloud6/shared';

/** Ensures any thrown value reaching WeatherService callers is a WeatherError. */
export function toWeatherError(cause: unknown): WeatherError {
  if (cause instanceof WeatherError) {
    return cause;
  }
  return new WeatherError(
    'WEATHER_PROVIDER_ERROR',
    cause instanceof Error ? cause.message : 'Unexpected weather provider failure',
  );
}
