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
`@cloud6/shared`. Phase 1 only defines `GeoPoint` (`latitude`,
`longitude`) — the minimum needed to avoid duplicating a coordinate type
across workspaces. Weather and journey domain models are intentionally
deferred to the phases that define them, so they're designed once,
correctly, against real requirements instead of guessed early.

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
