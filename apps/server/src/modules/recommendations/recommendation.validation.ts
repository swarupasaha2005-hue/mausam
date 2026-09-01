import { RecommendationError, type CurrentWeather, type UserContext } from '@cloud6/shared';
import { isValidPersona } from '../personalization/persona.config';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidPercentage(value: unknown): boolean {
  return isFiniteNumber(value) && value >= 0 && value <= 100;
}

/** Structural + range validation for the weather input to the rule engine. */
export function assertValidWeather(weather: unknown): asserts weather is CurrentWeather {
  if (!weather || typeof weather !== 'object') {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'weather is required');
  }

  const w = weather as Partial<CurrentWeather>;

  if (!isFiniteNumber(w.temperature) || w.temperature < -50 || w.temperature > 60) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid temperature');
  }
  if (!isFiniteNumber(w.feelsLike) || w.feelsLike < -60 || w.feelsLike > 70) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid feelsLike');
  }
  if (!isValidPercentage(w.humidity)) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid humidity');
  }
  if (!isFiniteNumber(w.precipitation) || w.precipitation < 0) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid precipitation');
  }
  if (!isValidPercentage(w.rainProbability)) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid rainProbability');
  }
  if (!isFiniteNumber(w.windSpeed) || w.windSpeed < 0) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid windSpeed');
  }
  if (!isFiniteNumber(w.uvIndex) || w.uvIndex < 0) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid uvIndex');
  }
  if (!isFiniteNumber(w.visibility) || w.visibility < 0) {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid visibility');
  }
  if (typeof w.weatherCode !== 'string') {
    throw new RecommendationError('RECOMMENDATION_INVALID_WEATHER', 'Invalid weatherCode');
  }
}

/** Structural validation for the UserContext input to the rule engine. */
export function assertValidContext(context: unknown): asserts context is UserContext {
  if (!context || typeof context !== 'object') {
    throw new RecommendationError('RECOMMENDATION_INVALID_CONTEXT', 'context is required');
  }

  const c = context as Partial<UserContext>;

  if (!isValidPersona(c.persona)) {
    throw new RecommendationError(
      'RECOMMENDATION_INVALID_CONTEXT',
      `Unknown persona: ${String(c.persona)}`,
    );
  }
  if (!Array.isArray(c.weatherPriorities)) {
    throw new RecommendationError(
      'RECOMMENDATION_INVALID_CONTEXT',
      'context.weatherPriorities is required',
    );
  }
  if (!Array.isArray(c.activities)) {
    throw new RecommendationError(
      'RECOMMENDATION_INVALID_CONTEXT',
      'context.activities is required',
    );
  }
  if (typeof c.preferredTimeOfDay !== 'string') {
    throw new RecommendationError(
      'RECOMMENDATION_INVALID_CONTEXT',
      'context.preferredTimeOfDay is required',
    );
  }
}
