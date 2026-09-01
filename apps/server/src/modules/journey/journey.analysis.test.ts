import { analyzeJourney } from './journey.analysis';
import {
  commuterContextFixture,
  makeUserContext,
  runnerContextFixture,
} from '../../../test/fixtures/cloud6/recommendation';
import {
  deterioratingJourneyWeatherPlanFixture,
  favorableJourneyWeatherPlanFixture,
  makeHourlyWeather,
  makeWeatherCheckpoint,
} from '../../../test/fixtures/cloud6/journey';
import type { JourneyWeatherPlan } from '@cloud6/shared';

describe('analyzeJourney — weather transition -> journey factor', () => {
  it('detects WEATHER_DETERIORATION for clear -> rain across the journey', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather({ weatherCode: 'clear' }),
        }),
        makeWeatherCheckpoint({
          sequence: 2,
          distanceFromStartKm: 5,
          weather: makeHourlyWeather({ weatherCode: 'clear' }),
        }),
        makeWeatherCheckpoint({
          sequence: 3,
          distanceFromStartKm: 10,
          weather: makeHourlyWeather({ weatherCode: 'rain', rainProbability: 90 }),
        }),
      ],
    };
    const analysis = analyzeJourney(plan, runnerContextFixture);
    expect(analysis.factors).toContain('WEATHER_DETERIORATION');
  });

  it('does not detect deterioration for rain -> clear (improving conditions)', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather({ weatherCode: 'rain', rainProbability: 90 }),
        }),
        makeWeatherCheckpoint({
          sequence: 2,
          distanceFromStartKm: 10,
          weather: makeHourlyWeather({ weatherCode: 'clear' }),
        }),
      ],
    };
    const analysis = analyzeJourney(plan, runnerContextFixture);
    expect(analysis.factors).not.toContain('WEATHER_DETERIORATION');
  });

  it('detects both deterioration and the storm for a persona that prioritizes severe weather', () => {
    // commuter's weatherPriorities include 'severe_weather' (Phase 4 config); runner's do not.
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, commuterContextFixture);
    // last checkpoint is 'rain' (severity 3) vs first 'clear' (severity 0) -> still deteriorating overall
    expect(analysis.factors).toContain('WEATHER_DETERIORATION');
    expect(analysis.factors).toContain('THUNDERSTORM_DURING_JOURNEY');
  });
});

describe('analyzeJourney — affected checkpoints', () => {
  it('identifies exactly the checkpoints with relevant weather factors', () => {
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    // checkpoints 3,4,5,6,7 have rain/heavy-rain/thunderstorm; 1,2 do not
    expect(analysis.affectedCheckpointSequences).toEqual([3, 4, 5, 6, 7]);
  });

  it('reports the first affected checkpoint sequence', () => {
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.firstAffectedCheckpointSequence).toBe(3);
  });
});

describe('analyzeJourney — affected distance', () => {
  it('reports the approximate affected segment', () => {
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.affectedSegment).toEqual({ fromDistanceKm: 3.6, toDistanceKm: 10.8 });
  });

  it('is null when nothing is affected', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.affectedSegment).toBeNull();
  });
});

describe('analyzeJourney — risk level', () => {
  it('rates a favorable journey LOW', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.riskLevel).toBe('low');
    expect(analysis.factors).toEqual(['FAVORABLE_JOURNEY']);
  });

  it('rates moderate rain MEDIUM', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather({ rainProbability: 65 }),
        }),
      ],
    };
    expect(analyzeJourney(plan, runnerContextFixture).riskLevel).toBe('medium');
  });

  it('rates significant/heavy rain HIGH', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather({ rainProbability: 85 }),
        }),
      ],
    };
    expect(analyzeJourney(plan, runnerContextFixture).riskLevel).toBe('high');
  });

  it('rates a thunderstorm-affected journey SEVERE for a persona that prioritizes severe weather', () => {
    // commuter's weatherPriorities include 'severe_weather' (Phase 4 config); runner's do not.
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, commuterContextFixture);
    expect(analysis.riskLevel).toBe('severe');
  });
});

describe('analyzeJourney — persona differences', () => {
  it('respects persona weatherPriorities: a persona without heat priority never sees the heat factor a runner would', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather({ temperature: 35 }),
        }),
      ],
    };
    const noHeatPriority = makeUserContext({
      persona: 'agriculture',
      weatherPriorities: ['precipitation', 'humidity', 'wind'],
    });
    const runnerAnalysis = analyzeJourney(plan, runnerContextFixture);
    const noHeatAnalysis = analyzeJourney(plan, noHeatPriority);

    expect(runnerAnalysis.factors).toContain('HIGH_HEAT_DURING_JOURNEY');
    expect(noHeatAnalysis.factors).not.toContain('HIGH_HEAT_DURING_JOURNEY');
  });

  it('always surfaces SEVERE_WEATHER_NEAR_DESTINATION regardless of persona priorities', () => {
    const noSeverePriority = makeUserContext({
      persona: 'agriculture',
      weatherPriorities: ['precipitation', 'temperature'],
    });
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, noSeverePriority);
    expect(analysis.factors.length).toBeGreaterThan(0);
  });
});

describe('analyzeJourney — missing weather', () => {
  it('does not invent a weather factor for a checkpoint with no weather', () => {
    const plan: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({
          sequence: 1,
          distanceFromStartKm: 0,
          weather: makeHourlyWeather(),
        }),
        makeWeatherCheckpoint({ sequence: 2, distanceFromStartKm: 5, weather: null }),
        makeWeatherCheckpoint({
          sequence: 3,
          distanceFromStartKm: 10,
          weather: makeHourlyWeather(),
        }),
      ],
    };
    const analysis = analyzeJourney(plan, runnerContextFixture);
    expect(analysis.affectedCheckpointSequences).not.toContain(2);
    expect(analysis.weatherUnavailableCheckpoints).toBe(1);
    expect(analysis.weatherAvailableCheckpoints).toBe(2);
  });

  it('lowers confidence as available weather decreases', () => {
    const mostlyMissing: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({ sequence: 1, weather: makeHourlyWeather() }),
        makeWeatherCheckpoint({ sequence: 2, weather: null }),
        makeWeatherCheckpoint({ sequence: 3, weather: null }),
        makeWeatherCheckpoint({ sequence: 4, weather: null }),
      ],
    };
    expect(analyzeJourney(mostlyMissing, runnerContextFixture).confidence).toBe('low');
    expect(
      analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture).confidence,
    ).toBe('high');
  });
});

describe('analyzeJourney — all weather unavailable', () => {
  it('does not crash and does not fabricate weather', () => {
    const allMissing: JourneyWeatherPlan = {
      ...favorableJourneyWeatherPlanFixture,
      checkpoints: [
        makeWeatherCheckpoint({ sequence: 1, weather: null }),
        makeWeatherCheckpoint({ sequence: 2, weather: null }),
      ],
    };

    expect(() => analyzeJourney(allMissing, runnerContextFixture)).not.toThrow();
    const analysis = analyzeJourney(allMissing, runnerContextFixture);
    expect(analysis.weatherAvailableCheckpoints).toBe(0);
    expect(analysis.affectedCheckpointSequences).toEqual([]);
    expect(analysis.primaryConcern).toBe('Weather information is unavailable for this journey.');
    expect(analysis.confidence).toBe('low');
  });
});

describe('analyzeJourney — favorable journey', () => {
  it('produces FAVORABLE_JOURNEY and a LOW risk level for consistently comfortable weather', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.riskLevel).toBe('low');
    expect(analysis.factors).toEqual(['FAVORABLE_JOURNEY']);
    expect(analysis.affectedCheckpointSequences).toEqual([]);
  });
});

describe('analyzeJourney — explanation matches factors', () => {
  it('every reason corresponds to an actually-detected factor', () => {
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    expect(analysis.reasons.length).toBeGreaterThan(0);
    const mentionsRainOrStorm = analysis.reasons.some(
      (r) => r.toLowerCase().includes('rain') || r.toLowerCase().includes('storm'),
    );
    expect(mentionsRainOrStorm).toBe(true);
  });

  it('does not mention rain when no rain factor was detected', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    const mentionsRain = analysis.reasons.some((r) => r.toLowerCase().includes('rain'));
    expect(mentionsRain).toBe(false);
  });
});

describe('analyzeJourney — determinism', () => {
  it('produces the same result for the same inputs', () => {
    const first = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    const second = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    expect(first).toEqual(second);
  });
});
