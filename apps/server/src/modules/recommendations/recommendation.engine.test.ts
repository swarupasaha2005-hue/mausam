import { generateRecommendations } from './recommendation.engine';
import {
  combinedRiskWeatherFixture,
  commuterContextFixture,
  favorableWeatherFixture,
  hotWeatherFixture,
  makeUserContext,
  rainyWeatherFixture,
  runnerContextFixture,
  windyWeatherFixture,
} from '../../../test/fixtures/cloud6/recommendation';

describe('generateRecommendations — favorable conditions', () => {
  it('produces a FAVORABLE primary recommendation for comfortable weather', () => {
    const result = generateRecommendations(favorableWeatherFixture, runnerContextFixture);
    expect(result.primaryRecommendation?.type).toBe('FAVORABLE');
    expect(result.evaluatedFactors).toEqual(['FAVORABLE_CONDITIONS']);
  });
});

describe('generateRecommendations — high temperature', () => {
  it('produces a caution recommendation for a temperature-sensitive persona', () => {
    const result = generateRecommendations(hotWeatherFixture, runnerContextFixture);
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).toContain('HIGH_TEMPERATURE');
  });
});

describe('generateRecommendations — high humidity', () => {
  it('surfaces humidity for runner (a humidity-relevant persona)', () => {
    const result = generateRecommendations(hotWeatherFixture, runnerContextFixture);
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).toContain('HIGH_HUMIDITY');
  });

  it('does not surface humidity for commuter (not in their priorities)', () => {
    const result = generateRecommendations(hotWeatherFixture, commuterContextFixture);
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).not.toContain('HIGH_HUMIDITY');
  });
});

describe('generateRecommendations — high UV', () => {
  it('surfaces UV for runner/outdoor/health personas', () => {
    const result = generateRecommendations(
      { ...favorableWeatherFixture, uvIndex: 9 },
      makeUserContext({
        persona: 'health',
        weatherPriorities: ['temperature', 'feels_like', 'humidity', 'uv', 'air_quality'],
      }),
    );
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).toContain('HIGH_UV');
  });
});

describe('generateRecommendations — high rain probability', () => {
  it('produces a RESCHEDULE recommendation for a runner facing very high rain probability', () => {
    const result = generateRecommendations(rainyWeatherFixture, runnerContextFixture);
    expect(result.primaryRecommendation?.type).toBe('RESCHEDULE');
  });

  it('produces a rain-related caution for a commuter', () => {
    const result = generateRecommendations(rainyWeatherFixture, commuterContextFixture);
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).toContain('VERY_HIGH_RAIN_PROBABILITY');
  });
});

describe('generateRecommendations — high wind', () => {
  it('surfaces wind for a wind-relevant persona', () => {
    const result = generateRecommendations(windyWeatherFixture, commuterContextFixture);
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).toContain('HIGH_WIND');
  });
});

describe('generateRecommendations — multiple factors', () => {
  it('produces a prioritized, sensible result for combined-risk weather', () => {
    const result = generateRecommendations(combinedRiskWeatherFixture, runnerContextFixture);

    expect(result.evaluatedFactors.length).toBeGreaterThan(1);
    expect(result.recommendations.length).toBeGreaterThan(1);
    // highest-priority recommendation should be first
    const weights = { severe: 4, high: 3, medium: 2, low: 1 } as const;
    const priorities = result.recommendations.map((r) => weights[r.priority]);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });
});

describe('generateRecommendations — persona differences', () => {
  it('gives different recommendations for the same weather across personas', () => {
    const runnerResult = generateRecommendations(rainyWeatherFixture, runnerContextFixture);
    const commuterResult = generateRecommendations(rainyWeatherFixture, commuterContextFixture);

    expect(runnerResult.primaryRecommendation?.title).not.toBe(
      commuterResult.primaryRecommendation?.title,
    );
  });

  it('excludes factors outside a persona weatherPriorities entirely', () => {
    const agricultureContext = makeUserContext({
      persona: 'agriculture',
      weatherPriorities: ['precipitation', 'temperature', 'humidity', 'wind'],
    });
    const result = generateRecommendations(
      { ...favorableWeatherFixture, uvIndex: 9 },
      agricultureContext,
    );
    const reasons = result.recommendations.flatMap((r) => r.reasons);
    expect(reasons).not.toContain('HIGH_UV');
  });
});
