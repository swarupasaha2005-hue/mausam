import type { CurrentWeather } from './weather';
import type { UserContext, WeatherPriority } from './personalization';

/** Category of recommendation. Deliberately small — not dozens of cases. */
export type RecommendationType =
  'FAVORABLE' | 'CAUTION' | 'AVOID' | 'RESCHEDULE' | 'PREPARE' | 'ALERT';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'severe';

/**
 * Weather factor codes the rule engine can trigger. Mirrors WeatherPriority
 * so a factor can be checked against a persona's weatherPriorities.
 */
export type RecommendationFactor =
  | 'HIGH_TEMPERATURE'
  | 'HIGH_FEELS_LIKE'
  | 'HIGH_HUMIDITY'
  | 'HIGH_UV'
  | 'HIGH_RAIN_PROBABILITY'
  | 'VERY_HIGH_RAIN_PROBABILITY'
  | 'HIGH_WIND'
  | 'LOW_VISIBILITY'
  | 'SEVERE_WEATHER'
  | 'POOR_AIR_QUALITY'
  | 'FAVORABLE_CONDITIONS';

/**
 * A single actionable, explainable result. `reasons` are the factor codes
 * that triggered it — the "explainability" this rule-based engine relies
 * on instead of an LLM.
 */
export interface Recommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  action: string;
  reasons: RecommendationFactor[];
  /** Optional 0-100 CLOUD6 prototype risk score — a heuristic ranking aid, not a validated index. */
  confidence?: number;
}

/** Full output of the Recommendation Engine for one weather+context evaluation. */
export interface RecommendationResult {
  primaryRecommendation: Recommendation | null;
  recommendations: Recommendation[];
  evaluatedFactors: RecommendationFactor[];
}

/** Input the engine consumes — already-fetched weather and already-built context. */
export interface RecommendationInput {
  context: UserContext;
  weather: CurrentWeather;
}

/** Maps a triggered factor to the WeatherPriority a persona must care about for it to be relevant. */
export const FACTOR_PRIORITY: Record<
  Exclude<RecommendationFactor, 'FAVORABLE_CONDITIONS'>,
  WeatherPriority
> = {
  HIGH_TEMPERATURE: 'temperature',
  HIGH_FEELS_LIKE: 'feels_like',
  HIGH_HUMIDITY: 'humidity',
  HIGH_UV: 'uv',
  HIGH_RAIN_PROBABILITY: 'rain_probability',
  VERY_HIGH_RAIN_PROBABILITY: 'rain_probability',
  HIGH_WIND: 'wind',
  LOW_VISIBILITY: 'visibility',
  SEVERE_WEATHER: 'severe_weather',
  POOR_AIR_QUALITY: 'air_quality',
};
