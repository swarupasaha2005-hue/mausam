# CLOUD6

A personalized weather decision-support mobile application, built for
Smart India Hackathon problem statement **SIH26076** — "Development of
personalized homepage for 'Mausam' mobile application."

## Core concept

Most weather apps show the same data to everyone. CLOUD6 turns weather
into a decision:

```
Weather Data → Personal Context → Analysis → Recommendation → Action
```

It will eventually support personas such as Runner, Commuter, Parent &
Family, Agriculture & Gardening, Traveler, Health-Conscious, Beach &
Outdoor, and Event Planner — each surfacing the weather signals (rain
probability, feels-like temperature, UV index, air quality, severe
alerts, etc.) that actually matter to them.

## Journey Weather Intelligence (key differentiator)

Instead of only showing weather at your current location or destination,
CLOUD6 will analyze weather **along your entire route** — sampling the
route into points, estimating your arrival time at each, detecting risky
sections, and recommending things like "leave 25 minutes later" with an
AI-generated explanation. This is CLOUD6's core differentiator and will
be built as a dedicated subsystem in later phases (see
[`docs/development-roadmap.md`](docs/development-roadmap.md)). **Not
implemented yet.**

## Tech stack

- **Mobile**: React Native, Expo, Expo Router, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Shared**: TypeScript (`@cloud6/shared`)
- **Monorepo**: npm workspaces

## Repository structure

```
cloud6/
├── apps/
│   ├── mobile/     Expo app (Expo Router, TypeScript)
│   └── server/     Express backend (TypeScript)
├── packages/
│   └── shared/     Shared TypeScript types (@cloud6/shared)
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   └── development-roadmap.md
├── .env.example
└── package.json    npm workspaces root
```

See [`docs/architecture.md`](docs/architecture.md) for the full
architecture, including why mobile never calls external APIs directly
and how the integration layer keeps weather/maps/AI providers
replaceable.

## Setup

Requires Node.js 18+.

```bash
npm install
cp apps/server/.env.example apps/server/.env   # no real keys needed for Phase 1
cp apps/mobile/.env.example apps/mobile/.env
```

## Development commands

```bash
npm run dev        # start the backend (apps/server) in watch mode
npm run mobile      # start the Expo dev server (apps/mobile)
npm run typecheck   # tsc --noEmit across all workspaces
npm run lint        # eslint across all workspaces
npm run format      # prettier --write
```

Backend health check, once running:

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"cloud6-server"}
```

## Current implementation status

**Current status: Phase 1 — Foundation.**

Implemented: monorepo scaffolding, Expo mobile app with a placeholder
boot screen, Express backend with a `GET /health` endpoint, the
`@cloud6/shared` package with a minimal `GeoPoint` type, and module/
integration directory boundaries (documented, not implemented) for the
future weather, location, journey, personalization, recommendations, ai,
alerts, and users domains.

Not implemented: weather data, maps/routing, Journey Weather
Intelligence, journey risk scoring, departure optimization, AI
explanations, recommendations, personas, notifications/alerts,
authentication, and any database. See
[`docs/development-roadmap.md`](docs/development-roadmap.md) for the
full phase plan.
