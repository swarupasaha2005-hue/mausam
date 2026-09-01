/**
 * Journey-analysis-specific tuning. Per-condition thresholds
 * (temperature, rain probability, wind, UV, severe-weather codes) are
 * intentionally NOT duplicated here — they're imported directly from
 * `modules/recommendations/recommendation.thresholds.ts`, the single
 * source of truth Phase 5 already established.
 */
export const JOURNEY_ANALYSIS_CONFIG = {
  /** Last this fraction of the journey (by checkpoint index) counts as "near destination". */
  NEAR_DESTINATION_FRACTION: 0.25,
  /** Confidence thresholds, by fraction of checkpoints with available weather. */
  CONFIDENCE_HIGH_THRESHOLD: 0.8,
  CONFIDENCE_MEDIUM_THRESHOLD: 0.4,
} as const;
