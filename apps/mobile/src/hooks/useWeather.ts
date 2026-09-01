import { useCallback, useEffect, useState } from 'react';
import {
  LocationError,
  PersonalizationError,
  RecommendationError,
  WeatherError,
  type CurrentWeather,
  type DailyWeather,
  type HourlyWeather,
  type Location,
  type RecommendationResult,
} from '@cloud6/shared';
import { geocodingService, locationService } from '../services/location';
import { weatherService } from '../services/weather';
import { personalizationService } from '../services/personalization';
import { recommendationsService } from '../services/recommendations';

const DEFAULT_PERSONA = 'runner' as const;
const HOURLY_HOURS = 8;
const DAILY_DAYS = 6;

interface UseWeatherState {
  location: Location | null;
  locationError: LocationError | null;
  locationLoading: boolean;
  current: CurrentWeather | null;
  currentError: WeatherError | null;
  currentLoading: boolean;
  hourly: HourlyWeather[];
  hourlyError: WeatherError | null;
  hourlyLoading: boolean;
  daily: DailyWeather[];
  dailyError: WeatherError | null;
  dailyLoading: boolean;
  recommendation: RecommendationResult | null;
  recommendationError: PersonalizationError | RecommendationError | null;
}

function emptyState(): UseWeatherState {
  return {
    location: null,
    locationError: null,
    locationLoading: false,
    current: null,
    currentError: null,
    currentLoading: false,
    hourly: [],
    hourlyError: null,
    hourlyLoading: false,
    daily: [],
    dailyError: null,
    dailyLoading: false,
    recommendation: null,
    recommendationError: null,
  };
}

/**
 * Thin orchestration hook for the production Weather page — location via
 * LocationService/GeocodingService, current/hourly/daily via
 * weatherService, and (once current weather is available) a
 * personalized insight via the existing personalization +
 * recommendation services. No weather/recommendation logic lives here;
 * each section fails independently so one failed request never removes
 * data another section already has.
 */
export function useWeather() {
  const [state, setState] = useState<UseWeatherState>(emptyState());

  const refresh = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      locationLoading: true,
      locationError: null,
      currentError: null,
      hourlyError: null,
      dailyError: null,
      recommendationError: null,
    }));

    let point: { latitude: number; longitude: number };
    try {
      point = await locationService.getCurrentLocation();
      const place = await geocodingService.reverseGeocode(point).catch(() => ({}));
      setState((prev) => ({
        ...prev,
        location: { ...point, ...place },
        locationLoading: false,
      }));
    } catch (cause) {
      setState((prev) => ({
        ...prev,
        locationLoading: false,
        locationError:
          cause instanceof LocationError ? cause : new LocationError('LOCATION_UNAVAILABLE'),
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      currentLoading: true,
      hourlyLoading: true,
      dailyLoading: true,
    }));

    const currentPromise = weatherService
      .getCurrentWeather(point)
      .then((snapshot) => {
        setState((prev) => ({ ...prev, current: snapshot.current, currentLoading: false }));
        return snapshot.current;
      })
      .catch((cause) => {
        setState((prev) => ({
          ...prev,
          currentLoading: false,
          currentError: cause instanceof WeatherError ? cause : new WeatherError('WEATHER_REQUEST_FAILED'),
        }));
        return null;
      });

    weatherService
      .getHourlyForecast(point, HOURLY_HOURS)
      .then((forecast) => {
        setState((prev) => ({ ...prev, hourly: forecast.hourly, hourlyLoading: false }));
      })
      .catch((cause) => {
        setState((prev) => ({
          ...prev,
          hourlyLoading: false,
          hourlyError: cause instanceof WeatherError ? cause : new WeatherError('WEATHER_REQUEST_FAILED'),
        }));
      });

    weatherService
      .getDailyForecast(point, DAILY_DAYS)
      .then((forecast) => {
        setState((prev) => ({ ...prev, daily: forecast.daily, dailyLoading: false }));
      })
      .catch((cause) => {
        setState((prev) => ({
          ...prev,
          dailyLoading: false,
          dailyError: cause instanceof WeatherError ? cause : new WeatherError('WEATHER_REQUEST_FAILED'),
        }));
      });

    const current = await currentPromise;
    if (!current) {
      return;
    }

    try {
      const context = await personalizationService.createUserContext({ persona: DEFAULT_PERSONA });
      const recommendation = await recommendationsService.generate(context, current);
      setState((prev) => ({ ...prev, recommendation }));
    } catch (cause) {
      setState((prev) => ({
        ...prev,
        recommendationError:
          cause instanceof PersonalizationError || cause instanceof RecommendationError
            ? cause
            : new RecommendationError('RECOMMENDATION_INVALID_WEATHER'),
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, []);

  return { ...state, refresh };
}
