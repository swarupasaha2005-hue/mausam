import { evaluateCheckpointFactors, weatherCodeSeverity } from './journey.analysis.rules';
import { makeHourlyWeather } from '../../../test/fixtures/cloud6/journey';

describe('evaluateCheckpointFactors', () => {
  it('returns no factors for comfortable weather', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather())).toEqual([]);
  });

  it('flags RAIN_DURING_JOURNEY for high rain probability', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather({ rainProbability: 65 }))).toContain(
      'RAIN_DURING_JOURNEY',
    );
  });

  it('flags HEAVY_RAIN_DURING_JOURNEY for very high rain probability', () => {
    const factors = evaluateCheckpointFactors(makeHourlyWeather({ rainProbability: 85 }));
    expect(factors).toContain('HEAVY_RAIN_DURING_JOURNEY');
    expect(factors).not.toContain('RAIN_DURING_JOURNEY');
  });

  it('flags THUNDERSTORM_DURING_JOURNEY for a thunderstorm weather code', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather({ weatherCode: 'thunderstorm' }))).toContain(
      'THUNDERSTORM_DURING_JOURNEY',
    );
  });

  it('flags HIGH_WIND_DURING_JOURNEY for high wind speed', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather({ windSpeed: 40 }))).toContain(
      'HIGH_WIND_DURING_JOURNEY',
    );
  });

  it('flags HIGH_HEAT_DURING_JOURNEY for high temperature', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather({ temperature: 35 }))).toContain(
      'HIGH_HEAT_DURING_JOURNEY',
    );
  });

  it('flags HIGH_UV_DURING_JOURNEY for high UV', () => {
    expect(evaluateCheckpointFactors(makeHourlyWeather({ uvIndex: 9 }))).toContain(
      'HIGH_UV_DURING_JOURNEY',
    );
  });
});

describe('weatherCodeSeverity', () => {
  it('ranks thunderstorm above rain above clear', () => {
    expect(weatherCodeSeverity('thunderstorm')).toBeGreaterThan(weatherCodeSeverity('rain'));
    expect(weatherCodeSeverity('rain')).toBeGreaterThan(weatherCodeSeverity('clear'));
  });
});
