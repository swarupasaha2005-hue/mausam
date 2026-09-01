import type { RecommendationPriority, RecommendationType } from './recommendation';
import type { JourneyWeatherPlan, JourneyWeatherTransition } from './journey-weather';

/**
 * Journey-level weather factors — distinct from (not the same namespace
 * as) Phase 5's per-moment `RecommendationFactor`, since these describe
 * conditions across a journey rather than at a single point in time.
 */
export type JourneyFactor =
  | 'RAIN_DURING_JOURNEY'
  | 'HEAVY_RAIN_DURING_JOURNEY'
  | 'THUNDERSTORM_DURING_JOURNEY'
  | 'HIGH_WIND_DURING_JOURNEY'
  | 'HIGH_HEAT_DURING_JOURNEY'
  | 'HIGH_UV_DURING_JOURNEY'
  | 'WEATHER_DETERIORATION'
  | 'SEVERE_WEATHER_NEAR_DESTINATION'
  | 'FAVORABLE_JOURNEY';

/** Reuses the same qualitative scale as Recommendation.priority — no separate numeric score. */
export type JourneyRiskLevel = RecommendationPriority;

export type JourneyAnalysisConfidence = 'high' | 'medium' | 'low';

/** The approximate portion of the route where the primary concern occurs, if any. */
export interface JourneyAffectedSegment {
  fromDistanceKm: number;
  toDistanceKm: number;
}

/**
 * Deterministic, explainable assessment of a JourneyWeatherPlan — no
 * numeric risk score, no AI. `reasons` are human-readable sentences
 * generated from the actual detected factors, not free text.
 */
export interface JourneyAnalysis {
  riskLevel: JourneyRiskLevel;
  primaryConcern: string;
  factors: JourneyFactor[];
  affectedCheckpointSequences: number[];
  affectedSegment: JourneyAffectedSegment | null;
  firstAffectedCheckpointSequence: number | null;
  transitions: JourneyWeatherTransition[];
  weatherAvailableCheckpoints: number;
  weatherUnavailableCheckpoints: number;
  confidence: JourneyAnalysisConfidence;
  reasons: string[];
}

/** Structurally mirrors Recommendation, but over JourneyFactor reasons instead of RecommendationFactor. */
export interface JourneyRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  message: string;
  action: string;
  reasons: JourneyFactor[];
}

/** The full Phase 10 result: weather timeline + analysis + actionable recommendation. */
export interface JourneyIntelligence {
  journeyWeatherPlan: JourneyWeatherPlan;
  analysis: JourneyAnalysis;
  recommendation: JourneyRecommendation;
}
