import { JourneyError } from '@cloud6/shared';
import { JourneyAnalysisService } from './journey.analysis.service';
import {
  commuterContextFixture,
  runnerContextFixture,
} from '../../../test/fixtures/cloud6/recommendation';
import { deterioratingJourneyWeatherPlanFixture } from '../../../test/fixtures/cloud6/journey';

describe('JourneyAnalysisService.generateIntelligence', () => {
  const service = new JourneyAnalysisService();

  it('returns a JourneyIntelligence for valid input', () => {
    const result = service.generateIntelligence({
      journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
      userContext: commuterContextFixture,
    });

    expect(result.journeyWeatherPlan).toEqual(deterioratingJourneyWeatherPlanFixture);
    expect(result.analysis.riskLevel).toBe('severe');
    expect(result.recommendation.type).toBeTruthy();
  });

  it('throws JourneyError for an invalid journey weather plan', () => {
    expect(() =>
      service.generateIntelligence({
        journeyWeatherPlan: { ...deterioratingJourneyWeatherPlanFixture, checkpoints: [] },
        userContext: runnerContextFixture,
      }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }));
  });

  it('throws JourneyError for an invalid persona', () => {
    expect(() =>
      service.generateIntelligence({
        journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
        userContext: { ...runnerContextFixture, persona: 'astronaut' },
      }),
    ).toThrow(JourneyError);
  });

  it('throws JourneyError for a missing body', () => {
    expect(() =>
      service.generateIntelligence({ journeyWeatherPlan: undefined, userContext: undefined }),
    ).toThrow(JourneyError);
  });

  it('throws JourneyError for a malformed checkpoint', () => {
    expect(() =>
      service.generateIntelligence({
        journeyWeatherPlan: {
          ...deterioratingJourneyWeatherPlanFixture,
          checkpoints: [{ sequence: 1 }],
        },
        userContext: runnerContextFixture,
      }),
    ).toThrow(expect.objectContaining({ code: 'JOURNEY_INVALID_ROUTE' }));
  });
});

describe('JourneyAnalysisService — persona change without weather refetch', () => {
  it('produces a different recommendation from the same JourneyWeatherPlan when only the persona changes', () => {
    const service = new JourneyAnalysisService();
    const runnerResult = service.generateIntelligence({
      journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
      userContext: runnerContextFixture,
    });
    const commuterResult = service.generateIntelligence({
      journeyWeatherPlan: deterioratingJourneyWeatherPlanFixture,
      userContext: { ...runnerContextFixture, persona: 'commuter' },
    });

    // Same underlying weather plan both times — only interpretation changes.
    expect(runnerResult.journeyWeatherPlan).toEqual(commuterResult.journeyWeatherPlan);
    expect(runnerResult.recommendation.title).not.toBe(commuterResult.recommendation.title);
  });
});
