# CLOUD6 Architecture

Status: **Phase 10 — Journey Risk + Actionable Intelligence**. This document describes the architecture
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

## 13. Recommendation Engine

```
CurrentWeather  +  UserContext
        │
        ▼
   RecommendationService (modules/recommendations)
        │  validates input, then calls
        ▼
   generateRecommendations() (recommendation.engine.ts — pure function)
        │
        ├─ evaluateFactors(weather) → RecommendationFactor[]     (recommendation.rules.ts)
        ├─ filter by persona relevance (context.weatherPriorities)
        └─ buildRecommendation(persona, factor) → Recommendation  (persona-flavored templates)
        │
        ▼
   RecommendationResult { primaryRecommendation, recommendations, evaluatedFactors }
        │
        ▼
   (future) AI Explanation Layer — turns this structured result into
   natural-language explanation. Does not replace this decision logic.
```

**This layer is deterministic, not AI.** `generateRecommendations` is a
pure function: given the same weather and context it always returns the
same result, and every recommendation carries `reasons: RecommendationFactor[]`
naming exactly which threshold(s) triggered it — that's the
"explainable" property an LLM call couldn't give for free. **Recommendation
Engine = deterministic decision logic. AI Explanation Layer (future,
separate phase) = natural-language explanation of this same output** —
the two are not the same thing and the engine does not call any LLM.

**Why persona-aware without persona branching.** `RecommendationFactor`
(e.g. `HIGH_TEMPERATURE`, `HIGH_UV`) maps to a `WeatherPriority` via
`FACTOR_PRIORITY` (`packages/shared/src/recommendation.ts`). The engine
checks `context.weatherPriorities.includes(FACTOR_PRIORITY[factor])` — a
factor only produces a recommendation for personas whose
`PersonaConfig.weatherPriorities` (§11) includes that factor's priority.
This is why the same weather input yields different recommendations for
different personas without an `if (persona === 'runner')` branch: the
persona/priority linkage that already existed from Phase 4 does the
filtering.

**Thresholds are centralized and easy to tune**
(`recommendation.thresholds.ts`) — e.g. `HIGH_TEMPERATURE_C: 32`,
`HIGH_RAIN_PROBABILITY_PERCENT: 60`. These are prototype values, not
scientifically validated; change them directly rather than adding
scattered magic numbers elsewhere.

**Persona-flavored copy is data, not branching logic**
(`PERSONA_FACTOR_TEMPLATES` in `recommendation.rules.ts`) — a
`Partial<Record<Persona, Partial<Record<RecommendationFactor, ...>>>>`
map. A missing `(persona, factor)` entry falls back to
`GENERIC_FACTOR_TEMPLATES`, so every persona × factor combination
produces a reasonable result even before bespoke wording is added for
it.

**No false precision.** Wording throughout uses "high rain probability" /
"consider leaving earlier" rather than claiming certainty ("it will
rain") or fabricated specificity ("leave in 20 minutes") — the engine has
no route/journey data, so it deliberately doesn't pretend to.

**Ranking.** When multiple factors are relevant, recommendations are
sorted by `priority` (`severe` > `high` > `medium` > `low`); the first
becomes `primaryRecommendation`, the rest are `recommendations[1:]`. No
numeric risk score is used — the spec explicitly allows skipping one when
it would add complexity without benefit for a prototype, and priority
ordering alone was sufficient here.

**Boundaries respected.** `RecommendationService`/`generateRecommendations`
never import from `modules/weather`, `integrations/weather`, or
`modules/personalization`'s service (only a persona-existence check via
`isValidPersona`, for input validation — not weather/context creation).
Weather fetching and `UserContext` creation are the caller's
responsibility (mobile currently does this by calling
`personalizationService` and passing manually-entered weather values on
the `/dev/recommendations` screen — a real screen would call
`weatherService` too).

**Future Journey support.** The spec calls for a `RecommendationFactor`/
`Recommendation` design that a future Journey Weather Engine could extend
with fields like `routeRainRisk` or `recommendedDepartureTime` — those
fields are **not implemented now** (no journey data exists yet to
populate them honestly). Nothing here would need restructuring to add
them: `RecommendationInput`/`RecommendationResult` are plain shared
interfaces that can gain optional fields later without breaking existing
callers.

## 14. Recommendation Engine Testing

Backend unit tests — 41 new tests, deterministic, no network:

- `modules/recommendations/recommendation.rules.test.ts` (10) —
  `evaluateFactors` for favorable/hot/rainy/high-UV/windy/severe/poor-air-quality
  weather; `buildRecommendation` persona-specific vs. generic fallback
  wording.
- `modules/recommendations/recommendation.engine.test.ts` (10) —
  favorable conditions, high temperature, high humidity (present for
  runner, absent for commuter), high UV, high rain probability (RESCHEDULE
  for runner, CAUTION for commuter), high wind, combined-risk weather
  (multiple factors, correctly priority-sorted), and persona differences
  (same weather → different primary recommendation/title; a factor
  outside a persona's `weatherPriorities` never appears).
- `modules/recommendations/recommendation.service.test.ts` (8) — valid
  input, missing/invalid context, missing weather, invalid
  temperature/humidity/UV/precipitation/rainProbability (out-of-range or
  wrong type) all rejected with a normalized `RecommendationError`.
- `routes/recommendations.test.ts` (4) — supertest against the real
  Express `app` for `POST /api/recommendations`: valid request, invalid
  context, invalid weather, missing fields.

Mobile unit tests — 3 tests
(`services/recommendations/recommendationsService.test.ts`): calls the
CLOUD6 backend, normalizes backend error responses and network failures
into `RecommendationError`, against a mocked `fetch` — confirms the
mobile service contains no recommendation rules of its own.

Fixtures: `apps/server/test/fixtures/cloud6/recommendation.ts` — small,
named weather fixtures (favorable/hot/rainy/high-UV/windy/severe/combined-risk)
and a `makeUserContext()` builder, reused across all three backend test
files rather than duplicating literals.

**Live verification:** the running dev server's `POST /api/recommendations`
was hit directly with the same hot+rainy weather for both a runner
context and a commuter context — the runner got `RESCHEDULE`/"Rain likely
during your run" as primary, the commuter got `CAUTION`/"Rain likely
during your commute" as primary, confirming persona-aware behavior end to
end (not just in mocked tests). Favorable weather and invalid-input
(bad persona, missing body) cases were also verified live.

### `/dev/recommendations` developer screen

`apps/mobile/app/dev/recommendations.tsx` is a temporary, intentionally
basic screen (marked "DEVELOPMENT / TESTING ONLY") with a persona picker
(from the shared `PERSONAS` enumeration), manual weather-value inputs,
and a "Generate Recommendation" button that calls
`personalizationService.createUserContext()` then
`recommendationsService.generate()` — no recommendation logic lives in
the component. Displays the primary recommendation (title, message,
action, priority, reasons) and any additional recommendations. Verified
to bundle successfully (`npx expo export --platform web`); not
click-tested in a running simulator/browser in this environment.

## 15. CLOUD6 End-to-End Mobile Flow

```
📍 Location          🌦️ Weather           👤 User Context      🎯 Recommendation
LocationService  →  weatherService   →  PersonalizationService  →  RecommendationService
(+ Geocoding)        (→ CLOUD6 API        (→ CLOUD6 API             (→ CLOUD6 API
                      → Open-Meteo)         → PERSONA_CONFIG)         → rule engine)
        │                   │                     │                       │
        └───────────────────┴──────── dashboardService ────────────────────┘
                                            │
                                   usePersonalizedWeather()
                                            │
                                    /dev/dashboard screen
```

Phase 6 does not add any new domain logic — it wires the four existing
engines (Phases 2–5) into one mobile flow. Every step is an existing
service call:

1. **Location** — `locationService.getCurrentLocation()` +
   `geocodingService.reverseGeocode()` (same two services `useLocation()`
   already composes — see §5a).
2. **Weather** — `weatherService.getCurrentWeather(location)`, which
   calls the CLOUD6 backend's `GET /api/weather/current` (§9). The mobile
   app never calls Open-Meteo.
3. **User Context** — `personalizationService.createUserContext({ persona, preferredTimeOfDay })`,
   which calls `POST /api/personalization/context` (§11).
4. **Recommendation** — `recommendationsService.generate(context, weather)`,
   which calls `POST /api/recommendations` (§13).

**No new backend endpoint was added.** The existing three endpoints
(`/api/weather/current`, `/api/personalization/context`,
`/api/recommendations`) are sufficient; the mobile app is the
orchestrator. A combined `/api/dashboard` endpoint was considered and
rejected — it would duplicate sequencing logic the mobile layer already
needs to own for the persona-change-without-refetch behavior below, and
nothing in the current architecture requires the backend to know about
that sequencing.

### `dashboardService` (`apps/mobile/src/services/dashboard/`)

A pure, React-free orchestration module — no hooks, no domain logic —
with two functions:

- **`getPersonalizedWeatherExperience({ persona, preferredTimeOfDay })`**
  — the full pipeline. Location is fetched first (weather/recommendation
  are meaningless without it); weather and the user context are then
  fetched concurrently (`Promise.all`); the recommendation is only
  requested once both succeed. Returns a `PersonalizedWeatherResult` —
  every field can independently be present or carry its own typed error
  (`LocationError` / `WeatherError` / `PersonalizationError` /
  `RecommendationError`), so a downstream failure never erases upstream
  success: if weather succeeds but the recommendation fails, the weather
  is still returned and displayable.
- **`regenerateRecommendation(weather, { persona, preferredTimeOfDay })`**
  — used when only the persona/time selection changes. Re-creates the
  `UserContext` and re-generates the recommendation using the
  **already-fetched** weather, without calling `locationService` or
  `weatherService` again. This is what makes "Runner → Commuter, same
  weather, different recommendation" work without an unnecessary
  Open-Meteo round-trip.

### `usePersonalizedWeather()` (`apps/mobile/src/hooks/`)

A thin UI-facing wrapper around `dashboardService` — owns only local
persona/time selection state and `status`/`statusMessage` bookkeeping.
`refresh()` calls `getPersonalizedWeatherExperience()` (full pipeline);
it fires once automatically on mount (not polling — a single fetch), and
again only when the user taps Refresh. `setPersona()`/
`setPreferredTimeOfDay()` call `regenerateRecommendation()` with the
already-fetched weather instead of `refresh()`, which is what keeps
persona changes cheap. No recommendation/weather/persona logic lives in
the hook itself — it only sequences calls into `dashboardService` and
exposes the result.

### `/dev/dashboard` developer screen

`apps/mobile/app/dev/dashboard.tsx` is a temporary, intentionally basic
screen (marked "DEVELOPMENT / TESTING ONLY") that renders whatever
`usePersonalizedWeather()` returns — persona/time pickers (from the
shared `PERSONAS`/`TIME_OF_DAY_OPTIONS` enumerations), location, current
weather, and the personalized recommendation (title/message/action/
priority/reasons, plus any secondary recommendations) — with a manual
Refresh button. Error states use a small `ERROR_MESSAGES` lookup mapping
each shared error code to the user-facing copy specified for this phase
(e.g. "We couldn't access your location..."); this is presentation text
only, not recommendation logic. Verified to bundle successfully (`npx
expo export --platform web`); not click-tested in a running
simulator/browser in this environment. Not the final CLOUD6 UI.

## 16. End-to-End Integration Testing

Mobile unit tests — 11 new tests, all mocked, no network/GPS:

- `services/dashboard/dashboardService.test.ts` (7) — successful
  end-to-end orchestration (result contains location, weather,
  userContext, and recommendation); location failure (weather never
  requested); weather failure (recommendation never generated);
  personalization failure (recommendation never generated, weather still
  available); recommendation failure (location/weather still available,
  error represented on the result); persona change via
  `regenerateRecommendation` (new context + recommendation requested,
  `locationService`/`weatherService` never called); refresh (re-triggers
  all four services). All four services (`locationService`,
  `weatherService`, `personalizationService`, `recommendationsService`)
  are `jest.mock`ed at the module level.
- `hooks/usePersonalizedWeather.test.ts` (4) — initial auto-load on
  mount, error status/message surfacing, refresh re-triggering the full
  pipeline, and persona change triggering `regenerateRecommendation`
  instead of a full refresh — using the same `renderHook`/`flush` harness
  from §8, with `dashboardService` mocked.

**Live verification:** the existing `GET /health`, `GET /api/weather/current`,
and `POST /api/personalization/context` endpoints were re-verified live
against the running dev server (unaffected by this phase's mobile-only
changes). `npx expo export --platform web` bundled successfully (809
modules, including `/dev/dashboard`). Interactive click-testing of the
full location → weather → recommendation flow on a simulator/device was
not performed in this environment.

## 17. Maps + Routing

```
📍 Start (LocationService)     🔎 Destination (GeocodingService.geocode)
        │                              │
        └──────────────┬───────────────┘
                        ▼
                  routingService
                        │ (mobile → CLOUD6 backend)
                        ▼
              GET /api/routes
                        │
                        ▼
                 RoutingService (modules/routing)
                        │  depends on the RoutingProvider interface
                        ▼
              OsrmRoutingProvider (integrations/routing/osrm)
                        │
                        ▼
                      OSRM
                        │
                        ▼
        Route { start, destination, distanceKm,
                durationMinutes, coordinates[] }
                        │
                        ▼
                    MapView (visualization only)
```

This phase builds the geographic foundation for the future Journey
Weather Intelligence feature (§6) — it does **not** implement weather-
along-route itself. It intentionally mirrors the
`modules/* → integrations/*` port/adapter split already used for weather
(§9) and personalization (§11).

**Route model** (`packages/shared/src/route.ts`) is purely
geographic — `start`, `destination`, `distanceKm`, `durationMinutes`,
`coordinates: GeoPoint[]`. No weather or recommendation fields, by
design: a future `RecommendationService` or Journey Engine will combine
`Route` with `WeatherService`/`PersonalizationService` output, not have
weather baked into the route itself.

**Why `coordinates[]` matters most.** The single most important part of
this model for future phases is `coordinates` (a dense polyline, not
just start/end) plus `durationMinutes`. The intended future pipeline —
not implemented in this phase — is:

```
Route.coordinates[] + Route.durationMinutes
        ↓
   sample route points (future Phase 9)
        ↓
   estimate arrival time at each sampled point
        ↓
   WeatherService.getWeatherAt(point, timestamp)   ← already exists (§9)
        ↓
   Journey Weather Intelligence (future Phase 9+)
```

`WeatherService.getWeatherAt()` was already built in Phase 3
specifically for this — Phase 7 only had to preserve the route geometry
and duration needed to eventually call it per sampled point.

**RoutingService** (`apps/server/src/modules/routing/routing.service.ts`)
validates both coordinates via the existing shared `isValidGeoPoint`
(the same validator Location/Weather use — not reimplemented), then
delegates to the `RoutingProvider` port
(`modules/routing/routing.types.ts`). `OsrmRoutingProvider`
(`integrations/routing/osrm/`) is the only adapter today; swapping
routing providers later means writing a new adapter, not touching
`RoutingService` or the API route.

**OSRM integration.** `osrm.client.ts` calls the public OSRM demo server
(`OSRM_BASE_URL`, defaults to `https://router.project-osrm.org`, no API
key) requesting `geometries=geojson` so the response includes a full
`[lon, lat]` polyline, not just a distance/duration summary.
`osrm.mapper.ts` converts OSRM's meters → `distanceKm`, seconds →
`durationMinutes`, and `[longitude, latitude]` pairs → `GeoPoint[]`
(`{ latitude, longitude }`) — GeoJSON's coordinate order is the opposite
of `GeoPoint`'s, which is exactly the kind of provider quirk this mapper
exists to hide. Nothing outside `osrm.mapper.ts` sees a raw OSRM
response.

**API.** `GET /api/routes?startLatitude=...&startLongitude=...&destinationLatitude=...&destinationLongitude=...`
returns only the normalized `Route` — see `api-contracts.md`.

**Destination selection reuses Phase 2's `GeocodingService`,
extended, not duplicated.** `GeocodingProvider` (mobile) gained a second
method, `geocode(query): Promise<GeoPoint[]>` (forward geocoding —
text → coordinates), implemented in `expoGeocodingProvider` via Expo's
`Location.geocodeAsync`, alongside the existing `reverseGeocode`
(coordinates → text) from Phase 2. This is the same provider/service
pair gaining its natural complementary operation, not a second geocoding
provider. No autocomplete/place-ranking was built — a single
best-match text search is enough for this prototype.

**Mobile routing service**
(`apps/mobile/src/services/routing/routingService.ts`) only calls
`GET /api/routes` on the CLOUD6 backend and normalizes backend error
responses into the shared `RouteError` — it never talks to OSRM and
contains no routing-provider logic, mirroring `weatherService` (§9) and
`recommendationsService` (§13).

### Map technology: Leaflet on web, no native map SDK

- **Web:** `MapView.web.tsx` renders an actual Leaflet map via
  `react-leaflet` (start/destination markers, route polyline, OSM tiles,
  auto-fit-to-bounds). This is real Leaflet, directly.
- **Native (iOS/Android):** `MapView.tsx` (the default, non-`.web`
  variant Metro resolves for native builds) renders a simple text
  summary of the same route data instead of pulling in a native map SDK.
  Leaflet is a web library — forcing it into React Native would require a
  WebView wrapper, and a native map alternative
  (`react-native-maps`) needs native config/build steps this environment
  cannot build or verify. Rather than add an unverifiable dependency, the
  native path stays a placeholder with the same `MapViewProps` contract,
  so a native map renderer can be swapped in later without touching
  routing/journey logic anywhere else.
- **Platform selection is automatic**, via Metro/Expo's `.web.tsx` file
  extension convention — no runtime `Platform.OS` branching needed, and
  the native bundle never imports `leaflet`/`react-leaflet` at all.
- **Map rendering is fully decoupled from routing logic.** `MapView`
  only accepts `{ start, destination, routeCoordinates }`
  (`components/map/types.ts`) and issues no requests — it doesn't know
  `routingService`, the backend, or OSRM exist. `/dev/journey` is the
  only thing that wires `useJourney()`'s data into `MapView`.

### `useJourney()` hook (`apps/mobile/src/hooks/`)

Thin orchestration, no routing-provider logic: `loadStart()` (from
`locationService`), `searchDestination(query)` (from
`geocodingService.geocode`), `getRoute()` (from `routingService`, only
once both start and destination are set), and `refresh()` (re-fetches
location, then re-requests the route if a destination is already
selected). A route is never fetched implicitly — only on an explicit
`getRoute()`/`refresh()` call, or destination search — per the "don't
refetch on rerender" requirement.

### `/dev/journey` developer screen

`apps/mobile/app/dev/journey.tsx` is a temporary, intentionally basic
screen (marked "DEVELOPMENT / TESTING ONLY") wiring `useJourney()`'s data
into `MapView` plus text fields for distance/duration/point count. Auto-
loads the start location on mount (mirroring `/dev/dashboard`'s
auto-load); destination requires an explicit search. No routing/OSRM
logic lives in the component. Not the final CLOUD6 journey UI.

## 18. Maps + Routing Testing

Backend unit tests — 25 new tests, deterministic, no network:

- `integrations/routing/osrm/osrm.client.test.ts` (5) — HTTP success,
  HTTP failure, network failure, timeout, malformed JSON, against a
  mocked `global.fetch`.
- `integrations/routing/osrm/osrm.mapper.test.ts` (8) — meters→km,
  seconds→minutes, `[lon,lat]`→`GeoPoint[]` mapping; `ROUTE_NOT_FOUND`
  for OSRM's `NoRoute` code and an empty routes array;
  `ROUTE_INVALID_RESPONSE` for missing distance/duration/geometry.
- `modules/routing/routing.service.test.ts` (5) — valid start+destination
  delegates to the provider; invalid start/destination rejected without
  calling the provider; provider failure and `ROUTE_NOT_FOUND` normalized
  correctly.
- `routes/routes.test.ts` (7) — supertest against the real Express `app`
  (`routingService` mocked): valid request, missing start/destination,
  invalid latitude/longitude, provider failure (502), not-found (404),
  and asserting no raw OSRM field names (`geometry`, `distance`) leak
  into the response.

Mobile unit tests — 20 new tests:

- `services/location/geocodingService.test.ts` (+3, appended — not a new
  file) — `geocode()` success, provider failure → `GEOCODING_FAILED`,
  empty results. Existing `reverseGeocode` tests untouched.
- `services/routing/routingService.test.ts` (4) — calls the CLOUD6
  backend (not `router.project-osrm.org`), normalizes backend error
  responses, network failures, and malformed JSON into `RouteError`.
- `hooks/useJourney.test.ts` (9) — initial empty state, `loadStart`
  success/failure, `searchDestination` success/no-match,
  `getRoute` requiring both points, a route not being fetched
  automatically after only start+destination are set (only on an
  explicit `getRoute()`/`refresh()` call), and `refresh()` re-triggering
  location + route.

Fixtures: `apps/server/test/fixtures/osrm/route.ts` (raw OSRM shape) and
`apps/server/test/fixtures/cloud6/route.ts` (expected normalized
`Route`), following the same provider/CLOUD6 fixture split established
in §10 and §14.

**Live verification:** the running dev server's `GET /api/routes` was
hit directly against the live OSRM demo server for a real Kolkata route
(Park Street area → Salt Lake) — returned `distanceKm: 12.7473`,
`durationMinutes: 18.02`, and 370 `coordinates`, with the first/last
coordinates matching the requested start/destination (confirming the
polyline is a real route, not placeholder data). An invalid-latitude
request and a missing-parameters request both correctly returned 400.
`npx expo export --platform web` bundled successfully (858 modules,
including the Leaflet CSS bundle and `/dev/journey`).

**Not performed:** interactive click-testing of `/dev/journey` in a
running simulator/browser (selecting a destination, tapping Get Route,
visually confirming markers/polyline) — no display/simulator access in
this environment. The Expo web bundle succeeding is not the same claim.

## 19. Route Sampling & Journey Timeline

```
Route.coordinates[] (hundreds of points, unevenly spaced)
        │
        ▼
  cumulativeDistanceKm() — Haversine distance, summed point-to-point
        │
        ▼
  sampleRoute() — pick ~evenly distance-spaced points, always
                  including start + destination, capped at
                  JOURNEY_CONFIG.MAX_CHECKPOINTS
        │
        ▼
  SampledPoint[] { sequence, point, distanceFromStartKm }
        │
        ▼
  calculateJourneyTimeline() — proportional ETA:
    elapsed = (distance / totalDistance) * route.durationMinutes
        │
        ▼
  JourneyCheckpoint[] { sequence, point, distanceFromStartKm,
                        estimatedArrivalTime }
        │
        ▼
  JourneyPlan { route, departureTime, estimatedArrivalTime,
                durationMinutes, checkpoints }
```

**Weather is NOT fetched in this phase.** `journey.sampler.ts` and
`journey.timeline.ts` are pure functions — no I/O, no external calls, no
knowledge of `modules/weather` or Open-Meteo. This phase exists solely to
produce the two things a future Journey Weather Engine needs per
checkpoint: `point` (where) and `estimatedArrivalTime` (when), so it can
call the already-existing `WeatherService.getWeatherAt(point,
estimatedArrivalTime)` (built in Phase 3 for exactly this) — that call is
not made here.

**Why distance-based sampling, not "every Nth coordinate."** OSRM's
polyline coordinates are not evenly spaced (dense through turns, sparse
on straight stretches — see the 370-point real route in §20's live
verification). Taking every Nth coordinate would produce unevenly spaced
checkpoints in real distance. Instead, `sampleRoute()` computes
cumulative distance along the polyline (`journey.distance.ts`,
Haversine — reusing nothing that needed reimplementing, since no
distance utility existed yet) and picks the coordinate nearest to each
target distance.

**Adapting to route length**
(`apps/server/src/modules/journey/journey.config.ts`:
`DEFAULT_SAMPLE_INTERVAL_KM: 2`, `MIN_SAMPLE_INTERVAL_KM: 0.5`,
`MAX_CHECKPOINTS: 20`):

- **Short routes** (≤ the requested interval, e.g. an 800m trip): exactly
  start + destination, 2 checkpoints. No interval is forced onto a route
  shorter than it.
- **Normal routes**: checkpoints at roughly `intervalKm` spacing between
  start and destination.
- **Long routes** (e.g. 100km at a 2km interval would be 51 points): the
  _effective_ interval widens so the checkpoint count never exceeds
  `MAX_CHECKPOINTS`, rather than truncating the route or silently
  dropping the destination.

**Timeline is an estimate, stated as such.** `calculateJourneyTimeline()`
computes `elapsed = (distance / totalDistance) × durationMinutes` — a
proportional model using only what Phase 7's `RoutingService` already
provides. It does not account for traffic, road speed, or vehicle type,
and is documented as "estimated arrival time based on route distance and
provider-estimated route duration," not live navigation. It is a pure
function of `(checkpoints, totalDistanceKm, durationMinutes,
departureTime: Date)` — it never calls `Date.now()` itself, so the same
inputs always produce the same output (see the determinism tests in
§20). The orchestration boundary (`JourneyService`) is the only place
that defaults `departureTime` to "now" when the caller omits it.

**`JourneyPlan`** (`packages/shared/src/journey.ts`) wraps the existing
`Route` (Phase 7) rather than duplicating route fields, plus
`departureTime`, `estimatedArrivalTime` (the last checkpoint's ETA),
`durationMinutes`, and `checkpoints: JourneyCheckpoint[]`. The original
`route.coordinates` is never mutated — checkpoints are a derived,
separate array, so a future phase can still render the full polyline on
a map alongside the reduced checkpoints.

**API decision: `POST /api/journey/plan` was created.** Unlike some
optional endpoints in earlier phases, this one was worth adding — it
makes the sampling/timeline logic directly testable end-to-end against a
real Phase 7 route (see the live verification in §20) and gives
`/dev/journey` a natural way to demonstrate the pipeline without
duplicating any sampling math on the client. Input: `{ route,
departureTime?, options? }`; output: the normalized `JourneyPlan` — see
`api-contracts.md`.

**Mobile.** `apps/mobile/src/services/journey/journeyService.ts` calls
only `/api/journey/plan` and contains no sampling/timeline math.
`useJourney()` (extended, not duplicated — see §17) gained a
`planTimeline()` action and `journeyPlan` state, only callable once a
`route` exists. `/dev/journey` gained a "JOURNEY TIMELINE" section
listing departure time, duration, checkpoint count, and each
checkpoint's distance/ETA — no weather, no recommendation, no final UI
styling, per this phase's scope.

## 20. Route Sampling + Journey Timeline Testing

Backend unit tests — 62 new tests, fully deterministic, no I/O:

- `modules/journey/journey.distance.test.ts` (7) — Haversine distance
  for the same point (0), nearby points, a known Kolkata↔Salt Lake pair,
  symmetry; cumulative distance starting at 0, monotonically increasing
  across multiple segments, and a single-coordinate edge case.
- `modules/journey/journey.sampler.test.ts` (12) — a ~200m route
  producing exactly start+destination (not forced into a 2km interval);
  a ~10km route including start first/destination last, strictly
  increasing distance and sequence, a reasonable checkpoint count at the
  default interval, and more checkpoints for a smaller interval; a long
  (~100km, 100-coordinate) route never exceeding
  `MAX_CHECKPOINTS` while still including start/destination; determinism
  for repeated calls with identical input.
- `modules/journey/journey.timeline.test.ts` (7) — start checkpoint ETA
  = departure time; destination ETA ≈ departure + duration; the
  documented 10km/30min → 5km/+15min proportional example; the
  documented 12km/36min → 7-checkpoint timeline example exactly;
  determinism; no division-by-zero for a zero-distance route; sequence/
  point fields preserved.
- `modules/journey/journey.service.test.ts` (13) — a valid route produces
  a full `JourneyPlan`; `departureTime` defaults to "now" when omitted;
  custom `intervalKm` changes checkpoint count; missing route, missing/
  empty coordinates, an invalid coordinate, negative distance, and an
  invalid duration type all rejected with `JOURNEY_INVALID_ROUTE`; an
  unparseable `departureTime` rejected with
  `JOURNEY_INVALID_DEPARTURE_TIME`; an invalid `intervalKm` rejected with
  `JOURNEY_INVALID_OPTIONS`; determinism for identical
  route+options+departureTime.
- `routes/journey.test.ts` (5) — supertest against the real Express
  `app` for `POST /api/journey/plan`: valid request, invalid route,
  invalid departure time, invalid sampling options, missing route.

Mobile unit tests — 8 new tests:

- `services/journey/journeyService.test.ts` (3) — calls the CLOUD6
  backend, normalizes backend error responses and network failures into
  `JourneyError`.
- `hooks/useJourney.test.ts` (+2, appended to the existing Phase 7 file)
  — `planTimeline()` requires a route first; fetches and stores a
  `JourneyPlan` once a route exists.

Fixtures: `apps/server/test/fixtures/cloud6/journey.ts` — a ~10km
straight-line route, a ~200m short route, and a ~100km/100-coordinate
long route, reused across all four backend journey test files.

**Live verification:** the running dev server's real Phase 7 route
(Park Street area → Salt Lake, 370 coordinates, `distanceKm: 12.7473`,
`durationMinutes: 18.02`, from live OSRM) was fed directly into
`POST /api/journey/plan`. It returned 8 checkpoints spaced roughly 1.8km
apart, in strictly increasing distance order, with ETAs from
`16:00:00.000Z` (departure) to `16:18:01.200Z` — exactly matching the
route's 18.02-minute duration. An 800m test route correctly produced
only 2 checkpoints (start + destination), confirming short journeys
aren't force-fitted into the 2km default interval. An invalid route
(missing `start`) correctly returned
`{ "code": "JOURNEY_INVALID_ROUTE" }` with HTTP 400. `npx expo export
--platform web` bundled successfully, including the extended
`/dev/journey` screen.

**Not performed:** interactive click-testing of the "Plan Timeline"
button and checkpoint list in a running simulator/browser — no
display/simulator access in this environment.

## 21. Journey Weather Intelligence

```
JourneyPlan.checkpoints[]  (from Phase 8 — 2–20 points, not 370)
        │
        ▼
  for each checkpoint:
    WeatherService.getWeatherAt(checkpoint.point, checkpoint.estimatedArrivalTime)
        │  (existing Phase 3 capability — not reimplemented)
        ▼
  JourneyWeatherCheckpoint { sequence, point, distanceFromStartKm,
                             estimatedArrivalTime, weather, weatherError? }
        │
        ▼
  summarizeJourneyWeather() — availability counts, rain-affected
                              checkpoints, weatherCode transitions
        │
        ▼
  JourneyWeatherPlan { route, departureTime, estimatedArrivalTime,
                       durationMinutes, checkpoints, summary }
```

This is CLOUD6's core differentiator: not "what's the weather here," but
"what weather will I encounter along this journey." **Journey Weather
Intelligence enriches route checkpoints with weather based on estimated
location and arrival time** — nothing more. No AI, no recommendations,
no risk scores, no departure-time suggestions; those are explicitly
future phases.

**Weather is queried only at sampled checkpoints, not every route
coordinate.** A 370-coordinate OSRM route becomes 8 Phase-8 checkpoints,
which becomes 8 `getWeatherAt()` calls — verified live (§22). This is the
entire reason Phase 8's sampling exists.

**No new weather logic.** `JourneyWeatherService`
(`apps/server/src/modules/journey/journey.weather.service.ts`) calls the
existing `WeatherService.getWeatherAt()` directly — it never imports
`integrations/weather/openmeteo`, never constructs an Open-Meteo URL, and
never duplicates weather validation, caching, or normalization. The
checkpoint's `weather` field is the existing `HourlyWeather` shared type
(exactly what `getWeatherAt()` already returns), not a new/duplicated
weather model.

**Timestamp handling.** Each checkpoint's own
`estimatedArrivalTime` (Phase 8's proportional ETA) is passed to
`getWeatherAt()` — never the current time. This is the mechanism that
makes "different location + different arrival time → different weather"
actually happen (see the live example in §22, where checkpoints along
the same route at different ETAs returned different rain probabilities).

**Concurrency.** All checkpoints are enriched via a single `Promise.all`
— bounded by Phase 8's checkpoint cap (≤20), not uncontrolled. Each
individual `getWeatherAt()` call is wrapped in its own try/catch before
being included in the `Promise.all`, so one checkpoint's rejection can
never reject the whole batch or lose the others' results — see partial
failure below, which this design makes possible.

**Partial failure is a first-class result, not an exception.** If a
checkpoint's weather lookup fails, `weather` is `null` and `weatherError`
carries the shared `WeatherErrorCode`/message — the checkpoint is _never_
dropped from the array, and the rest of the plan (route, other
checkpoints) is always returned. This was exercised for real, not just
in mocked tests: see §22's live run, where 3 of 8 checkpoints timed out
against live Open-Meteo under request pressure while the other 5 (and
the full route/plan) came back normally. If every checkpoint fails, the
`JourneyWeatherPlan` is still returned with `checkpoints` all null and
`summary.weatherAvailableCheckpoints: 0` — never fabricated weather.

**`JourneyWeatherSummary`** is intentionally minimal — available/
unavailable counts, `rainAffectedCheckpointCount` (weatherCode in
`['drizzle','rain','thunderstorm']` OR `rainProbability` ≥ 50%, both
config in `journey.weather.config.ts`), `firstRainCheckpointSequence`,
and `transitions: JourneyWeatherTransition[]` (a `weatherCode` change
between consecutive available-weather checkpoints, e.g. `clear → rain`).
No risk score, no severity ranking beyond what's already visible in the
raw checkpoint data — this is a UI convenience, not a second decision
layer.

**Personalization boundary respected.** Nothing in
`journey.weather.service.ts`/`journey.weather.summary.ts` imports
`modules/personalization` or touches `UserContext` — a future phase will
combine `JourneyWeatherPlan` with a persona, not this one.

**API: `POST /api/journey/weather`.** Accepts `{ journeyPlan }` — the
existing `JourneyPlan` output of `POST /api/journey/plan` (Phase 8),
reused rather than re-deriving sampling/timeline from a raw route. Does
not call the routing provider, does not resample, does not recalculate
the timeline — only enriches the checkpoints already present. See
`api-contracts.md`.

**Mobile.** `journeyService.getJourneyWeather()` (extended, not a
duplicate) calls only `/api/journey/weather`. `useJourney()` gained
`journeyWeather` state and an `analyzeWeather()` action, callable once a
`journeyPlan` exists. `/dev/journey` gained a "JOURNEY WEATHER" section:
per-checkpoint condition/temperature/rain probability (or "Weather
unavailable"), plus a summary block (available/unavailable counts,
rain-affected count, first rain checkpoint, detected transitions) — all
values sourced directly from the `JourneyWeatherPlan`, nothing
hardcoded in the component.

## 22. Journey Weather Intelligence Testing

Backend unit tests — 40 new tests, deterministic, `WeatherService`
mocked, no network:

- `modules/journey/journey.weather.service.test.ts` (14) — a single
  checkpoint's weather lookup receives the correct point + ETA; multiple
  checkpoints each get their own correctly-matched lookup; checkpoint
  order is preserved even when weather requests resolve out of order
  (verified by making the _first_ checkpoint's mock respond slowest);
  full successful enrichment (all checkpoints have weather, original
  route/timing preserved); partial failure (checkpoint 3 of 4 fails —
  checkpoints 1/2/4 keep their weather, checkpoint 3 becomes `weather:
null` + `weatherError`, never dropped, `summary` counts reflect 3
  available/1 unavailable); complete failure (all 4 fail — plan and all
  4 checkpoints still returned, zero fake weather, `summary` shows 0
  available); 5 invalid-input cases (missing plan, empty checkpoints, a
  malformed checkpoint, invalid `departureTime`); a 2-checkpoint
  short-journey plan enriches without issue.
- `modules/journey/journey.weather.summary.test.ts` (11) — CLEAR→RAIN
  and RAIN→CLEAR transition detection, no transition when weather is
  constant, transitions correctly skip checkpoints with missing weather
  instead of crashing; available/unavailable counts; rain-affected
  detection by both probability and weatherCode; no crash when zero
  checkpoints have weather.
- `routes/journeyWeather.test.ts` (4) — supertest against the real
  Express `app` (`journeyWeatherService` mocked) for
  `POST /api/journey/weather`: valid request, invalid plan, missing
  plan, invalid departure time.
- Fixtures extended in `apps/server/test/fixtures/cloud6/journey.ts`:
  `journeyPlanFixture` (a 4-checkpoint plan), `makeCheckpoint`,
  `makeWeatherCheckpoint`, `makeHourlyWeather` builders — reused across
  all three new test files rather than duplicating literals.

Mobile unit tests — 9 new tests:

- `services/journey/journeyService.test.ts` (+3, appended) —
  `getJourneyWeather()` calls `/api/journey/weather` (not
  `open-meteo.com`), normalizes backend error responses and network
  failures into `JourneyError`.
- `hooks/useJourney.test.ts` (+2, appended) — `analyzeWeather()`
  requires a `journeyPlan` first; the full integration flow
  (`loadStart → searchDestination → getRoute → planTimeline →
analyzeWeather`) correctly calls `getJourneyWeather` with the plan
  from `planJourney` and stores the resulting `JourneyWeatherPlan` — the
  Group L "integration flow" test, using mocked services throughout.

**Live verification — the core claim of this phase, actually
exercised, not just unit-tested:** a real OSRM route (Kolkata → Salt
Lake, 370 coordinates, `distanceKm: 12.7473`, `durationMinutes: 18.02`)
was sent to `POST /api/journey/plan` (8 checkpoints), and that
`JourneyPlan` was sent to `POST /api/journey/weather`. The response
contained real, distinct Open-Meteo data per checkpoint — e.g. rain
probability dropping from 78% at checkpoint 1 to 51% at checkpoint 5 as
both location and estimated arrival time changed along the route. Under
real request load, checkpoints 6–8 hit `WEATHER_TIMEOUT` against live
Open-Meteo while checkpoints 1–5 succeeded — this **is** the partial-
failure path being exercised for real, not simulated: the response still
contained all 8 checkpoints, the 3 failed ones carried `weather: null` +
a `weatherError`, and `summary.weatherAvailableCheckpoints: 5` /
`weatherUnavailableCheckpoints: 3` reflected it accurately. No raw
Open-Meteo field names (e.g. `temperature_2m`) appeared anywhere in the
response. A short (~848m) route was also planned and enriched
end-to-end, producing exactly 2 checkpoints, both with real weather. An
invalid journey plan (missing `route`) correctly returned
`{ "code": "JOURNEY_INVALID_ROUTE" }` with HTTP 400. `npx expo export
--platform web` bundled successfully, including the extended
`/dev/journey` screen.

**Not performed:** interactive click-testing of "Analyze Journey
Weather" and the resulting checkpoint/summary display in a running
simulator/browser — no display/simulator access in this environment.

## 23. Journey Risk + Actionable Intelligence

```
JourneyWeatherPlan (Phase 9)  +  UserContext (Phase 4)
        │
        ▼
  analyzeJourney() — pure function (journey.analysis.ts)
        │
        ├─ evaluateCheckpointFactors(weather) → JourneyFactor[]   (reuses Phase 5's
        │                                                          THRESHOLDS/SEVERE_WEATHER_CODES)
        ├─ filter by persona relevance (context.weatherPriorities)
        ├─ derive journey-level factors: WEATHER_DETERIORATION,
        │   SEVERE_WEATHER_NEAR_DESTINATION, FAVORABLE_JOURNEY
        └─ pick top factor by severity → riskLevel, primaryConcern,
            affectedSegment, confidence, reasons[]
        │
        ▼
  JourneyAnalysis
        │
        ▼
  buildJourneyRecommendation(persona, analysis)   (journey.analysis.recommendation.ts —
        │                                          mirrors Phase 5's persona-template pattern)
        ▼
  JourneyIntelligence { journeyWeatherPlan, analysis, recommendation }
```

This phase answers "given the weather I'll actually encounter along this
journey, how risky is it, and what should I do" — it is the layer that
turns Phase 9's raw per-checkpoint weather into an explainable, persona-
aware decision. Like the Recommendation Engine (§13), it is **deterministic
and rule-based, not AI**: `analyzeJourney()` is a pure function of its
inputs, and every result carries `reasons: JourneyFactor[]` naming exactly
which detected factors produced it.

**No weather refetching, no resampling, no re-timing.** `journey.analysis.service.ts`
takes an already-built `JourneyWeatherPlan` (Phase 9's output) and a
`UserContext` (Phase 4's output) and does no I/O at all — no calls to
`WeatherService`, `RoutingService`, or the routing/weather providers.
Persona switching therefore only re-runs `analyzeJourney()` +
`buildJourneyRecommendation()` against the same already-fetched weather —
it never triggers a new location/route/weather round-trip (see the mobile
section below and the live verification in §24).

**Reuses Phase 5's thresholds instead of duplicating them.**
`evaluateCheckpointFactors(weather: HourlyWeather)`
(`journey.analysis.rules.ts`) imports `THRESHOLDS`/`SEVERE_WEATHER_CODES`
directly from `modules/recommendations/recommendation.thresholds` — a
parallel function to Phase 5's `evaluateFactors` was needed only because
`HourlyWeather` (Phase 9's checkpoint weather) lacks the `feelsLike`/
`visibility` fields `CurrentWeather` has, not because the thresholds
themselves needed to change.

**`JourneyFactor` is a separate namespace from `RecommendationFactor`,
by design.** Per-checkpoint factors (`RAIN_DURING_JOURNEY`,
`THUNDERSTORM_DURING_JOURNEY`, `HIGH_WIND_DURING_JOURNEY`,
`HIGH_HEAT_DURING_JOURNEY`, `HIGH_UV_DURING_JOURNEY`) plus three
journey-level factors (`WEATHER_DETERIORATION`,
`SEVERE_WEATHER_NEAR_DESTINATION`, `FAVORABLE_JOURNEY`) —
`packages/shared/src/journey-analysis.ts`. `JourneyRiskLevel` and
`JourneyRecommendation.type`/`.priority` directly reuse Phase 5's
`RecommendationPriority`/`RecommendationType` unions (not
reimplemented), since those concepts — "how severe," "what kind of
action" — are identical across both engines; only the underlying factor
vocabulary differs because journeys have route/segment-shaped concerns
Phase 5 never had.

**Persona relevance, not persona branching.** `JOURNEY_FACTOR_PRIORITY`
maps each per-checkpoint `JourneyFactor` to a `WeatherPriority`, exactly
mirroring Phase 5's `FACTOR_PRIORITY` (§13) — a factor only surfaces for
personas whose `weatherPriorities` includes it. The three journey-level
factors are always relevant (mirroring Phase 5's treatment of favorable
conditions), since "will the weather get worse before I arrive" and "is
severe weather waiting near my destination" matter regardless of persona.

**Do not over-personalize.** The underlying weather data and detected
factors are identical across personas for the same `JourneyWeatherPlan` —
only the _interpretation_ (which factors are relevant, and the
recommendation copy) changes per persona. This was verified live, not
just asserted (§24): the same journey produced identical `riskLevel`/
`factors`/`affectedCheckpointSequences` for a runner and a commuter, but
different recommendation wording.

**Missing weather is never treated as bad weather.** Checkpoints with
`weather === null` (a Phase 9 partial-failure result) are simply excluded
from factor evaluation, not treated as risk. `confidence` (`high` |
`medium` | `low`, `journey.analysis.config.ts` thresholds) drops as the
fraction of weather-available checkpoints drops, so the UI can signal "we
don't have full information" without inventing a risk level. If **no**
checkpoint has weather, `analyzeJourney()` returns an explicit
"Weather information is unavailable for this journey" result instead of
defaulting to `FAVORABLE_JOURNEY` — a real result exercised live (§24).

**Affected segment.** `affectedCheckpointSequences`/`affectedSegment`
(`fromDistanceKm`/`toDistanceKm`) are derived from the min/max
`distanceFromStartKm` among checkpoints where the top factor was
detected — giving "which part of your journey" without any new
route-geometry logic (reuses `distanceFromStartKm`, already computed in
Phase 8).

**Departure-time optimization — explicitly not implemented.** The spec
allowed this as optional. It was deliberately deferred rather than faked:
producing a real "leave 20 minutes later instead" recommendation would
require re-running weather lookups for multiple alternative departure
times per analysis (4–5x the Open-Meteo calls Phase 9 already showed
hitting rate limits under a single-pass load — see §22's live
`WEATHER_TIMEOUT`s). Implementing it now would likely produce unreliable
or silently-degraded results; it's left for a phase that can budget for
the additional weather traffic properly.

**API: `POST /api/journey/intelligence`.** Accepts `{ journeyWeatherPlan,
userContext }` — the existing outputs of `POST /api/journey/weather`
(Phase 9) and `POST /api/personalization/context` (Phase 4), reused
rather than re-derived. Performs no route/weather I/O — see
`api-contracts.md`.

**Mobile.** `journeyService.getJourneyIntelligence()` (extended, not
duplicated) calls only `/api/journey/intelligence`. `useJourney()` gained
`journeyIntelligence`/`persona`/`preferredTimeOfDay` state and
`analyzeJourney()`/`setPersona()`/`setPreferredTimeOfDay()` actions.
Changing persona/time is a plain state setter — it does **not**
auto-trigger re-analysis; the user presses "Analyze Journey" again. This
is a deliberate simplicity choice for the dev screen (auto-refresh on
every tap would be surprising for a screen meant to demonstrate the
pipeline step by step), not a limitation of the underlying architecture,
which fully supports cheap persona-only re-analysis. `/dev/journey`
gained a "PERSONA" section (persona/time-of-day pickers from the shared
`PERSONAS`/`TIME_OF_DAY_OPTIONS` enumerations) and a "JOURNEY
INTELLIGENCE" section (risk, primary concern, affected area, reasons,
recommendation) — no risk/recommendation logic in the component.

## 24. Journey Risk + Actionable Intelligence Testing

Backend unit tests, deterministic, no network:

- `modules/journey/journey.analysis.rules.test.ts` — factor detection for
  rain, heavy rain, thunderstorm, high wind, high heat, high UV, plus a
  `weatherCodeSeverity` ranking test.
- `modules/journey/journey.analysis.test.ts` — transitions correctly
  become `WEATHER_DETERIORATION`; affected checkpoints/distance computed
  correctly; risk level for low/medium/high/severe weather; persona
  differences (same weather, different relevant factors); missing weather
  at some checkpoints never produces a false factor and lowers
  confidence; all-weather-unavailable input never crashes and never
  fabricates a factor; favorable-journey detection; every reason in
  `analysis.reasons` traces back to a detected factor (never invented);
  determinism for repeated calls with identical input.
- `modules/journey/journey.analysis.recommendation.test.ts` — a
  recommendation always has type/priority/title/message/action/reasons;
  `reasons` always equals `analysis.factors` (never diverges); favorable
  journeys get a `FAVORABLE` recommendation; the same weather produces
  different recommendation titles for a runner vs. a commuter.
- `modules/journey/journey.analysis.service.test.ts` — valid input
  produces a full `JourneyIntelligence`; invalid plan, invalid persona,
  missing body, and a malformed checkpoint are all rejected with
  `JourneyError`; changing persona without re-fetching weather (same
  `journeyWeatherPlan` passed twice) produces a different recommendation
  from the same underlying weather.
- `routes/journeyIntelligence.test.ts` — supertest against the real
  Express `app` (`journeyAnalysisService` mocked) for
  `POST /api/journey/intelligence`: valid request, invalid journey data,
  invalid persona, missing body, malformed checkpoint.

Fixtures extended in `apps/server/test/fixtures/cloud6/journey.ts`:
`deterioratingJourneyWeatherPlanFixture` (7 checkpoints trending
clear → rain → thunderstorm) and `favorableJourneyWeatherPlanFixture` (3
clear checkpoints).

Mobile unit tests:

- `services/journey/journeyService.test.ts` (+3, appended) —
  `getJourneyIntelligence()` calls the CLOUD6 backend, normalizes backend
  error responses and network failures into `JourneyError`.
- `hooks/useJourney.test.ts` (+3, appended) — `analyzeJourney()` requires
  journey weather first; builds a `UserContext` for the selected persona
  and fetches intelligence; changing persona does not refetch location,
  route, or weather.

**Live verification — the core "objective weather, subjective
interpretation" claim, actually exercised:** a real OSRM route (Kolkata
Park Street area → Salt Lake) was planned into an 8-checkpoint
`JourneyPlan` (`POST /api/journey/plan`) and weather-enriched
(`POST /api/journey/weather`) against live Open-Meteo — 5 of 8
checkpoints returned real weather, 3 timed out (matching Phase 9's known
rate-limit behavior). Real `UserContext` objects for `runner` and
`commuter` were fetched from the live `POST /api/personalization/context`.
The same `journeyWeatherPlan` was then sent to
`POST /api/journey/intelligence` with each context: both runs returned
identical `riskLevel: 'medium'`, `factors: ['RAIN_DURING_JOURNEY']`, and
`affectedCheckpointSequences: [2]`, but different
`recommendation.title`/`recommendation.action` text ("Rain expected
during part of your run | Carry rain protection or plan an alternate
window." for runner vs. "Rain may affect part of your commute | Allow
extra travel time and bring rain gear." for commuter) — directly
confirming the spec's core requirement live, not just in mocked tests.
The 3 checkpoints with missing weather were correctly excluded from
factor evaluation rather than treated as risk (`confidence: 'medium'`).
An invalid `journeyWeatherPlan` (missing `route`) correctly returned
`{ "code": "JOURNEY_INVALID_ROUTE", "message": "route is required" }`
with HTTP 400; an invalid persona (`"astronaut"`) against a valid weather
plan correctly returned
`{ "code": "JOURNEY_INVALID_ROUTE", "message": "Unknown persona: astronaut" }`
with HTTP 400. `npx expo export --platform web` bundled successfully,
including the extended `/dev/journey` screen (Persona + Journey
Intelligence sections).

**Not performed:** interactive click-testing of the Persona picker and
Journey Intelligence section in a running simulator/browser — no
display/simulator access in this environment.
