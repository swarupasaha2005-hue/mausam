import type {
  JourneyWeatherCheckpoint,
  JourneyWeatherSummary,
  JourneyWeatherTransition,
} from '@cloud6/shared';
import { JOURNEY_WEATHER_CONFIG, RAIN_WEATHER_CODES } from './journey.weather.config';

/** Detects a weatherCode change between consecutive checkpoints that both have weather. */
export function detectWeatherTransitions(
  checkpoints: JourneyWeatherCheckpoint[],
): JourneyWeatherTransition[] {
  const transitions: JourneyWeatherTransition[] = [];
  const withWeather = checkpoints.filter((c) => c.weather !== null);

  for (let i = 1; i < withWeather.length; i += 1) {
    const previous = withWeather[i - 1];
    const current = withWeather[i];
    if (previous.weather!.weatherCode !== current.weather!.weatherCode) {
      transitions.push({
        fromSequence: previous.sequence,
        toSequence: current.sequence,
        fromCondition: previous.weather!.weatherCode,
        toCondition: current.weather!.weatherCode,
      });
    }
  }

  return transitions;
}

function isRainAffected(checkpoint: JourneyWeatherCheckpoint): boolean {
  if (!checkpoint.weather) return false;
  return (
    checkpoint.weather.rainProbability >=
      JOURNEY_WEATHER_CONFIG.RAIN_PROBABILITY_THRESHOLD_PERCENT ||
    RAIN_WEATHER_CODES.includes(checkpoint.weather.weatherCode)
  );
}

/** Simple derived overview — no risk scoring, no recommendations. */
export function summarizeJourneyWeather(
  checkpoints: JourneyWeatherCheckpoint[],
): JourneyWeatherSummary {
  const weatherAvailableCheckpoints = checkpoints.filter((c) => c.weather !== null).length;
  const weatherUnavailableCheckpoints = checkpoints.length - weatherAvailableCheckpoints;

  const rainAffected = checkpoints.filter(isRainAffected);
  const firstRainCheckpointSequence = rainAffected.length > 0 ? rainAffected[0].sequence : null;

  return {
    weatherAvailableCheckpoints,
    weatherUnavailableCheckpoints,
    rainAffectedCheckpointCount: rainAffected.length,
    firstRainCheckpointSequence,
    transitions: detectWeatherTransitions(checkpoints),
  };
}
