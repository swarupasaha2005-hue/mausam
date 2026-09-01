import { buildJourneyRecommendation } from './journey.analysis.recommendation';
import { analyzeJourney } from './journey.analysis';
import {
  commuterContextFixture,
  runnerContextFixture,
} from '../../../test/fixtures/cloud6/recommendation';
import {
  deterioratingJourneyWeatherPlanFixture,
  favorableJourneyWeatherPlanFixture,
} from '../../../test/fixtures/cloud6/journey';

describe('buildJourneyRecommendation', () => {
  it('includes type, priority, title, message, action, and reasons', () => {
    const analysis = analyzeJourney(deterioratingJourneyWeatherPlanFixture, runnerContextFixture);
    const recommendation = buildJourneyRecommendation('runner', analysis);

    expect(recommendation.type).toBeTruthy();
    expect(recommendation.priority).toBeTruthy();
    expect(recommendation.title.length).toBeGreaterThan(0);
    expect(recommendation.message.length).toBeGreaterThan(0);
    expect(recommendation.action.length).toBeGreaterThan(0);
    expect(recommendation.reasons.length).toBeGreaterThan(0);
  });

  it('reasons correspond to the actual analysis factors — never invented', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    const recommendation = buildJourneyRecommendation('runner', analysis);

    expect(recommendation.reasons).toEqual(analysis.factors);
    expect(recommendation.reasons).not.toContain('RAIN_DURING_JOURNEY');
  });

  it('produces a FAVORABLE recommendation for a favorable journey', () => {
    const analysis = analyzeJourney(favorableJourneyWeatherPlanFixture, runnerContextFixture);
    expect(buildJourneyRecommendation('runner', analysis).type).toBe('FAVORABLE');
  });

  it('produces different recommendations for runner vs commuter given the same journey weather', () => {
    const runnerAnalysis = analyzeJourney(
      deterioratingJourneyWeatherPlanFixture,
      runnerContextFixture,
    );
    const commuterAnalysis = analyzeJourney(
      deterioratingJourneyWeatherPlanFixture,
      commuterContextFixture,
    );

    const runnerRec = buildJourneyRecommendation('runner', runnerAnalysis);
    const commuterRec = buildJourneyRecommendation('commuter', commuterAnalysis);

    expect(runnerRec.title).not.toBe(commuterRec.title);
  });
});
