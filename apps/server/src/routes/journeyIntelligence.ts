import { Router } from 'express';
import { JourneyError } from '@cloud6/shared';
import { journeyAnalysisService } from '../modules/journey/journey.analysis.service';

export const journeyIntelligenceRouter = Router();

const ERROR_STATUS: Record<JourneyError['code'], number> = {
  JOURNEY_INVALID_ROUTE: 400,
  JOURNEY_INVALID_DEPARTURE_TIME: 400,
  JOURNEY_INVALID_OPTIONS: 400,
};

journeyIntelligenceRouter.post('/intelligence', (req, res) => {
  const body = req.body as { journeyWeatherPlan?: unknown; userContext?: unknown } | undefined;

  try {
    const intelligence = journeyAnalysisService.generateIntelligence({
      journeyWeatherPlan: body?.journeyWeatherPlan,
      userContext: body?.userContext,
    });
    res.json(intelligence);
  } catch (cause) {
    if (cause instanceof JourneyError) {
      return res
        .status(ERROR_STATUS[cause.code])
        .json({ error: { code: cause.code, message: cause.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
  }
});
