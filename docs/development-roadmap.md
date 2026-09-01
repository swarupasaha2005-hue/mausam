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
- **Phase 5 — Recommendation Engine** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  Deterministic, rule-based `RecommendationService`/`generateRecommendations`
  (`modules/recommendations`) — converts `CurrentWeather` + `UserContext`
  into a priority-sorted `Recommendation[]`, filtered by persona relevance
  via `context.weatherPriorities` (no AI/LLM involved; see
  `architecture.md` §13). Centralized thresholds
  (`recommendation.thresholds.ts`), persona-flavored copy as data
  (`PERSONA_FACTOR_TEMPLATES`), `POST /api/recommendations`, mobile
  `recommendationsService` (backend-only, no rules), `/dev/recommendations`
  developer test screen. 41 backend + 3 mobile unit tests pass, all mocked
  (see `architecture.md` §14). Manually verified against the live
  backend: identical hot+rainy weather produced a `RESCHEDULE` "Rain
  likely during your run" for a runner and a `CAUTION` "Rain likely
  during your commute" for a commuter — confirming persona-aware behavior
  end to end. Favorable weather and invalid-input cases also verified
  live. The mobile `/dev/recommendations` screen bundles successfully but
  was not click-tested in a running simulator/browser in this
  environment.
- **Phase 6 — End-to-End Integration** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  Connects Location → Weather → Personalization → Recommendation into one
  mobile flow, purely by orchestrating existing services — no new domain
  logic and no new backend endpoint. Mobile `dashboardService`
  (`getPersonalizedWeatherExperience()` for the full pipeline,
  `regenerateRecommendation()` so a persona change reuses already-fetched
  weather instead of re-fetching), `usePersonalizedWeather()` hook
  (auto-loads once on mount, manual Refresh, no polling), `/dev/dashboard`
  developer test screen (persona/time pickers, location, weather,
  personalized recommendation, all sourced from the hook — no domain
  logic in the component). See `architecture.md` §15. 11 new mobile unit
  tests pass, all mocked (§16) — including verifying that a persona
  change never calls `locationService`/`weatherService` again, and that a
  downstream failure (e.g. recommendation) never hides an upstream
  success (e.g. weather is still shown). Manually re-verified that the
  existing `/health`, `/api/weather/current`, and
  `/api/personalization/context` endpoints still work; `npx expo export
--platform web` bundled successfully (809 modules) including
  `/dev/dashboard`. The full location → weather → recommendation flow was
  not interactively click-tested on a simulator/device in this
  environment.
- **Phase 7 — Maps & Routing** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  OSRM integration (`integrations/routing/osrm`) behind a
  `RoutingProvider` port, `RoutingService` (shared `isValidGeoPoint`
  validation, error normalization), `GET /api/routes`, shared `Route`
  model (`start`, `destination`, `distanceKm`, `durationMinutes`,
  `coordinates[]` — geographic only, no weather/recommendation fields).
  `GeocodingService` extended with forward geocoding (`geocode()`) for
  destination text search — the existing Phase 2 provider/service, not a
  second one. Mobile `routingService` (backend-only, never calls OSRM),
  `useJourney()` hook, `MapView` component (Leaflet via `react-leaflet`
  on web through Metro's `.web.tsx` resolution; a text-summary fallback
  on native — no native map SDK added), `/dev/journey` developer test
  screen. See `architecture.md` §17. 25 backend + 20 mobile unit tests
  pass, all mocked (§18). Manually verified against the live OSRM demo
  server: a real Kolkata route returned `distanceKm: 12.7473`,
  `durationMinutes: 18.02`, and 370 route coordinates whose first/last
  points matched the requested start/destination. Invalid-coordinate and
  missing-parameter requests correctly returned 400. `npx expo export
--platform web` bundled successfully (858 modules, including the
  Leaflet CSS bundle and `/dev/journey`). The interactive
  destination-search → Get Route → map-renders flow was not click-tested
  in a running simulator/browser in this environment.
- **Phase 8 — Route Sampling + Journey Timeline** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  Pure, deterministic route sampling (`modules/journey`) — reduces a
  Phase 7 `Route`'s hundreds of coordinates to a small, distance-spaced
  set of `JourneyCheckpoint`s (Haversine cumulative distance, configurable
  interval capped at `MAX_CHECKPOINTS: 20`, always including start and
  destination, never forcing an interval onto a route shorter than it),
  then attaches a proportional estimated arrival time to each
  (`elapsed = distance/totalDistance × durationMinutes`, taking an
  explicit `departureTime` rather than reading the clock). No weather is
  fetched — see `architecture.md` §19. `POST /api/journey/plan`, shared
  `JourneyCheckpoint`/`JourneyPlan` models, mobile `journeyService`
  (backend-only), `useJourney()` extended with `planTimeline()`,
  `/dev/journey` extended with a Journey Timeline section (departure,
  duration, checkpoint count, per-checkpoint distance/ETA — no weather).
  62 backend + 8 mobile unit tests pass, all deterministic (§20).
  Manually verified against a real live Phase 7 OSRM route (370
  coordinates, 12.7473km/18.02min) reduced to 8 checkpoints ~1.8km apart
  with ETAs from 16:00:00.000Z to 16:18:01.200Z exactly matching route
  duration; an 800m test route correctly produced only 2 checkpoints; an
  invalid route correctly returned 400. `npx expo export --platform web`
  bundled successfully. The "Plan Timeline" button and checkpoint list
  were not click-tested in a running simulator/browser in this
  environment.
- **Phase 9 — Journey Weather Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 10 — Journey Risk Engine** — ⏳ NOT IMPLEMENTED
- **Phase 11 — Departure Time Optimization** — ⏳ NOT IMPLEMENTED
- **Phase 12 — AI Explanation Layer** — ⏳ NOT IMPLEMENTED
- **Phase 13 — Contextual Alerts** — ⏳ NOT IMPLEMENTED
- **Phase 14 — My Day / Activity Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 15 — Final UI/UX & Polish** — ⏳ NOT IMPLEMENTED

Do not assume any phase beyond Phase 8 is complete.
