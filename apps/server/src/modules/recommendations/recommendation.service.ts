import type { AirQuality, CurrentWeather, RecommendationResult, UserContext } from '@cloud6/shared';
import { generateRecommendations } from './recommendation.engine';
import { assertValidContext, assertValidWeather } from './recommendation.validation';

/**
 * Application-facing entry point. Validates input and delegates to the
 * pure rule engine — does not fetch weather (WeatherService's job) or
 * build UserContext (PersonalizationService's job).
 */
export class RecommendationService {
  generate(input: {
    context: unknown;
    weather: unknown;
    airQuality?: AirQuality;
  }): RecommendationResult {
    assertValidContext(input.context);
    assertValidWeather(input.weather);
    return generateRecommendations(
      input.weather as CurrentWeather,
      input.context as UserContext,
      input.airQuality,
    );
  }
}

export const recommendationService = new RecommendationService();
