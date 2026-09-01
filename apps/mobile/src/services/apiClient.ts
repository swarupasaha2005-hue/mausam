const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 10000;

export class ApiRequestFailedError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestFailedError';
  }
}

export class ApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}

export class ApiInvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiInvalidResponseError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  return `${url}?${new URLSearchParams(query).toString()}`;
}

/**
 * Single shared HTTP client for every CLOUD6 backend call. Constructs the
 * URL from EXPO_PUBLIC_API_BASE_URL, parses JSON, applies a timeout, and
 * normalizes errors into one of three typed errors — callers (the
 * per-domain services) translate those into their own domain error types
 * (WeatherError, RouteError, etc.) so this file has no domain knowledge.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (cause) {
    const isAbort = cause instanceof Error && cause.name === 'AbortError';
    throw new ApiRequestFailedError(
      isAbort
        ? `CLOUD6 backend did not respond within ${timeoutMs}ms`
        : cause instanceof Error
          ? cause.message
          : 'Network request to CLOUD6 backend failed',
      cause,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let errorCode: string | undefined;
    try {
      const errorBody = (await response.json()) as { error?: { code?: string } };
      errorCode = errorBody?.error?.code;
    } catch {
      // response body wasn't JSON — errorCode stays undefined.
    }
    throw new ApiHttpError(
      response.status,
      errorCode,
      `CLOUD6 backend responded with HTTP ${response.status}`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiInvalidResponseError('CLOUD6 backend response was not valid JSON');
  }
}
