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
intentionally not involved here.

Phase 10 status: Journey Risk + Actionable Intelligence implemented.
`journey.analysis.service.ts` (`POST /api/journey/intelligence`) takes an
existing `JourneyWeatherPlan` + `UserContext` and produces a
`JourneyIntelligence` (deterministic risk level, explainable reasons, and
a persona-flavored `JourneyRecommendation`) — no LLM, no new weather
fetching, no route/timeline recalculation. `journey.analysis.rules.ts`
reuses `modules/recommendations/recommendation.thresholds.ts` directly
rather than duplicating threshold values.
`journey.analysis.recommendation.ts` mirrors Phase 5's persona-template
pattern but is a separate, journey-scoped model
(`JourneyRecommendation`/`JourneyFactor`), since journey-level concepts
(weather deterioration, affected segment) don't exist at Phase 5's
single-moment scope.
