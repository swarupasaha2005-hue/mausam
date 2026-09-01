import { useEffect, useState } from 'react';
import { WeatherError, type GeoPoint, type HourlyWeather } from '@cloud6/shared';
import { weatherService } from '../services/weather';

interface UseHourlyPreviewResult {
  hours: HourlyWeather[];
  loading: boolean;
  error: WeatherError | null;
}

const PREVIEW_HOURS = 3;

/**
 * Thin wrapper around weatherService.getHourlyForecast for the Home
 * screen's compact "next few hours" strip — no forecast logic of its
 * own, just fetches and slices to the next few hours.
 */
export function useHourlyPreview(location: GeoPoint | null): UseHourlyPreviewResult {
  const [hours, setHours] = useState<HourlyWeather[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);

  useEffect(() => {
    if (!location) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    weatherService
      .getHourlyForecast(location, PREVIEW_HOURS)
      .then((forecast) => {
        if (!cancelled) {
          setHours(forecast.hourly.slice(0, PREVIEW_HOURS));
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof WeatherError ? cause : new WeatherError('WEATHER_REQUEST_FAILED'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  return { hours, loading, error };
}
