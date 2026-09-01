import { detectWeatherTransitions, summarizeJourneyWeather } from './journey.weather.summary';
import { makeHourlyWeather, makeWeatherCheckpoint } from '../../../test/fixtures/cloud6/journey';

describe('detectWeatherTransitions', () => {
  it('detects a single CLEAR -> RAIN transition', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
      makeWeatherCheckpoint({ sequence: 2, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
      makeWeatherCheckpoint({ sequence: 3, weather: makeHourlyWeather({ weatherCode: 'rain' }) }),
      makeWeatherCheckpoint({ sequence: 4, weather: makeHourlyWeather({ weatherCode: 'rain' }) }),
    ];

    const transitions = detectWeatherTransitions(checkpoints);

    expect(transitions).toEqual([
      { fromSequence: 2, toSequence: 3, fromCondition: 'clear', toCondition: 'rain' },
    ]);
  });

  it('detects a RAIN -> CLEAR transition', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather({ weatherCode: 'rain' }) }),
      makeWeatherCheckpoint({ sequence: 2, weather: makeHourlyWeather({ weatherCode: 'rain' }) }),
      makeWeatherCheckpoint({ sequence: 3, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
    ];

    expect(detectWeatherTransitions(checkpoints)).toEqual([
      { fromSequence: 2, toSequence: 3, fromCondition: 'rain', toCondition: 'clear' },
    ]);
  });

  it('detects no transition when weather is constant', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
      makeWeatherCheckpoint({ sequence: 2, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
    ];

    expect(detectWeatherTransitions(checkpoints)).toEqual([]);
  });

  it('skips checkpoints with missing weather rather than crashing', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather({ weatherCode: 'clear' }) }),
      makeWeatherCheckpoint({ sequence: 2, weather: null }),
      makeWeatherCheckpoint({ sequence: 3, weather: makeHourlyWeather({ weatherCode: 'rain' }) }),
    ];

    expect(() => detectWeatherTransitions(checkpoints)).not.toThrow();
    expect(detectWeatherTransitions(checkpoints)).toEqual([
      { fromSequence: 1, toSequence: 3, fromCondition: 'clear', toCondition: 'rain' },
    ]);
  });
});

describe('summarizeJourneyWeather', () => {
  it('counts available/unavailable checkpoints', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather() }),
      makeWeatherCheckpoint({ sequence: 2, weather: null }),
      makeWeatherCheckpoint({ sequence: 3, weather: makeHourlyWeather() }),
    ];

    const summary = summarizeJourneyWeather(checkpoints);

    expect(summary.weatherAvailableCheckpoints).toBe(2);
    expect(summary.weatherUnavailableCheckpoints).toBe(1);
  });

  it('identifies rain-affected checkpoints and the first one', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather({ rainProbability: 10 }) }),
      makeWeatherCheckpoint({ sequence: 2, weather: makeHourlyWeather({ rainProbability: 80 }) }),
      makeWeatherCheckpoint({ sequence: 3, weather: makeHourlyWeather({ rainProbability: 90 }) }),
    ];

    const summary = summarizeJourneyWeather(checkpoints);

    expect(summary.rainAffectedCheckpointCount).toBe(2);
    expect(summary.firstRainCheckpointSequence).toBe(2);
  });

  it('treats a rain weatherCode as rain-affected even at low probability', () => {
    const checkpoints = [
      makeWeatherCheckpoint({
        sequence: 1,
        weather: makeHourlyWeather({ rainProbability: 5, weatherCode: 'thunderstorm' }),
      }),
    ];

    expect(summarizeJourneyWeather(checkpoints).rainAffectedCheckpointCount).toBe(1);
  });

  it('does not crash when no checkpoint has weather', () => {
    const checkpoints = [
      makeWeatherCheckpoint({ sequence: 1, weather: null }),
      makeWeatherCheckpoint({ sequence: 2, weather: null }),
    ];

    expect(() => summarizeJourneyWeather(checkpoints)).not.toThrow();
    const summary = summarizeJourneyWeather(checkpoints);
    expect(summary.weatherAvailableCheckpoints).toBe(0);
    expect(summary.firstRainCheckpointSequence).toBeNull();
    expect(summary.transitions).toEqual([]);
  });
});
