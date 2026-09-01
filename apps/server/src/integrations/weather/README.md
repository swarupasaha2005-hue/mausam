# weather integration

Phase 3 status: implemented for Open-Meteo (`openmeteo/`). Talks to the
external provider and translates its response into CLOUD6's normalized
weather models — nothing outside `openmeteo.mapper.ts` should see a raw
Open-Meteo response shape. `modules/weather` depends on the
`WeatherProvider` interface it implements, not on this package directly,
so a different provider could be swapped in later without touching the
module.
