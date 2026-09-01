# routing module

Phase 7 status: implemented. Owns coordinate validation (reusing
`@cloud6/shared`'s `isValidGeoPoint`) and error normalization for the
`RoutingProvider` port (`routing.types.ts`) that
`integrations/routing/osrm` implements. `routing.service.ts` is the only
thing routes/other modules should depend on.

Preserves `route.coordinates` and `route.durationMinutes` specifically so
a future Journey Weather Engine can sample route points and query
`WeatherService.getWeatherAt()` — that sampling/ETA logic is not
implemented here.
