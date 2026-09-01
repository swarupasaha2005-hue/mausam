import {
  LocationError,
  PersonalizationError,
  RecommendationError,
  WeatherError,
  type CurrentWeather,
  type Location,
  type Persona,
  type RecommendationResult,
  type TimeOfDay,
  type UserContext,
} from '@cloud6/shared';
import { geocodingService, locationService } from '../location';
import { weatherService } from '../weather';
import { personalizationService } from '../personalization';
import { recommendationsService } from '../recommendations';

/**
 * Mobile-only presentation/orchestration model — combines the outputs of
 * the existing Location/Weather/Personalization/Recommendation services
 * for one screen. Each piece can be null with its own error, so a
 * downstream failure (e.g. recommendation) never hides upstream success
 * (e.g. weather is still shown).
 */
export interface PersonalizedWeatherResult {
  location: Location | null;
  locationError: LocationError | null;
  weather: CurrentWeather | null;
  weatherError: WeatherError | null;
  userContext: UserContext | null;
  personalizationError: PersonalizationError | null;
  recommendation: RecommendationResult | null;
  recommendationError: RecommendationError | null;
}

function emptyResult(): PersonalizedWeatherResult {
  return {
    location: null,
    locationError: null,
    weather: null,
    weatherError: null,
    userContext: null,
    personalizationError: null,
    recommendation: null,
    recommendationError: null,
  };
}

/**
 * Orchestrates the existing CLOUD6 services — no domain logic of its own.
 * Weather normalization, persona configuration, and recommendation rules
 * all stay in their respective services; this only sequences the calls
 * and combines the results for the mobile UI.
 */
export const dashboardService = {
  /** Full pipeline: location → weather → user context → recommendation. */
  async getPersonalizedWeatherExperience(input: {
    persona: Persona;
    preferredTimeOfDay?: TimeOfDay;
  }): Promise<PersonalizedWeatherResult> {
    const result = emptyResult();

    try {
      const point = await locationService.getCurrentLocation();
      const place = await geocodingService.reverseGeocode(point).catch(() => ({}));
      result.location = { ...point, ...place };
    } catch (cause) {
      result.locationError =
        cause instanceof LocationError ? cause : new LocationError('LOCATION_UNAVAILABLE');
      return result;
    }

    const [weatherOutcome, contextOutcome] = await Promise.all([
      weatherService
        .getCurrentWeather(result.location)
        .then((snapshot) => ({ ok: true as const, value: snapshot.current }))
        .catch((cause) => ({
          ok: false as const,
          error: cause instanceof WeatherError ? cause : new WeatherError('WEATHER_REQUEST_FAILED'),
        })),
      personalizationService
        .createUserContext(input)
        .then((context) => ({ ok: true as const, value: context }))
        .catch((cause) => ({
          ok: false as const,
          error:
            cause instanceof PersonalizationError
              ? cause
              : new PersonalizationError('PERSONA_INVALID'),
        })),
    ]);

    if (weatherOutcome.ok) {
      result.weather = weatherOutcome.value;
    } else {
      result.weatherError = weatherOutcome.error;
    }

    if (contextOutcome.ok) {
      result.userContext = contextOutcome.value;
    } else {
      result.personalizationError = contextOutcome.error;
    }

    if (result.weather && result.userContext) {
      try {
        result.recommendation = await recommendationsService.generate(
          result.userContext,
          result.weather,
        );
      } catch (cause) {
        result.recommendationError =
          cause instanceof RecommendationError
            ? cause
            : new RecommendationError('RECOMMENDATION_INVALID_WEATHER');
      }
    }

    return result;
  },

  /**
   * Persona/time changed but the weather already fetched is still valid —
   * regenerate only the context + recommendation, without re-requesting
   * location or weather.
   */
  async regenerateRecommendation(
    weather: CurrentWeather,
    input: { persona: Persona; preferredTimeOfDay?: TimeOfDay },
  ): Promise<
    Pick<
      PersonalizedWeatherResult,
      'userContext' | 'personalizationError' | 'recommendation' | 'recommendationError'
    >
  > {
    const partial: Pick<
      PersonalizedWeatherResult,
      'userContext' | 'personalizationError' | 'recommendation' | 'recommendationError'
    > = {
      userContext: null,
      personalizationError: null,
      recommendation: null,
      recommendationError: null,
    };

    try {
      partial.userContext = await personalizationService.createUserContext(input);
    } catch (cause) {
      partial.personalizationError =
        cause instanceof PersonalizationError ? cause : new PersonalizationError('PERSONA_INVALID');
      return partial;
    }

    try {
      partial.recommendation = await recommendationsService.generate(partial.userContext, weather);
    } catch (cause) {
      partial.recommendationError =
        cause instanceof RecommendationError
          ? cause
          : new RecommendationError('RECOMMENDATION_INVALID_WEATHER');
    }

    return partial;
  },
};
