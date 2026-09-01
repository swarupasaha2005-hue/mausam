# personalization module

Phase 4 status: implemented. Owns persona configuration
(`persona.config.ts`) and `UserContext` creation
(`personalization.service.ts`) — determining what weather factors matter
to a given persona. Does not fetch weather and does not generate
recommendations; a future `RecommendationService` will combine this
module's output with `modules/weather`'s output.
