import type { JourneyIntelligence, JourneyWeatherPlan, UserContext } from '@cloud6/shared';
import { analyzeJourney } from './journey.analysis';
import { buildJourneyRecommendation } from './journey.analysis.recommendation';
import {
  assertValidJourneyWeatherPlan,
  assertValidUserContext,
} from './journey.analysis.validation';

/**
 * Application-facing entry point. Validates input and composes the pure
 * analysis + recommendation functions — never fetches weather, never
 * resamples a route, never recalculates a timeline (all previous
 * phases' jobs), and never calls an LLM.
 */
export class JourneyAnalysisService {
  generateIntelligence(input: {
    journeyWeatherPlan: unknown;
    userContext: unknown;
  }): JourneyIntelligence {
    assertValidJourneyWeatherPlan(input.journeyWeatherPlan);
    assertValidUserContext(input.userContext);

    const journeyWeatherPlan = input.journeyWeatherPlan as JourneyWeatherPlan;
    const userContext = input.userContext as UserContext;

    const analysis = analyzeJourney(journeyWeatherPlan, userContext);
    const recommendation = buildJourneyRecommendation(userContext.persona, analysis);

    return { journeyWeatherPlan, analysis, recommendation };
  }
}

export const journeyAnalysisService = new JourneyAnalysisService();
