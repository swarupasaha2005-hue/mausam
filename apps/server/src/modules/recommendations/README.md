# recommendations module

Phase 5 status: implemented. Deterministic, rule-based
`RecommendationService`/`generateRecommendations` — converts a
`CurrentWeather` + `UserContext` into a ranked `Recommendation[]`. Does
not fetch weather (`modules/weather`'s job) or build `UserContext`
(`modules/personalization`'s job), and does not call an LLM — that is a
future, separate AI Explanation Layer that will add natural-language
explanation on top of this structured output, not replace it.

Thresholds live in `recommendation.thresholds.ts`; persona-specific
copy lives in the `PERSONA_FACTOR_TEMPLATES` map in
`recommendation.rules.ts` — both are plain data, not branching logic, so
they're easy to tune.
