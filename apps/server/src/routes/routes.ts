import { Router, type Request } from 'express';
import { RouteError, isValidGeoPoint, type GeoPoint } from '@cloud6/shared';
import { routingService } from '../modules/routing/routing.service';

export const routesRouter = Router();

const ERROR_STATUS: Record<RouteError['code'], number> = {
  ROUTE_INVALID_COORDINATES: 400,
  ROUTE_NOT_FOUND: 404,
  ROUTE_TIMEOUT: 504,
  ROUTE_PROVIDER_ERROR: 502,
  ROUTE_REQUEST_FAILED: 502,
  ROUTE_INVALID_RESPONSE: 502,
};

function parsePoint(req: Request, latKey: string, lonKey: string): GeoPoint | undefined {
  const latitude = Number(req.query[latKey]);
  const longitude = Number(req.query[lonKey]);
  if (
    req.query[latKey] === undefined ||
    req.query[lonKey] === undefined ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return undefined;
  }
  const point = { latitude, longitude };
  return isValidGeoPoint(point) ? point : undefined;
}

routesRouter.get('/', async (req, res) => {
  const start = parsePoint(req, 'startLatitude', 'startLongitude');
  const destination = parsePoint(req, 'destinationLatitude', 'destinationLongitude');

  if (!start || !destination) {
    const error = new RouteError(
      'ROUTE_INVALID_COORDINATES',
      'startLatitude, startLongitude, destinationLatitude, and destinationLongitude are required',
    );
    return res
      .status(ERROR_STATUS[error.code])
      .json({ error: { code: error.code, message: error.message } });
  }

  try {
    const route = await routingService.getRoute(start, destination);
    res.json(route);
  } catch (cause) {
    const error = cause instanceof RouteError ? cause : new RouteError('ROUTE_PROVIDER_ERROR');
    res
      .status(ERROR_STATUS[error.code] ?? 500)
      .json({ error: { code: error.code, message: error.message } });
  }
});
