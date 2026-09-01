# CLOUD6 Architecture

Status: **Phase 4 — Personalization**. This document describes the architecture
established so far, and the intended shape of the system in later phases.
It does not describe implemented product functionality — see
`development-roadmap.md` for what is and isn't built yet.

## 1. Overview

CLOUD6 turns weather data into a personalized recommendation:

```
Weather Data → Personal Context → Analysis → Recommendation → Action
```

The system is a monorepo with three workspaces:

```
apps/mobile     React Native (Expo) client
apps/server     Node.js/Express backend
packages/shared TypeScript contracts shared by both
```

## 2. High-level data flow (target architecture)

```
┌─────────────────────┐
│    CLOUD6 MOBILE     │
│   React Native       │
└──────────┬───────────┘
           │  HTTPS (JSON)
           ▼
┌─────────────────────┐
│    CLOUD6 BACKEND    │
│       Express        │
└──────────┬───────────┘
           │
   ┌───────┼─────────────────┐
   ▼       ▼                 ▼
Weather  Journey        Personalization
   │        │                 │
   └───┬────┴─────────────────┘
       ▼
  Recommendations ──▶ AI (explanation)
       │
       ▼
  Integrations layer
       │
       ▼
  External APIs (weather / maps / AI providers)
```

Only the boxes "CLOUD6 MOBILE" and "CLOUD6 BACKEND" (with a `/health`
endpoint) exist today. Everything below the backend is directory
scaffolding with documented intent, not implementation.

## 3. Mobile application (`apps/mobile`)

- Expo + React Native + TypeScript, routed with **Expo Router** (file-based
  routing under `app/`).
- `app/_layout.tsx` and `app/index.tsx` currently render a boot/test screen
  only ("CLOUD6 — Phase 1 — Foundation").
- `src/` holds placeholder directories for future layers: `components/`,
  `services/`, `hooks/`, `store/`, `utils/`, `constants/`, `types/`.
- The mobile app **never calls external weather/maps/AI APIs directly**. It
  only ever talks to the CLOUD6 backend. This keeps provider credentials
  off the device and lets the backend normalize/cache responses.

## 4. Backend (`apps/server`)

- Node.js + Express + TypeScript, run as a single modular monolith (not
  microservices — unnecessary at this scale and complexity).
- `src/routes/` — HTTP routing. Currently only `GET /health`.
- `src/modules/` — one directory per future domain: `weather/`, `location/`,
  `journey/`, `personalization/`, `recommendations/`, `ai/`, `alerts/`,
  `users/`. Each contains only a README describing its future
  responsibility — no fake implementations.
- `src/integrations/` — the external-provider boundary (`weather/`,
  `maps/`, `ai/`). Modules will depend on integrations, never on a
  specific provider's SDK or response shape directly.
- `src/config/`, `src/middleware/`, `src/utils/`, `src/types/` — cross-cutting
  concerns, currently minimal (`config/env.ts` for reading environment
  variables).

### Why the integration layer exists

Business logic must not be coupled to any one external vendor. The
intended dependency direction is:

```
modules/weather  →  integrations/weather  →  external weather API
```

`modules/weather` will depend on a small interface that
`integrations/weather` implements. Swapping providers later means writing
a new integration, not rewriting the weather module or anything that
consumes it.

## 5. Shared package (`packages/shared`)

Holds TypeScript types shared between mobile and server, imported as
`@cloud6/shared`. Phase 1 defined `GeoPoint` (`latitude`, `longitude`).
Phase 2 added `Location` (a `GeoPoint` plus optional `name`/`address`/
`city`/`state`/`country` — deliberately no weather fields), coordinate
validation (`isValidGeoPoint`, `MIN_LATITUDE`/`MAX_LATITUDE`/
`MIN_LONGITUDE`/`MAX_LONGITUDE`), and `LocationError` with normalized
error codes (`LOCATION_PERMISSION_DENIED`, `LOCATION_UNAVAILABLE`,
`LOCATION_TIMEOUT`, `LOCATION_INVALID`, `GEOCODING_FAILED`). Phase 3
added the weather domain: `WeatherCode`, `CurrentWeather`,
`HourlyWeather`, `DailyWeather`, `WeatherSnapshot`, `WeatherForecast`,
`AirQuality`, and `WeatherError` with its own normalized codes (see §9).
Journey domain models remain deferred to the phase that defines them.

## 5a. Location Engine (`apps/mobile/src/services/location`)

Location acquisition happens entirely on the mobile device — the backend
does not access GPS. The flow:

```
LocationTestScreen / future UI
        │
        ▼
    useLocation()
        │
        ▼
   LocationService ──────────────► GeocodingService
        │                                │
        ▼                                ▼
DeviceLocationProvider          GeocodingProvider
  (expo | mock)                    (expo)
        │                                │
        ▼                                ▼
   device GPS                  reverse geocoding
```

- `LocationService` depends on a `DeviceLocationProvider` interface, not
  directly on `expo-location`. `expoDeviceLocationProvider` wraps the real
  Expo API; `mockDeviceLocationProvider` returns fixed coordinates for
  development environments without working GPS. The provider is selected
  via `EXPO_PUBLIC_LOCATION_PROVIDER=mock` (see `apps/mobile/.env.example`)
  — never implicit, never used in production builds.
- `GeocodingService` depends on a `GeocodingProvider` interface the same
  way, currently backed by Expo's reverse-geocoding API.
- Both services normalize provider-specific errors into `LocationError`
  with one of the shared error codes — nothing outside these services
  should see a raw Expo/provider error.
- `useLocation()` is the only interface the rest of the mobile app should
  use; it owns component state (`location`, `loading`, `error`,
  `permissionStatus`) and never imports `expo-location` itself.

## 6. Journey Weather Intelligence (future)

This is CLOUD6's key differentiator and is **not implemented in Phase 1**.
It will live primarily in `modules/journey`, coordinating with
`modules/weather` and `modules/location`, and will be built as its own
domain subsystem rather than a UI feature bolted onto a map screen:

```
location → route → route sampling → ETA per point
   → weather at (point, ETA) for each point
   → journey risk scoring
   → evaluate alternative departure times
   → recommendation
   → AI explanation
```

Each stage above corresponds to a future phase (see
`development-roadmap.md`, Phases 8–13). The module boundaries created in
Phase 1 (`journey`, `location`, `weather`, `recommendations`, `ai`, plus
the `maps` integration) exist specifically so this pipeline can be added
without restructuring the app.

## 7. Principles enforced by this structure

1. UI, API communication, business logic, external integrations, and
   shared contracts are kept in separate layers.
2. Mobile never talks to external providers directly — only to the CLOUD6
   backend.
3. Weather/maps/AI providers are replaceable behind `integrations/*`.
4. Business logic (normalization, personalization, risk, recommendations)
   belongs to the backend's `modules/*`, not to integrations or the client.
5. Cross-cutting types live in `packages/shared`.
6. No unnecessary abstraction: no DI framework, no microservices, no
   database, no speculative interfaces without a near-term consumer.

## 8. Location Engine Testing

Unit tests cover `packages/shared` (Jest + ts-jest) and
`apps/mobile/src` (Jest via the `jest-expo` preset). 36 tests, all
passing:

- `packages/shared/src/geo.test.ts` — `isValidGeoPoint` boundary and
  malformed-input cases (11 tests).
- `apps/mobile/src/services/location/locationService.test.ts` —
  permission states, successful retrieval, and every `LocationError` path
  (denied, unavailable, provider failure, invalid coordinates), against a
  fake `DeviceLocationProvider` (11 tests).
- `apps/mobile/src/services/location/geocodingService.test.ts` — success,
  provider failure → `GEOCODING_FAILED`, empty/partial results, against a
  fake `GeocodingProvider` (3 tests).
- `apps/mobile/src/hooks/useLocation.test.ts` — initial state, permission
  request outcomes, successful refresh, loading transitions, reverse-geocoding
  failure not invalidating coordinates, and error surfacing, with
  `locationService`/`geocodingService` mocked via `jest.mock` (10 tests).

**What's mocked:** all device GPS and geocoding calls — `expo-location`
is never invoked in unit tests. `LocationService`/`GeocodingService` take
their provider via constructor injection specifically so tests can supply
a fake `DeviceLocationProvider`/`GeocodingProvider` instead.

**What requires a real device:** `expoDeviceLocationProvider` and
`expoGeocodingProvider` themselves (untested by unit tests, since they're
thin wrappers with no branching logic) and the end-to-end flow — actual
permission prompts, actual GPS coordinates, actual reverse geocoding.
That must be exercised on a simulator/device via the `/dev/location`
developer screen; it has not been done as of this phase.

**Test harness note:** `useLocation.test.ts` uses a small custom
`renderHook`/`flush` helper (`apps/mobile/src/test-utils/renderHook.ts`)
built directly on `react-test-renderer` rather than
`@testing-library/react-native`'s `renderHook` — the latter ships its own
React 19 concurrent renderer that conflicted with `jest-expo`'s bundled
`react-test-renderer`, causing duplicate-renderer failures. The custom
helper avoids that by using only the renderer `jest-expo` already
provides.

**Mock location provider (development only):** setting
`EXPO_PUBLIC_LOCATION_PROVIDER=mock` (see `apps/mobile/.env.example`)
makes `LocationService` use `mockDeviceLocationProvider` (fixed
coordinates, always-granted permission) instead of real GPS — useful when
a simulator or CI environment can't provide location. It is never
selected implicitly and must not be set in production builds.

### `/dev/location` developer screen

`apps/mobile/app/dev/location.tsx` is a temporary, intentionally basic
screen that exercises the production `useLocation()` hook (no duplicate
location logic) to manually verify permission requests, current-location
retrieval, refresh, and error display. It is marked
"DEVELOPMENT / TESTING ONLY" in the UI and is not part of the final
CLOUD6 product UI — it will be removed once real screens consume
`useLocation()` directly.

## 9. Weather Engine Architecture

```
MOBILE (weatherService)
        │  HTTPS
        ▼
CLOUD6 BACKEND API (routes/weather.ts)
        │
        ▼
   WeatherService (modules/weather)
        │  depends on the WeatherProvider interface, not a provider
        ▼
   WeatherProvider (port, modules/weather/weather.types.ts)
        │  implemented by
        ▼
OpenMeteoWeatherProvider (integrations/weather/openmeteo)
        │
        ▼
    Open-Meteo (public API, no key)
```

**Why the provider is abstracted.** `WeatherService` depends on the
`WeatherProvider` interface (`getCurrentWeather`, `getHourlyForecast`,
`getDailyForecast`, `getAirQuality`), not on `OpenMeteoWeatherProvider`
directly — mirroring the `modules/weather → integrations/weather` split
already established in §4. `OpenMeteoWeatherProvider` is the only adapter
today, but a different provider could be swapped in by writing a new
adapter and changing one constructor argument, without touching
`WeatherService`, the API routes, or the mobile app.

**Why normalization matters.** Open-Meteo's raw response (WMO weather
codes, nested `current`/`hourly`/`daily` blocks, provider-specific field
names like `temperature_2m`) never leaves
`apps/server/src/integrations/weather/openmeteo/openMeteo.mapper.ts`. It
maps that response into CLOUD6's own models
(`packages/shared/src/weather.ts`: `CurrentWeather`, `HourlyWeather`,
`DailyWeather`, `WeatherSnapshot`, `WeatherForecast`, `AirQuality`), with
consistent internal units (°C, km/h, mm, %, km) and a normalized
`WeatherCode` (`clear` | `partly_cloudy` | `cloudy` | `fog` | `drizzle` |
`rain` | `snow` | `thunderstorm` | `unknown`) instead of Open-Meteo's WMO
codes. `modules/weather/weather-code.ts` provides `getWeatherLabel()` to
turn a normalized code into a human-readable string, kept separate from
any UI. The API responses (`GET /api/weather/*`, see
`api-contracts.md`) only ever contain these normalized shapes.

**Mobile never calls Open-Meteo.** `apps/mobile/src/services/weather/weatherService.ts`
only calls the CLOUD6 backend (`EXPO_PUBLIC_API_BASE_URL` +
`/api/weather/*`) and normalizes backend error responses into the same
shared `WeatherError` type the backend uses. It has no knowledge of
Open-Meteo's existence.

**Coordinate validation is not duplicated.** `WeatherService` reuses
`isValidGeoPoint`/`GeoPoint` from `@cloud6/shared` (the same validation
the Location Engine uses) rather than defining its own; the API route
layer also checks it up front so invalid input gets a 400 before any
provider call.

**Caching.** `WeatherService` holds a small in-memory `TTLCache` per data
type (current: 2 min, hourly: 10 min, daily: 30 min, air quality: 10 min),
keyed by coordinates + request options (`weather.cache.ts`). It sits
behind `WeatherService`, not inside the provider, so it can be replaced
with a real cache later without touching `OpenMeteoWeatherProvider` or
callers.

**Future Journey Weather Intelligence support.** The Journey Engine (not
built in this phase) will need weather for arbitrary route points at
arbitrary estimated-arrival times — not just "current user location."
Two things in this phase exist specifically to make that possible without
restructuring:

1. Every `WeatherProvider`/`WeatherService` method takes a `GeoPoint`
   parameter, never an implicit "current location." Any valid coordinate
   works today.
2. `WeatherService.getWeatherAt(point, timestamp)` already finds the
   hourly forecast entry closest to a given timestamp for a given point —
   exactly the composition a route-point lookup needs
   (`point → nearest-hour forecast`). It's implemented and unit-tested now
   (not exposed over HTTP yet, since nothing consumes it) so the Journey
   Engine phase can build route sampling and risk scoring on top of it
   directly instead of inventing this lookup from scratch.

## 10. Weather Engine Testing

Backend unit tests (Jest + ts-jest, `apps/server`) — 57 tests, mocked,
deterministic:

- `integrations/weather/openmeteo/openMeteo.client.test.ts` — HTTP
  success, HTTP error, rate limiting, network failure, timeout, malformed
  JSON, all against a mocked `global.fetch` (never a real network call).
- `integrations/weather/openmeteo/openMeteo.mapper.test.ts` — WMO
  weather-code normalization, `CurrentWeather`/`HourlyWeather`/
  `DailyWeather`/`AirQuality` mapping against fixtures, missing-block
  errors, missing-hourly-data defaults.
- `modules/weather/weather.cache.test.ts` — `TTLCache` get/set/expiry,
  `buildCacheKey` collision behavior.
- `modules/weather/weather.service.test.ts` — coordinate validation
  (rejects without calling the provider), provider delegation (proves
  `WeatherService` calls `WeatherProvider`, not Open-Meteo directly),
  error normalization, caching (first request hits provider, repeat
  within TTL doesn't, expiry re-fetches, different coordinates don't
  collide), and `getWeatherAt`.
- `routes/weather.test.ts` — supertest against the real Express `app`
  (`weatherService` mocked) covering valid requests, invalid/missing
  coordinates, provider failures, and asserting the response never
  contains raw Open-Meteo field names (e.g. `temperature_2m`).

Mobile unit tests (`apps/mobile`, jest-expo) —
`src/services/weather/weatherService.test.ts` (4 tests): calls the CLOUD6
backend URL (not `open-meteo.com`), normalizes backend error responses,
network failures, and malformed JSON into `WeatherError`.

Fixtures live in `apps/server/test/fixtures/openmeteo/` (raw Open-Meteo
shapes) and `apps/server/test/fixtures/cloud6/` (expected normalized
output) — kept separate so it's obvious where provider-specific data ends
and CLOUD6's own data begins.

**Real Open-Meteo verification:** the running dev server was hit directly
against the live Open-Meteo API for `/api/weather/current`,
`/api/weather/hourly`, `/api/weather/daily`, and (service-level, no route
yet) `getAirQuality()` — all returned valid normalized data. Unit tests
themselves remain fully mocked/deterministic; that live check was a
manual one-off verification, not part of the automated test suite.

### `/dev/weather` developer screen

`apps/mobile/app/dev/weather.tsx` is a temporary, intentionally basic
screen (marked "DEVELOPMENT / TESTING ONLY") that exercises the
production `weatherService` directly — latitude/longitude inputs and
buttons to fetch current/hourly/daily data, showing loading and error
state. It has been verified to bundle successfully (`npx expo export
--platform web`); it has not been click-tested in a running
simulator/browser session in this environment. Not part of the final
CLOUD6 UI.

## 11. Personalization Engine

```
User Context (persona + preferred time + activities)
        │
        ▼
   PersonalizationService (modules/personalization)
        │  reads from
        ▼
   PERSONA_CONFIG (persona.config.ts)
        │
        ▼
   UserContext { persona, activities, preferredTimeOfDay, weatherPriorities }
        │
        ▼
   (future) RecommendationEngine — combines this with WeatherService's
   WeatherSnapshot/WeatherForecast to produce actual recommendations
```

This phase answers "who is this user and what weather info matters to
them" — it does **not** generate recommendations. `PersonalizationService`
never imports anything from `modules/weather` or the Open-Meteo
integration; it only knows the _names_ of weather factors (e.g.
`'uv'`, `'rain_probability'`) that a persona cares about, as a
`WeatherPriority[]`. A future `RecommendationService` is the only place
that will combine `UserContext` with a `WeatherSnapshot`.

**Personas** (`packages/shared/src/personalization.ts`): `runner`,
`commuter`, `parent`, `agriculture`, `traveler`, `health`, `outdoor`,
`event_planner`. Each has a `PersonaConfig` (display name, description,
`weatherPriorities`, default `activities`, `concerns`) defined in
`apps/server/src/modules/personalization/persona.config.ts` as a plain
map (`PERSONA_CONFIG: Record<Persona, PersonaConfig>`) — adding or
changing a persona means editing one object, not branching logic.

**Why persona → activity is a config, not a branch.** `PersonalizationService.createUserContext`
looks up `PERSONA_CONFIG[persona]` rather than an `if/else` chain, so the
persona → weather-priorities → default-activity mapping lives in exactly
one place.

**Shared enumerations.** `PERSONAS`, `TIME_OF_DAY_OPTIONS`, and
`ACTIVITIES` live in `@cloud6/shared` and are used by both backend
validation (`personalization.validation.ts`) and the mobile `/dev/persona`
picker UI — the list of valid personas is defined once, not duplicated
between backend and mobile.

**Mobile side.** `apps/mobile/src/services/personalization/personalizationService.ts`
calls the CLOUD6 backend (`POST /api/personalization/context`) — it does
not duplicate persona configuration. `usePersonalization()`
(`apps/mobile/src/hooks/usePersonalization.ts`) holds local selection
state (persona, preferred time) and re-fetches the resulting `UserContext`
whenever the selection changes. This state is intentionally
non-persistent for the prototype — no AsyncStorage, no backend user
storage, no auth.

## 12. Personalization Testing

Backend unit tests — 67 tests, deterministic, no network:

- `modules/personalization/persona.config.test.ts` — every persona has a
  display name, description, non-empty weather priorities, and defined
  activities; persona-specific priority assertions (e.g. runner includes
  `temperature`/`humidity`/`precipitation`/`uv`).
- `modules/personalization/personalization.service.test.ts` —
  `getPersonaConfig`/`getWeatherPriorities`/`createUserContext`: valid
  input, default `preferredTimeOfDay`/`activities`, invalid persona, invalid
  time, invalid activity.
- `routes/personalization.test.ts` — supertest against the real Express
  `app` for `POST /api/personalization/context`: valid request, default
  time, invalid persona/time/activity, malformed (missing persona) body.

Mobile unit tests — 9 tests:

- `services/personalization/personalizationService.test.ts` (4) — calls
  the CLOUD6 backend, normalizes backend error responses, network
  failures, and malformed JSON into `PersonalizationError`, against a
  mocked `fetch` (never the live backend).
- `hooks/usePersonalization.test.ts` (5) — initial fetch, refetch on
  persona change, refetch on time change, error surfacing without a
  crash — using the same `renderHook`/`flush` harness from §8, with
  `personalizationService` mocked.

**Live verification:** the running dev server's
`POST /api/personalization/context` was hit directly for a valid
runner/morning request, a request with an omitted (defaulted) time, an
invalid persona, an invalid time, and a missing body — all returned the
expected normalized response or 400 error.

### `/dev/persona` developer screen

`apps/mobile/app/dev/persona.tsx` is a temporary, intentionally basic
screen (marked "DEVELOPMENT / TESTING ONLY") that exercises
`usePersonalization()` directly — buttons for each persona and each
preferred time (from the shared `PERSONAS`/`TIME_OF_DAY_OPTIONS`
enumerations, not hardcoded in the component), showing the resulting
`UserContext` and weather priorities. Verified to bundle successfully
(`npx expo export --platform web`); not click-tested in a running
simulator/browser in this environment. Not part of the final CLOUD6 UI.
