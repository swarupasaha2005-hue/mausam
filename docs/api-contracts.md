# CLOUD6 API Contracts

Status: **Phase 1 — Foundation**. Only the endpoint below exists. Future
endpoints (weather, location, journey, personalization, recommendations,
alerts, users) will be documented here as each module is implemented —
they are intentionally not speculated on yet.

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
