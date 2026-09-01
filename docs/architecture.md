# CLOUD6 Architecture

Status: **Phase 1 — Foundation**. This document describes the architecture
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
`LOCATION_TIMEOUT`, `LOCATION_INVALID`, `GEOCODING_FAILED`). Weather and
journey domain models are intentionally deferred to the phases that
define them, so they're designed once, correctly, against real
requirements instead of guessed early.

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
