import { buildRecommendation, evaluateFactors } from './recommendation.rules';
import {
  favorableWeatherFixture,
  highUvWeatherFixture,
  hotWeatherFixture,
  rainyWeatherFixture,
  severeWeatherFixture,
  windyWeatherFixture,
} from '../../../test/fixtures/cloud6/recommendation';

describe('evaluateFactors', () => {
  it('returns FAVORABLE_CONDITIONS for comfortable weather', () => {
    expect(evaluateFactors(favorableWeatherFixture)).toEqual(['FAVORABLE_CONDITIONS']);
  });

  it('flags high temperature and feels-like/humidity for hot weather', () => {
    const factors = evaluateFactors(hotWeatherFixture);
    expect(factors).toEqual(
      expect.arrayContaining(['HIGH_TEMPERATURE', 'HIGH_FEELS_LIKE', 'HIGH_HUMIDITY']),
    );
  });

  it('flags very high rain probability for rainy weather', () => {
    expect(evaluateFactors(rainyWeatherFixture)).toContain('VERY_HIGH_RAIN_PROBABILITY');
  });

  it('flags high UV', () => {
    expect(evaluateFactors(highUvWeatherFixture)).toContain('HIGH_UV');
  });

  it('flags high wind', () => {
    expect(evaluateFactors(windyWeatherFixture)).toContain('HIGH_WIND');
  });

  it('flags severe weather for a thunderstorm weather code', () => {
    expect(evaluateFactors(severeWeatherFixture)).toContain('SEVERE_WEATHER');
  });

  it('flags poor air quality when an AirQuality reading exceeds the threshold', () => {
    const factors = evaluateFactors(favorableWeatherFixture, {
      location: { latitude: 0, longitude: 0 },
      aqi: 180,
      pm2_5: 60,
      pm10: 80,
      timestamp: '2026-09-01T12:00',
    });
    expect(factors).toContain('POOR_AIR_QUALITY');
  });
});

describe('buildRecommendation', () => {
  it('uses persona-specific wording when available', () => {
    const rec = buildRecommendation('runner', 'VERY_HIGH_RAIN_PROBABILITY');
    expect(rec.type).toBe('RESCHEDULE');
    expect(rec.title).toContain('run');
    expect(rec.reasons).toEqual(['VERY_HIGH_RAIN_PROBABILITY']);
  });

  it('falls back to generic wording for a persona without a bespoke template', () => {
    const rec = buildRecommendation('agriculture', 'HIGH_UV');
    expect(rec.reasons).toEqual(['HIGH_UV']);
    expect(rec.title.length).toBeGreaterThan(0);
  });
});
