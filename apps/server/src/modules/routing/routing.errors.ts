import { RouteError } from '@cloud6/shared';

/** Ensures any thrown value reaching RoutingService callers is a RouteError. */
export function toRouteError(cause: unknown): RouteError {
  if (cause instanceof RouteError) {
    return cause;
  }
  return new RouteError(
    'ROUTE_PROVIDER_ERROR',
    cause instanceof Error ? cause.message : 'Unexpected routing provider failure',
  );
}
