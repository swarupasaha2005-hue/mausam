# CLOUD6 Architecture

Status: **Phase 8 — Route Sampling + Journey Timeline**. This document describes the architecture
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
