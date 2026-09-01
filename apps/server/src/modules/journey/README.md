# journey module

Phase 8 status: route sampling + journey timeline implemented. Pure,
deterministic logic — `journey.sampler.ts` reduces a Route's coordinates
to a small set of distance-spaced `JourneyCheckpoint`s (via
`journey.distance.ts`'s Haversine cumulative-distance calculation),
`journey.timeline.ts` attaches a proportional estimated arrival time to
each. `journey.service.ts` (`POST /api/journey/plan`) validates input and
composes the two.

Does NOT fetch weather, call Open-Meteo, or implement Journey Weather
Intelligence — that's a future phase that will call
`WeatherService.getWeatherAt(checkpoint.point, checkpoint.estimatedArrivalTime)`
per checkpoint using this module's output.
