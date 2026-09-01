import {
  FACTOR_PRIORITY,
  type AirQuality,
  type CurrentWeather,
  type Recommendation,
  type RecommendationFactor,
  type RecommendationResult,
  type UserContext,
} from '@cloud6/shared';
import { buildRecommendation, evaluateFactors } from './recommendation.rules';

const PRIORITY_WEIGHT: Record<Recommendation['priority'], number> = {
  severe: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function isRelevantForPersona(factor: RecommendationFactor, context: UserContext): boolean {
  if (factor === 'FAVORABLE_CONDITIONS') {
    return true;
  }
  return context.weatherPriorities.includes(FACTOR_PRIORITY[factor]);
}

/**
 * Pure deterministic rule engine: weather + context in, ranked
 * recommendations out. No weather fetching, no context creation, no AI —
 * see docs/architecture.md for the boundary with WeatherService/
 * PersonalizationService and the future AI Explanation Layer.
 */
export function generateRecommendations(
  weather: CurrentWeather,
  context: UserContext,
  airQuality?: AirQuality,
): RecommendationResult {
  const evaluatedFactors = evaluateFactors(weather, airQuality);
  const relevantFactors = evaluatedFactors.filter((factor) =>
    isRelevantForPersona(factor, context),
  );

  const factorsToUse =
    relevantFactors.length > 0 ? relevantFactors : (['FAVORABLE_CONDITIONS'] as const);

  const recommendations = factorsToUse
    .map((factor) => buildRecommendation(context.persona, factor))
    .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);

  return {
    primaryRecommendation: recommendations[0] ?? null,
    recommendations,
    evaluatedFactors,
  };
}
