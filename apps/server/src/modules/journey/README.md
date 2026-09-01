# journey module

Phase 8 status: route sampling + journey timeline implemented. Pure,
deterministic logic — `journey.sampler.ts` reduces a Route's coordinates
to a small set of distance-spaced `JourneyCheckpoint`s (via
`journey.distance.ts`'s Haversine cumulative-distance calculation),
`journey.timeline.ts` attaches a proportional estimated arrival time to
each. `journey.service.ts` (`POST /api/journey/plan`) validates input and
composes the two.

Phase 9 status: Journey Weather Intelligence implemented.
`journey.weather.service.ts` (`POST /api/journey/weather`) enriches an
existing `JourneyPlan`'s checkpoints with weather via the existing
`WeatherService.getWeatherAt(point, estimatedArrivalTime)` — it does not
call Open-Meteo directly, does not resample the route, and does not
recalculate the timeline (Phase 8 already did that). A per-checkpoint
weather failure is preserved as `weather: null` +
`weatherError`, never silently dropped.
`journey.weather.summary.ts` derives a simple
`weatherAvailableCheckpoints`/`rainAffectedCheckpointCount`/`transitions`
overview — no risk scoring, no recommendations. Persona/UserContext is
intentionally not involved here (a future phase).
