# Pipeline 3 — Geo-location & Mapping

Geospatial enrichment, map visualization, and address resolution for Community Hero.

## Overview

| Concern | Implementation |
|---------|----------------|
| Device GPS | HTML5 Geolocation (`frontend/src/lib/geo.ts`) |
| Reverse geocode | Google Geocoding API + Firestore cache |
| Forward search | Google Places Autocomplete (client) |
| Map display | Google Maps JS + `@googlemaps/markerclusterer` |
| Issue storage | `lat`, `lng`, `geohash` (7), `address`, `wardId` |
| Spatial query | `GET /api/reports?lat=&lng=&radius_km=` |

## Reverse geocode — server

`server/src/lib/geo.ts` → `reverseGeocodeServer(lat, lng)`

### Flow

1. Check **`geocode_cache`** Firestore collection (TTL **24 hours**).
2. On miss, call Google Geocoding API with `GOOGLE_MAPS_API_KEY`.
3. Parse `formatted_address`, locality, city, derive `wardId`.
4. Write cache doc with `expiresAt` = now + 24h.
5. Fallback: coordinate string + geohash-based ward if API unavailable.

### Cache schema (`geocode_cache/{id}`)

| Field | Type | Description |
|-------|------|-------------|
| `lat`, `lng` | number | Query coordinates (5 decimal precision key) |
| `result` | object | `{ address, locality, city, wardId }` |
| `createdAt` | ISO string | Write time |
| `expiresAt` | ISO string | TTL expiry (24h) |

Doc ID: sanitized lat/lng pair, e.g. `28n61350_77n20900`.

### API

```
GET /api/geo/reverse?lat=28.6135&lng=77.2090
```

Response:

```json
{
  "address": "Rajpath, New Delhi, Delhi, India",
  "locality": "Rajpath",
  "city": "New Delhi",
  "wardId": "Rajpath",
  "lat": 28.6135,
  "lng": 77.2090
}
```

Route: `server/src/routes/geo.ts`.

## Client geolocation

`frontend/src/lib/location.tsx` — `LocationProvider`:

1. `navigator.geolocation.getCurrentPosition()` (high accuracy, 15 s timeout).
2. Reverse geocode via client Maps key or OpenStreetMap Nominatim fallback.
3. Exposes `{ lat, lng, address, label }` to Report Wizard and Map Explorer.

## Places Autocomplete

`frontend/src/components/civic/PlacesAutocomplete.tsx`:

- Uses `@react-google-maps/api` `Autocomplete` with `places` library.
- Loaded once via `GoogleMapsProvider` (`useJsApiLoader`).
- Used in:
  - **Report Wizard** step 2 — address field when GPS weak.
  - **Map Explorer** — search bar pans map to selected place.

On place select → updates `lat`, `lng`, `address` without extra server round-trip.

## Map components

### CivicMap (`frontend/src/components/civic/CivicMap.tsx`)

| Feature | Detail |
|---------|--------|
| Marker clustering | `@googlemaps/markerclusterer` v2 |
| Severity colors | 5=red, 4=orange, 3=yellow, 2=light, 1=green |
| Selection | Dims non-selected markers |
| Pin drop | `onMapClick` + `pinPosition` for draft reports |
| Fallback | `MapMock` when no Maps API key |

### Map Explorer (`/map`)

- Live issues via `useLiveIssues` hook.
- Filters: all, critical (sev≥5), high (sev≥4), resolved.
- Text search on title/address + Places Autocomplete for pan.
- Bottom sheet preview card → `/issues/:id`.

## Geohash & spatial queries

On report create (`server/src/routes/reports.ts`):

```typescript
geohash = ngeohash.encode(lat, lng, 7)  // ~150m precision
```

List query with `lat`, `lng`, `radius_km`:

- Fetches candidates, filters with `haversineKm()` in `server/src/lib/geo.ts`.
- Public issues only (excludes `Draft`, `needs_review`).

## Ward attribution

`deriveWardId(address, lat, lng)`:

1. First segment of comma-separated address (sub-locality).
2. Fallback: `area-{geohash-5}`.

Used for dashboard ward breakdown and hotspot filtering (Phase 9).

## Manual pin drop (Section 20.3)

When GPS unavailable or inaccurate:

1. User taps map on Report Wizard confirm step.
2. `handleMapPin` sets coordinates + calls `apiReverseGeocode`.
3. Orange pin marker with `pinAdjusted` chip label.

## Environment

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend | Maps tiles, Places, client geocode |
| `GOOGLE_MAPS_API_KEY` | Server | Reverse geocode API |

Restrict keys to production Cloud Run URL + `localhost` in Google Cloud Console.

## Performance (Section 25)

- **L1**: Request-scoped geocode (same request, same coords).
- **L4**: Firestore `geocode_cache` 24h TTL (this pipeline).
- Parallel `Promise.all` upload + geocode on report submit (Phase 13).

## Verification checklist (Phase 3 DoD)

- [ ] Map loads on mobile Safari/Chrome over HTTPS
- [ ] 10+ test issues visible with severity-colored clustered markers
- [ ] Filters hide/show categories correctly
- [ ] Geocode returns sensible address for test coordinates
- [ ] Cache hit on repeated reverse geocode within 24h
- [ ] Places Autocomplete pans map / sets report address
- [ ] Manual pin drop updates lat/lng and address
- [ ] Empty map state: "Be the first reporter" (Landing/Map)
