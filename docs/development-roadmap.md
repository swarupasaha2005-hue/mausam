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
- **Phase 9 — Journey Weather Intelligence** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  CLOUD6's core differentiator: enriches Phase 8 journey checkpoints with
  weather via the existing `WeatherService.getWeatherAt(point, ETA)` —
  no new weather logic, no Open-Meteo calls from the journey module, no
  route resampling/timeline recalculation. `JourneyWeatherService`
  (`modules/journey`) queries weather only at sampled checkpoints (8 for
  a 370-coordinate route, not 370), concurrently via `Promise.all` with
  per-checkpoint error isolation so one failure never drops a checkpoint
  or discards the plan. `POST /api/journey/weather`, shared
  `JourneyWeatherCheckpoint`/`JourneyWeatherPlan`/`JourneyWeatherSummary`/
  `JourneyWeatherTransition` models (reusing the existing `HourlyWeather`
  for checkpoint weather — no duplicate weather model), mobile
  `journeyService.getJourneyWeather()`, `useJourney()` extended with
  `analyzeWeather()`, `/dev/journey` extended with a Journey Weather
  section (per-checkpoint condition/temp/rain probability or
  "unavailable", plus a summary with rain-affected count and detected
  weatherCode transitions). No recommendations, no risk scores, no AI —
  see `architecture.md` §21. 40 backend + 9 mobile unit tests pass, all
  deterministic (§22). **Live-verified with the actual claim of this
  phase, not just mocks**: a real 370-coordinate OSRM route → 8-checkpoint
  `JourneyPlan` → `JourneyWeatherPlan` returned real, distinct Open-Meteo
  data per checkpoint (rain probability dropping 78%→51% as location/ETA
  changed along the route); under live request load 3 of 8 checkpoints
  hit `WEATHER_TIMEOUT` while 5 succeeded, and the response correctly
  preserved all 8 checkpoints with the 3 failed ones marked
  `weather: null` + `weatherError` rather than being dropped — this
  exercised the partial-failure design for real. A ~848m short journey
  was also planned and weather-enriched end-to-end (2 checkpoints, both
  with real weather). An invalid journey plan correctly returned 400.
  `npx expo export --platform web` bundled successfully. "Analyze
  Journey Weather" and the resulting display were not click-tested in a
  running simulator/browser in this environment.
- **Phase 10 — Journey Risk + Actionable Intelligence** — ✅ IMPLEMENTED, UNIT-TESTED, LIVE-VERIFIED — ⏳ mobile UI click-testing pending
  Deterministic, rule-based journey-level risk analysis
  (`modules/journey/journey.analysis*`) built on top of Phase 9's
  `JourneyWeatherPlan` — never refetches weather, never resamples the
  route, never recalculates the timeline. `evaluateCheckpointFactors()`
  reuses Phase 5's `THRESHOLDS`/`SEVERE_WEATHER_CODES` (not duplicated);
  `analyzeJourney()` derives per-checkpoint and journey-level
  (`WEATHER_DETERIORATION`, `SEVERE_WEATHER_NEAR_DESTINATION`,
  `FAVORABLE_JOURNEY`) factors, filters them by persona relevance via
  `context.weatherPriorities` (same pattern as Phase 5), and produces a
  `JourneyAnalysis` (risk level, primary concern, affected segment,
  confidence, human-readable reasons). `buildJourneyRecommendation()`
  mirrors Phase 5's persona-flavored-template pattern
  (`PERSONA_FACTOR_TEMPLATES`/`GENERIC_FACTOR_TEMPLATES`) to produce a
  `JourneyRecommendation`. Missing weather at a checkpoint is never
  treated as bad weather; if no checkpoint has weather at all, the result
  says so honestly instead of fabricating a risk level. `POST
/api/journey/intelligence`, shared `JourneyFactor`/`JourneyAnalysis`/
  `JourneyRecommendation`/`JourneyIntelligence` models (reusing
  `RecommendationType`/`RecommendationPriority` rather than duplicating
  them), mobile `journeyService.getJourneyIntelligence()`, `useJourney()`
  extended with `analyzeJourney()`/`setPersona()`/`setPreferredTimeOfDay()`
  (persona changes never refetch location/route/weather — only
  re-runs analysis against the already-fetched `JourneyWeatherPlan`),
  `/dev/journey` extended with a Persona picker and a Journey Intelligence
  section (risk, primary concern, affected area, reasons, recommendation).
  See `architecture.md` §23. Backend and mobile unit tests pass,
  deterministic (§24). **Live-verified**: a real 370-coordinate OSRM
  route → 8-checkpoint `JourneyPlan` → `JourneyWeatherPlan` (5 of 8
  checkpoints with real weather, 3 timed out — matching Phase 9's known
  rate-limit behavior) was run through `POST /api/journey/intelligence`
  twice with real `UserContext` objects for `runner` and `commuter`: both
  produced identical `riskLevel`/`factors`/`affectedCheckpointSequences`
  but different `recommendation.title`/`recommendation.action` text —
  confirming "objective weather, subjective interpretation" live, not just
  in mocks. Missing weather at 3 checkpoints was correctly never treated
  as bad weather (`confidence: 'medium'`, no fabricated factors). An
  invalid journey plan and an invalid persona both correctly returned 400.
  `npx expo export --platform web` bundled successfully. Departure-time
  optimization was explicitly **not implemented** (left as an honest
  scope limit — see `architecture.md` §23) rather than faked. The
  Persona picker and Journey Intelligence section were not click-tested in
  a running simulator/browser in this environment.
- **Phase 11 — Departure Time Optimization** — ⏳ NOT IMPLEMENTED
- **Phase 12 — AI Explanation Layer** — ⏳ NOT IMPLEMENTED
- **Phase 13 — Contextual Alerts** — ⏳ NOT IMPLEMENTED
- **Phase 14 — My Day / Activity Intelligence** — ⏳ NOT IMPLEMENTED
- **Phase 15 — Final UI/UX & Polish** — ⏳ NOT IMPLEMENTED

Do not assume any phase beyond Phase 10 is complete.
