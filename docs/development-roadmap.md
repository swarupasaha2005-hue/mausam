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
- **Phase 3 — Weather Engine** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  Open-Meteo integration (`integrations/weather/openmeteo`) behind a
  `WeatherProvider` port, `WeatherService` (validation, in-memory TTL
  caching, error normalization, `getWeatherAt` for future Journey use),
  `GET /api/weather/{current,hourly,daily}`, shared weather models +
  `WeatherError`, mobile `weatherService` (backend-only, never calls
  Open-Meteo), `/dev/weather` developer test screen. 57 backend + 4 mobile
  unit tests pass, all mocked (see `architecture.md` §10). Manually
  verified against the live Open-Meteo API (current/hourly/daily/air
  quality all returned real data). Air quality and `getWeatherAt` are
  implemented and tested but not yet exposed over HTTP — no consumer
  needs them yet. The mobile `/dev/weather` screen bundles successfully
  but was not click-tested in a running simulator/browser in this
  environment.
- **Phase 4 — Persona & Personalization Engine** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  (Note: weather normalization, originally planned as a separate phase,
  was already completed as part of Phase 3's Open-Meteo mapper.) Shared
  `Persona`/`Activity`/`TimeOfDay`/`WeatherPriority`/`UserContext` types +
  `PersonalizationError`, backend `PersonaConfig` map for all 8 personas
  (`persona.config.ts`), `PersonalizationService.createUserContext()`,
  `POST /api/personalization/context`, mobile `personalizationService`
  (backend-only) + `usePersonalization()` hook, `/dev/persona` developer
  test screen. Does not fetch weather and does not generate
  recommendations — see `architecture.md` §11. 67 backend + 9 mobile unit
  tests pass, all mocked (see `architecture.md` §12). Manually verified
  against the live backend (`POST /api/personalization/context` for a
  valid request, defaulted time, invalid persona, invalid time, and a
  missing body). The mobile `/dev/persona` screen bundles successfully
  but was not click-tested in a running simulator/browser in this
  environment.
- **Phase 5 — Recommendation Engine** — ⏳ NOT IMPLEMENTED
- **Phase 6 — Basic Mobile Experience** — ⏳ NOT IMPLEMENTED
- **Phase 7 — Maps & Routing** — ⏳ NOT IMPLEMENTED
- **Phase 8 — Route Sampling** — ⏳ NOT IMPLEMENTED
- **Phase 9 — Journey Weather Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 10 — Journey Risk Engine** — ⏳ NOT IMPLEMENTED
- **Phase 11 — Departure Time Optimization** — ⏳ NOT IMPLEMENTED
- **Phase 12 — AI Explanation Layer** — ⏳ NOT IMPLEMENTED
- **Phase 13 — Contextual Alerts** — ⏳ NOT IMPLEMENTED
- **Phase 14 — My Day / Activity Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 15 — Final UI/UX & Polish** — ⏳ NOT IMPLEMENTED

Do not assume any phase beyond Phase 4 is complete.
