/**
 * Centralized, easy-to-tune route-sampling configuration. Change these
 * directly rather than scattering numbers through journey.sampler.ts.
 */
export const JOURNEY_CONFIG = {
  DEFAULT_SAMPLE_INTERVAL_KM: 2,
  MIN_SAMPLE_INTERVAL_KM: 0.5,
  MAX_CHECKPOINTS: 20,
} as const;
