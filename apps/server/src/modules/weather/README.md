# weather module

Phase 3 status: implemented. Owns weather domain logic — coordinate
validation (reusing `@cloud6/shared`'s `isValidGeoPoint`), caching
(`weather.cache.ts`), error normalization (`weather.errors.ts`), and the
`WeatherProvider` port (`weather.types.ts`) that
`integrations/weather/openmeteo` implements. `weather.service.ts` is the
only thing routes/other modules should depend on.

`WeatherService.getWeatherAt(point, timestamp)` exists so a future
Journey Engine can request weather for an arbitrary route point at an
arbitrary estimated-arrival time, without this phase building journey
logic itself.
