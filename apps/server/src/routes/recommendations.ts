import { Router } from 'express';
import { RecommendationError } from '@cloud6/shared';
import { recommendationService } from '../modules/recommendations/recommendation.service';

export const recommendationsRouter = Router();

recommendationsRouter.post('/', (req, res) => {
  const body = req.body as { context?: unknown; weather?: unknown } | undefined;

  try {
    const result = recommendationService.generate({
      context: body?.context,
      weather: body?.weather,
    });
    res.json(result);
  } catch (cause) {
    if (cause instanceof RecommendationError) {
      return res.status(400).json({ error: { code: cause.code, message: cause.message } });
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } });
  }
});
