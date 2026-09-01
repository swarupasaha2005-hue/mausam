import type {
  JourneyAffectedSegment,
  JourneyAnalysis,
  JourneyAnalysisConfidence,
  JourneyFactor,
  JourneyRiskLevel,
  JourneyWeatherCheckpoint,
  JourneyWeatherPlan,
  UserContext,
  WeatherPriority,
} from '@cloud6/shared';
import { JOURNEY_ANALYSIS_CONFIG } from './journey.analysis.config';
import { evaluateCheckpointFactors, weatherCodeSeverity } from './journey.analysis.rules';

/** Maps a journey factor to the WeatherPriority a persona must care about for it to be relevant.
 * Mirrors Phase 5's `FACTOR_PRIORITY`. Journey-level safety signals
 * (deterioration, severe weather near destination) are always relevant,
 * regardless of persona — like `FAVORABLE_CONDITIONS` in Phase 5.
 */
const ALWAYS_RELEVANT: JourneyFactor[] = [
  'WEATHER_DETERIORATION',
  'SEVERE_WEATHER_NEAR_DESTINATION',
  'FAVORABLE_JOURNEY',
];

const JOURNEY_FACTOR_PRIORITY: Partial<Record<JourneyFactor, WeatherPriority>> = {
  RAIN_DURING_JOURNEY: 'rain_probability',
  HEAVY_RAIN_DURING_JOURNEY: 'rain_probability',
  THUNDERSTORM_DURING_JOURNEY: 'severe_weather',
  HIGH_WIND_DURING_JOURNEY: 'wind',
  HIGH_HEAT_DURING_JOURNEY: 'temperature',
  HIGH_UV_DURING_JOURNEY: 'uv',
};

const FACTOR_SEVERITY_WEIGHT: Record<JourneyFactor, number> = {
  THUNDERSTORM_DURING_JOURNEY: 4,
  SEVERE_WEATHER_NEAR_DESTINATION: 4,
  HEAVY_RAIN_DURING_JOURNEY: 3,
  RAIN_DURING_JOURNEY: 2,
  HIGH_WIND_DURING_JOURNEY: 2,
  HIGH_HEAT_DURING_JOURNEY: 2,
  HIGH_UV_DURING_JOURNEY: 2,
  WEATHER_DETERIORATION: 2,
  FAVORABLE_JOURNEY: 1,
};

const SEVERITY_TO_RISK_LEVEL: Record<number, JourneyRiskLevel> = {
  4: 'severe',
  3: 'high',
  2: 'medium',
  1: 'low',
};

const FACTOR_DESCRIPTION: Record<JourneyFactor, string> = {
  RAIN_DURING_JOURNEY: 'Rain probability is elevated during part of your journey.',
  HEAVY_RAIN_DURING_JOURNEY: 'Heavy rain is likely during part of your journey.',
  THUNDERSTORM_DURING_JOURNEY: 'Thunderstorm conditions are detected along your journey.',
  HIGH_WIND_DURING_JOURNEY: 'Wind speed is high along part of your journey.',
  HIGH_HEAT_DURING_JOURNEY: 'Temperature is high along part of your journey.',
  HIGH_UV_DURING_JOURNEY: 'UV levels are high along part of your journey.',
  WEATHER_DETERIORATION: 'Weather conditions deteriorate as your journey progresses.',
  SEVERE_WEATHER_NEAR_DESTINATION: 'Severe weather is expected near your destination.',
  FAVORABLE_JOURNEY: 'Conditions look favorable along your journey.',
};

function isRelevantForPersona(factor: JourneyFactor, context: UserContext): boolean {
  if (ALWAYS_RELEVANT.includes(factor)) {
    return true;
  }
  const priority = JOURNEY_FACTOR_PRIORITY[factor];
  return priority ? context.weatherPriorities.includes(priority) : false;
}

function computeConfidence(available: number, total: number): JourneyAnalysisConfidence {
  if (total === 0) return 'low';
  const fraction = available / total;
  if (fraction >= JOURNEY_ANALYSIS_CONFIG.CONFIDENCE_HIGH_THRESHOLD) return 'high';
  if (fraction >= JOURNEY_ANALYSIS_CONFIG.CONFIDENCE_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Pure, deterministic journey assessment: JourneyWeatherPlan + UserContext
 * in, explainable JourneyAnalysis out. No network calls, no Date.now(),
 * no React. Missing checkpoint weather is never treated as bad weather —
 * it's excluded from factor detection and only affects `confidence`.
 */
export function analyzeJourney(plan: JourneyWeatherPlan, context: UserContext): JourneyAnalysis {
  const checkpoints = plan.checkpoints;
  const withWeather = checkpoints.filter(
    (
      c,
    ): c is JourneyWeatherCheckpoint & {
      weather: NonNullable<JourneyWeatherCheckpoint['weather']>;
    } => c.weather !== null,
  );
  const weatherAvailableCheckpoints = withWeather.length;
  const weatherUnavailableCheckpoints = checkpoints.length - weatherAvailableCheckpoints;

  // Per-checkpoint factors, filtered to what this persona cares about.
  const perCheckpointFactors = withWeather.map((checkpoint) => ({
    checkpoint,
    factors: evaluateCheckpointFactors(checkpoint.weather).filter((f) =>
      isRelevantForPersona(f, context),
    ),
  }));

  const affected = perCheckpointFactors.filter((entry) => entry.factors.length > 0);
  const affectedCheckpointSequences = affected.map((entry) => entry.checkpoint.sequence);
  const firstAffectedCheckpointSequence = affected[0]?.checkpoint.sequence ?? null;

  const affectedSegment: JourneyAffectedSegment | null =
    affected.length > 0
      ? {
          fromDistanceKm: Math.min(...affected.map((e) => e.checkpoint.distanceFromStartKm)),
          toDistanceKm: Math.max(...affected.map((e) => e.checkpoint.distanceFromStartKm)),
        }
      : null;

  // Journey-level factors.
  const journeyLevelFactors: JourneyFactor[] = [];
  if (withWeather.length >= 2) {
    const firstSeverity = weatherCodeSeverity(withWeather[0].weather.weatherCode);
    const lastSeverity = weatherCodeSeverity(
      withWeather[withWeather.length - 1].weather.weatherCode,
    );
    if (lastSeverity > firstSeverity) {
      journeyLevelFactors.push('WEATHER_DETERIORATION');
    }
  }
  const nearDestinationCount = Math.max(
    1,
    Math.round(checkpoints.length * JOURNEY_ANALYSIS_CONFIG.NEAR_DESTINATION_FRACTION),
  );
  const nearDestination = withWeather.slice(-nearDestinationCount);
  if (nearDestination.some((c) => weatherCodeSeverity(c.weather.weatherCode) >= 4)) {
    journeyLevelFactors.push('SEVERE_WEATHER_NEAR_DESTINATION');
  }

  const allFactors = [...new Set([...affected.flatMap((e) => e.factors), ...journeyLevelFactors])];
  const relevantFactors = allFactors.length > 0 ? allFactors : (['FAVORABLE_JOURNEY'] as const);

  const topFactor = [...relevantFactors].sort(
    (a, b) => FACTOR_SEVERITY_WEIGHT[b] - FACTOR_SEVERITY_WEIGHT[a],
  )[0];

  const riskLevel: JourneyRiskLevel =
    weatherAvailableCheckpoints === 0
      ? 'low'
      : SEVERITY_TO_RISK_LEVEL[FACTOR_SEVERITY_WEIGHT[topFactor]];

  const primaryConcern =
    weatherAvailableCheckpoints === 0
      ? 'Weather information is unavailable for this journey.'
      : FACTOR_DESCRIPTION[topFactor];

  const reasons: string[] = [];
  if (weatherAvailableCheckpoints === 0) {
    reasons.push('No weather data could be retrieved for this journey.');
  } else {
    for (const entry of affected) {
      for (const factor of entry.factors) {
        reasons.push(
          `${FACTOR_DESCRIPTION[factor]} (checkpoint ${entry.checkpoint.sequence}, ${entry.checkpoint.distanceFromStartKm.toFixed(1)} km).`,
        );
      }
    }
    if (journeyLevelFactors.includes('WEATHER_DETERIORATION')) {
      reasons.push(FACTOR_DESCRIPTION.WEATHER_DETERIORATION);
    }
    if (journeyLevelFactors.includes('SEVERE_WEATHER_NEAR_DESTINATION')) {
      reasons.push(FACTOR_DESCRIPTION.SEVERE_WEATHER_NEAR_DESTINATION);
    }
    if (reasons.length === 0) {
      reasons.push(FACTOR_DESCRIPTION.FAVORABLE_JOURNEY);
    }
  }

  return {
    riskLevel,
    primaryConcern,
    factors: relevantFactors as JourneyFactor[],
    affectedCheckpointSequences,
    affectedSegment,
    firstAffectedCheckpointSequence,
    transitions: plan.summary.transitions,
    weatherAvailableCheckpoints,
    weatherUnavailableCheckpoints,
    confidence: computeConfidence(weatherAvailableCheckpoints, checkpoints.length),
    reasons,
  };
}
