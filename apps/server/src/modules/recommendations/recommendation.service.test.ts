import { RecommendationError } from '@cloud6/shared';
import { RecommendationService } from './recommendation.service';
import {
  favorableWeatherFixture,
  runnerContextFixture,
} from '../../../test/fixtures/cloud6/recommendation';

describe('RecommendationService.generate', () => {
  const service = new RecommendationService();

  it('returns a RecommendationResult for valid input', () => {
    const result = service.generate({
      context: runnerContextFixture,
      weather: favorableWeatherFixture,
    });
    expect(result.primaryRecommendation).not.toBeNull();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('throws RECOMMENDATION_INVALID_CONTEXT for a missing context', () => {
    expect(() =>
      service.generate({ context: undefined, weather: favorableWeatherFixture }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_CONTEXT' }));
  });

  it('throws RECOMMENDATION_INVALID_CONTEXT for an invalid persona', () => {
    expect(() =>
      service.generate({
        context: { ...runnerContextFixture, persona: 'astronaut' },
        weather: favorableWeatherFixture,
      }),
    ).toThrow(RecommendationError);
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for missing weather', () => {
    expect(() => service.generate({ context: runnerContextFixture, weather: undefined })).toThrow(
      expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }),
    );
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for an invalid temperature', () => {
    expect(() =>
      service.generate({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, temperature: 'hot' },
      }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }));
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for an invalid humidity (out of 0-100 range)', () => {
    expect(() =>
      service.generate({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, humidity: 150 },
      }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }));
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for an invalid UV index', () => {
    expect(() =>
      service.generate({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, uvIndex: -5 },
      }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }));
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for an invalid precipitation value', () => {
    expect(() =>
      service.generate({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, precipitation: -1 },
      }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }));
  });

  it('throws RECOMMENDATION_INVALID_WEATHER for an invalid rainProbability (out of 0-100 range)', () => {
    expect(() =>
      service.generate({
        context: runnerContextFixture,
        weather: { ...favorableWeatherFixture, rainProbability: 120 },
      }),
    ).toThrow(expect.objectContaining({ code: 'RECOMMENDATION_INVALID_WEATHER' }));
  });
});
