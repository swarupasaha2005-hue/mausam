/** Normalized routing error codes. */
export type RouteErrorCode =
  | 'ROUTE_INVALID_COORDINATES'
  | 'ROUTE_NOT_FOUND'
  | 'ROUTE_PROVIDER_ERROR'
  | 'ROUTE_REQUEST_FAILED'
  | 'ROUTE_TIMEOUT'
  | 'ROUTE_INVALID_RESPONSE';

export class RouteError extends Error {
  readonly code: RouteErrorCode;

  constructor(code: RouteErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'RouteError';
    this.code = code;
  }
}
