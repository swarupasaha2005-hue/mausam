# CLOUD6 API Contracts

Status: **Phase 4 — Personalization**. Only the endpoints below exist.
Future endpoints (location, journey, recommendations, alerts, users) will
be documented here as each module is implemented — they are
intentionally not speculated on yet.

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
