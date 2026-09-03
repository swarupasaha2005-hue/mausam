import { Router } from 'express';
import { LocationError } from '@cloud6/shared';
import { geocodingService } from '../modules/geocoding/geocoding.service';

export const geocodingRouter = Router();

const ERROR_STATUS: Record<LocationError['code'], number> = {
  LOCATION_PERMISSION_DENIED: 400,
  LOCATION_UNAVAILABLE: 400,
  LOCATION_TIMEOUT: 504,
  LOCATION_INVALID: 400,
  GEOCODING_FAILED: 502,
};

geocodingRouter.get('/', async (req, res) => {
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

  if (!query) {
    const error = new LocationError('GEOCODING_FAILED', 'query is required');
    return res.status(400).json({ error: { code: error.code, message: error.message } });
  }

  try {
    const results = await geocodingService.geocode(query);
    res.json({ results });
  } catch (cause) {
    const error = cause instanceof LocationError ? cause : new LocationError('GEOCODING_FAILED');
    res
      .status(ERROR_STATUS[error.code] ?? 500)
      .json({ error: { code: error.code, message: error.message } });
  }
});
