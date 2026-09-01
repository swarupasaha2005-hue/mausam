# CLOUD6 API Contracts

Status: **Phase 9 — Journey Weather Intelligence**. Only the endpoints
below exist. Future endpoints (alerts, users) will be documented here as
each module is implemented — they are intentionally not speculated on
yet.

## `GET /health`

Verifies the backend process is running. No auth, no request body.

**Request**

```
GET /health
```

**Response — 200 OK**

```json
{
  "status": "ok",
  "service": "cloud6-server"
}
```

## Weather

All weather endpoints return CLOUD6's normalized weather models — never a
raw Open-Meteo response. Units: temperature in °C, wind in km/h,
precipitation in mm, humidity in %, visibility in km, UV as a numeric
index. See `architecture.md` §9 for how normalization works.

Common error response shape (all weather endpoints):

```json
{
  "error": {
    "code": "WEATHER_INVALID_COORDINATES",
    "message": "latitude and longitude are required"
  }
}
```

`code` is one of `WEATHER_INVALID_COORDINATES` (400),
`WEATHER_RATE_LIMITED` (429), `WEATHER_TIMEOUT` (504),
`WEATHER_PROVIDER_ERROR` / `WEATHER_REQUEST_FAILED` /
`WEATHER_INVALID_RESPONSE` (502).

### `GET /api/weather/current`

**Query parameters**

| name        | required | notes       |
| ----------- | -------- | ----------- |
| `latitude`  | yes      | -90 to 90   |
| `longitude` | yes      | -180 to 180 |

**Request**

```
GET /api/weather/current?latitude=22.5726&longitude=88.3639
```

**Response — 200 OK**

```json
{
  "location": { "latitude": 22.5726, "longitude": 88.3639 },
  "current": {
    "temperature": 31.2,
    "feelsLike": 35.1,
    "humidity": 78,
    "precipitation": 0,
    "rainProbability": 25,
    "windSpeed": 14.4,
    "windDirection": 180,
    "uvIndex": 7,
    "visibility": 24,
    "weatherCode": "partly_cloudy",
    "timestamp": "2026-09-01T12:00"
  }
}
```

**Response — 400 Bad Request** for missing/invalid coordinates.

### `GET /api/weather/hourly`

**Query parameters**

| name        | required | notes                |
| ----------- | -------- | -------------------- |
| `latitude`  | yes      | -90 to 90            |
| `longitude` | yes      | -180 to 180          |
| `hours`     | no       | 1–48, defaults to 24 |

**Response — 200 OK**

```json
{
  "location": { "latitude": 22.5726, "longitude": 88.3639 },
  "hourly": [
    {
      "timestamp": "2026-09-01T11:00",
      "temperature": 30.1,
      "precipitation": 0,
      "precipitationProbability": 10,
      "rainProbability": 10,
      "humidity": 80,
      "windSpeed": 13.1,
      "uvIndex": 5,
      "weatherCode": "partly_cloudy"
    }
  ]
}
```

### `GET /api/weather/daily`

**Query parameters**

| name        | required | notes               |
| ----------- | -------- | ------------------- |
| `latitude`  | yes      | -90 to 90           |
| `longitude` | yes      | -180 to 180         |
| `days`      | no       | 1–14, defaults to 7 |

**Response — 200 OK**

```json
{
  "location": { "latitude": 22.5726, "longitude": 88.3639 },
  "daily": [
    {
      "date": "2026-09-01",
      "minTemperature": 26.0,
      "maxTemperature": 33.5,
      "precipitationProbability": 40,
      "precipitation": 2.1,
      "sunrise": "2026-09-01T05:32",
      "sunset": "2026-09-01T18:12",
      "weatherCode": "partly_cloudy"
    }
  ]
}
```

### Not exposed via HTTP this phase

`WeatherService.getAirQuality()` and `WeatherService.getWeatherAt()` are
implemented and unit-tested (and `getAirQuality` was verified against the
live Open-Meteo air-quality API — see `architecture.md` §9), but have no
HTTP route yet since nothing currently consumes one. Add a route when a
real feature needs air quality or point-in-time weather over HTTP.

## Personalization

### `POST /api/personalization/context`

Creates a normalized `UserContext` from a persona (and optional
preferences). Does not fetch weather and does not return
recommendations — see `architecture.md` §11.

**Request body**

```json
{
  "persona": "runner",
  "preferredTimeOfDay": "morning"
}
```

| field                | required | notes                                                                                                  |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `persona`            | yes      | one of `runner`, `commuter`, `parent`, `agriculture`, `traveler`, `health`, `outdoor`, `event_planner` |
| `preferredTimeOfDay` | no       | one of `morning`, `afternoon`, `evening`, `night`, `flexible`; defaults to `flexible`                  |
| `activities`         | no       | array of activity strings; defaults to the persona's configured activities                             |

**Response — 200 OK**

```json
{
  "persona": "runner",
  "activities": ["running"],
  "preferredTimeOfDay": "morning",
  "weatherPriorities": [
    "temperature",
    "feels_like",
    "humidity",
    "precipitation",
    "rain_probability",
    "wind",
    "uv"
  ]
}
```

**Response — 400 Bad Request**

```json
{ "error": { "code": "PERSONA_INVALID", "message": "Unknown persona: astronaut" } }
```

`code` is one of `PERSONA_INVALID`, `TIME_INVALID`, `ACTIVITY_INVALID`.

## Recommendations

### `POST /api/recommendations`

Deterministic, rule-based recommendations from a `UserContext` +
`CurrentWeather` — no weather fetching happens inside this endpoint (pass
in weather already fetched via `/api/weather/current`) and no AI/LLM is
involved. See `architecture.md` §13.

**Request body**

```json
{
  "context": {
    "persona": "runner",
    "activities": ["running"],
    "preferredTimeOfDay": "morning",
    "weatherPriorities": [
      "temperature",
      "feels_like",
      "humidity",
      "precipitation",
      "rain_probability",
      "wind",
      "uv"
    ]
  },
  "weather": {
    "temperature": 34,
    "feelsLike": 38,
    "humidity": 85,
    "precipitation": 8,
    "rainProbability": 85,
    "windSpeed": 15,
    "windDirection": 180,
    "uvIndex": 9,
    "visibility": 8,
    "weatherCode": "rain",
    "timestamp": "2026-09-01T12:00"
  }
}
```

`context` is normally the output of `POST /api/personalization/context`;
`weather` is normally the `current` object from
`GET /api/weather/current`.

**Response — 200 OK**

```json
{
  "primaryRecommendation": {
    "type": "RESCHEDULE",
    "priority": "high",
    "title": "Rain likely during your run",
    "message": "Rain is likely during your planned activity.",
    "action": "Consider rescheduling your run.",
    "reasons": ["VERY_HIGH_RAIN_PROBABILITY"]
  },
  "recommendations": [
    { "type": "RESCHEDULE", "priority": "high", "...": "..." },
    { "type": "CAUTION", "priority": "medium", "...": "..." }
  ],
  "evaluatedFactors": [
    "HIGH_TEMPERATURE",
    "HIGH_FEELS_LIKE",
    "HIGH_HUMIDITY",
    "HIGH_UV",
    "VERY_HIGH_RAIN_PROBABILITY"
  ]
}
```

`recommendations` is sorted by priority (`severe` > `high` > `medium` >
`low`); `primaryRecommendation` is `recommendations[0]` (or `null` if
somehow empty, which shouldn't happen — a `FAVORABLE` result is always
produced when no risk factors are relevant).

**Response — 400 Bad Request**

```json
{ "error": { "code": "RECOMMENDATION_INVALID_CONTEXT", "message": "Unknown persona: astronaut" } }
```

`code` is one of `RECOMMENDATION_INVALID_CONTEXT`,
`RECOMMENDATION_INVALID_WEATHER`.

## Routes

### `GET /api/routes`

Returns a normalized driving route between two points — geographic data
only (distance, duration, polyline coordinates). No weather or
recommendation information. See `architecture.md` §17.

**Query parameters**

| name                   | required | notes       |
| ---------------------- | -------- | ----------- |
| `startLatitude`        | yes      | -90 to 90   |
| `startLongitude`       | yes      | -180 to 180 |
| `destinationLatitude`  | yes      | -90 to 90   |
| `destinationLongitude` | yes      | -180 to 180 |

**Request**

```
GET /api/routes?startLatitude=22.5726&startLongitude=88.3639&destinationLatitude=22.5958&destinationLongitude=88.4497
```

**Response — 200 OK**

```json
{
  "start": { "latitude": 22.5726, "longitude": 88.3639 },
  "destination": { "latitude": 22.5958, "longitude": 88.4497 },
  "distanceKm": 12.7473,
  "durationMinutes": 18.02,
  "coordinates": [
    { "latitude": 22.57285, "longitude": 88.364023 },
    { "latitude": 22.572927, "longitude": 88.363855 }
  ]
}
```

`coordinates` is the full route polyline (hundreds of points for a
real route), not just start/end — see `architecture.md` §17 for why
that matters for the future Journey Weather Engine.

**Response — 400 Bad Request** for missing/invalid coordinates.

**Response — 404 Not Found** when no route exists between the points
(`ROUTE_NOT_FOUND`).

```json
{ "error": { "code": "ROUTE_INVALID_COORDINATES", "message": "..." } }
```

`code` is one of `ROUTE_INVALID_COORDINATES` (400), `ROUTE_NOT_FOUND`
(404), `ROUTE_TIMEOUT` (504), `ROUTE_PROVIDER_ERROR` /
`ROUTE_REQUEST_FAILED` / `ROUTE_INVALID_RESPONSE` (502).

## Journey

### `POST /api/journey/plan`

Reduces a `Route` (Phase 7) to a small set of distance-spaced,
timestamped checkpoints. Purely geographic/time — does **not** fetch
weather. See `architecture.md` §19.

**Request body**

```json
{
  "route": {
    "start": { "latitude": 22.5726, "longitude": 88.3639 },
    "destination": { "latitude": 22.5958, "longitude": 88.4497 },
    "distanceKm": 12.7473,
    "durationMinutes": 18.02,
    "coordinates": [{ "latitude": 22.5726, "longitude": 88.3639 }]
  },
  "departureTime": "2026-09-01T16:00:00.000Z",
  "options": { "intervalKm": 2, "maxCheckpoints": 20 }
}
```

| field                    | required | notes                                         |
| ------------------------ | -------- | --------------------------------------------- |
| `route`                  | yes      | normally the output of `GET /api/routes`      |
| `departureTime`          | no       | ISO 8601 string; defaults to the current time |
| `options.intervalKm`     | no       | defaults to 2                                 |
| `options.maxCheckpoints` | no       | defaults to 20                                |

**Response — 200 OK**

```json
{
  "route": { "...": "..." },
  "departureTime": "2026-09-01T16:00:00.000Z",
  "estimatedArrivalTime": "2026-09-01T16:18:01.200Z",
  "durationMinutes": 18.02,
  "checkpoints": [
    {
      "sequence": 1,
      "point": { "latitude": 22.5726, "longitude": 88.3639 },
      "distanceFromStartKm": 0,
      "estimatedArrivalTime": "2026-09-01T16:00:00.000Z"
    },
    {
      "sequence": 2,
      "point": { "latitude": 22.5808, "longitude": 88.3945 },
      "distanceFromStartKm": 1.82,
      "estimatedArrivalTime": "2026-09-01T16:02:34.457Z"
    }
  ]
}
```

`estimatedArrivalTime` on each checkpoint is a proportional estimate
based on route distance and the provider-estimated route duration — not
live navigation, and not adjusted for traffic.

**Response — 400 Bad Request**

```json
{ "error": { "code": "JOURNEY_INVALID_ROUTE", "message": "Invalid route.start" } }
```

`code` is one of `JOURNEY_INVALID_ROUTE`, `JOURNEY_INVALID_DEPARTURE_TIME`,
`JOURNEY_INVALID_OPTIONS`.

### `POST /api/journey/weather`

Enriches an existing `JourneyPlan`'s checkpoints with weather at each
checkpoint's location and estimated arrival time. Does not call the
routing provider, does not resample the route, and does not recalculate
the timeline — pass in the `JourneyPlan` already produced by
`POST /api/journey/plan`. See `architecture.md` §21.

**Request body**

```json
{
  "journeyPlan": {
    "route": { "...": "..." },
    "departureTime": "2026-09-01T16:00:00.000Z",
    "estimatedArrivalTime": "2026-09-01T16:18:01.200Z",
    "durationMinutes": 18.02,
    "checkpoints": [
      {
        "sequence": 1,
        "point": { "latitude": 22.5726, "longitude": 88.3639 },
        "distanceFromStartKm": 0,
        "estimatedArrivalTime": "2026-09-01T16:00:00.000Z"
      }
    ]
  }
}
```

**Response — 200 OK**

```json
{
  "route": { "...": "..." },
  "departureTime": "2026-09-01T16:00:00.000Z",
  "estimatedArrivalTime": "2026-09-01T16:18:01.200Z",
  "durationMinutes": 18.02,
  "checkpoints": [
    {
      "sequence": 1,
      "point": { "latitude": 22.5726, "longitude": 88.3639 },
      "distanceFromStartKm": 0,
      "estimatedArrivalTime": "2026-09-01T16:00:00.000Z",
      "weather": {
        "timestamp": "2026-09-01T16:00:00.000Z",
        "temperature": 26.6,
        "precipitation": 0.4,
        "precipitationProbability": 78,
        "rainProbability": 78,
        "humidity": 93,
        "windSpeed": 12,
        "uvIndex": 0,
        "weatherCode": "drizzle"
      }
    },
    {
      "sequence": 6,
      "point": { "latitude": 22.5808, "longitude": 88.4197 },
      "distanceFromStartKm": 9.11,
      "estimatedArrivalTime": "2026-09-01T16:13:02.000Z",
      "weather": null,
      "weatherError": { "code": "WEATHER_TIMEOUT", "message": "Open-Meteo request timed out" }
    }
  ],
  "summary": {
    "weatherAvailableCheckpoints": 5,
    "weatherUnavailableCheckpoints": 3,
    "rainAffectedCheckpointCount": 5,
    "firstRainCheckpointSequence": 1,
    "transitions": []
  }
}
```

A checkpoint whose weather lookup failed is never dropped — it keeps its
`sequence`/`point`/`distanceFromStartKm`/`estimatedArrivalTime`, with
`weather: null` and a `weatherError` instead. This is real behavior
observed under live load, not a hypothetical — see `architecture.md`
§22.

**Response — 400 Bad Request**

```json
{
  "error": {
    "code": "JOURNEY_INVALID_ROUTE",
    "message": "journeyPlan.checkpoints must be a non-empty array"
  }
}
```

`code` is one of `JOURNEY_INVALID_ROUTE`, `JOURNEY_INVALID_DEPARTURE_TIME`.
