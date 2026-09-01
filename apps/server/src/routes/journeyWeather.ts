import { Router } from 'express';
import { JourneyError } from '@cloud6/shared';
import { journeyWeatherService } from '../modules/journey/journey.weather.service';

export const journeyWeatherRouter = Router();

const ERROR_STATUS: Record<JourneyError['code'], number> = {
  JOURNEY_INVALID_ROUTE: 400,
  JOURNEY_INVALID_DEPARTURE_TIME: 400,
  JOURNEY_INVALID_OPTIONS: 400,
};

journeyWeatherRouter.post('/weather', async (req, res) => {
  const body = req.body as { journeyPlan?: unknown } | undefined;

  try {
    const plan = await journeyWeatherService.enrichJourneyWeather(body?.journeyPlan);
    res.json(plan);
  } catch (cause) {
    if (cause instanceof JourneyError) {
      return res
        .status(ERROR_STATUS[cause.code])
        .json({ error: { code: cause.code, message: cause.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
  }
});
