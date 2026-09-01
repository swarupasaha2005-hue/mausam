# location module

Phase 2 status: minimal — `location.types.ts` and `location.service.ts`
provide shared coordinate validation for future weather/journey modules.

Location acquisition happens on the mobile device (see
`apps/mobile/src/services/location/`). No backend endpoint exists yet
because nothing consumes one: the mobile app doesn't currently send
coordinates anywhere. Add one when a real feature (e.g. saved locations,
server-side weather lookups) needs the backend to receive them.
