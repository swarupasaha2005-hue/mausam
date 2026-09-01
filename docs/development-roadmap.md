# CLOUD6 Development Roadmap

CLOUD6 is being built incrementally. Every layer is tested before moving
to the next phase.

- **Phase 1 — Project Foundation** — ✅ IMPLEMENTED (this phase)
  Monorepo, Expo mobile boot screen, Express backend with `/health`,
  shared package with `GeoPoint`, docs, lint/format/typecheck tooling.

- **Phase 2 — Location Engine** — ✅ IMPLEMENTED, UNIT-TESTED — ⏳ real-device GPS verification pending
  Shared `GeoPoint`/`Location` types + coordinate validation, mobile
  `LocationService`/`GeocodingService` (device-provider abstraction, Expo +
  mock providers), `useLocation()` hook, `/dev/location` developer test
  screen, backend coordinate-validation stub. 36 unit tests pass on mocked
  device/geocoding providers (see `architecture.md` §8). Not yet verified
  against real GPS hardware/simulator.
- **Phase 3 — Weather Engine** — ⏳ NOT IMPLEMENTED
- **Phase 4 — Weather Normalization** — ⏳ NOT IMPLEMENTED
- **Phase 5 — Persona & Personalization Engine** — ⏳ NOT IMPLEMENTED
- **Phase 6 — Recommendation Engine** — ⏳ NOT IMPLEMENTED
- **Phase 7 — Basic Mobile Experience** — ⏳ NOT IMPLEMENTED
- **Phase 8 — Maps & Routing** — ⏳ NOT IMPLEMENTED
- **Phase 9 — Route Sampling** — ⏳ NOT IMPLEMENTED
- **Phase 10 — Journey Weather Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 11 — Journey Risk Engine** — ⏳ NOT IMPLEMENTED
- **Phase 12 — Departure Time Optimization** — ⏳ NOT IMPLEMENTED
- **Phase 13 — AI Explanation Layer** — ⏳ NOT IMPLEMENTED
- **Phase 14 — Contextual Alerts** — ⏳ NOT IMPLEMENTED
- **Phase 15 — My Day / Activity Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 16 — Final UI/UX & Polish** — ⏳ NOT IMPLEMENTED

Do not assume any phase beyond Phase 1 is complete.
