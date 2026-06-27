# Open311 GeoReport v2 — Community Hero Interoperability

Community Hero exports civic issues in [Open311 GeoReport v2](https://wiki.open311.org/GeoReport_v2/) format so cities, civic tech platforms, and municipal CRMs can ingest reports without custom adapters.

## Overview

| Item | Value |
|------|-------|
| Standard | Open311 GeoReport v2 |
| Export format | JSON |
| Service catalog | `GET /api/departments` |
| Single issue export | `POST /api/reports/:id/open311/export` |
| Bulk export | `GET /api/analytics/export/open311` |

## Service code mapping (Appendix M)

Internal categories map to Open311 `service_code` values:

| Category | Service code | Department |
|----------|--------------|------------|
| `pothole` | 001 | Roads & Infrastructure |
| `road_damage` | 002 | Roads & Infrastructure |
| `water_leak` | 010 | Water Board |
| `drainage` | 011 | Stormwater |
| `streetlight` | 020 | Electrical |
| `waste` | 030 | Sanitation |
| `signage` | 040 | Traffic & Signage |
| `encroachment` | 050 | Enforcement |
| `other` | 099 | General Civic |

## Status mapping

| Community Hero status | Open311 `service_request_status` |
|-----------------------|----------------------------------|
| Draft, Submitted, Community Verified, Assigned, In Progress | `open` |
| Resolved, Closed | `closed` |

## Export record schema

Each exported issue becomes a GeoReport v2 service request:

```json
{
  "service_request_id": "<firestore-issue-id>",
  "service_code": "001",
  "service_name": "pothole",
  "service_request_status": "open",
  "description": "Large pothole on main road…",
  "lat": 12.9352,
  "long": 77.6245,
  "address_string": "Koramangala, Bengaluru",
  "requested_datetime": "2026-06-26T10:00:00.000Z",
  "updated_datetime": "2026-06-26T11:30:00.000Z",
  "media_url": "https://storage.googleapis.com/…/photo.jpg",
  "agency_responsible": "Roads & Infrastructure"
}
```

Implementation: `server/src/lib/open311.ts` → `toOpen311Record()`.

## Department service catalog

`GET /api/departments` returns Open311-compatible service definitions:

```json
{
  "services": [
    {
      "service_code": "001",
      "service_name": "pothole",
      "description": "Roads & Infrastructure — pothole",
      "metadata": {
        "category": "pothole",
        "department": "Roads & Infrastructure",
        "sla_hours": { "1": 168, "2": 120, "3": 96, "4": 72, "5": 48 }
      }
    }
  ]
}
```

## API usage

### Export single issue

```http
POST /api/reports/{issueId}/open311/export
Authorization: Bearer <firebase-id-token>
```

Response: JSON attachment with GeoReport v2 fields.

### Bulk export (analytics)

```http
GET /api/analytics/export/open311
x-admin-secret: <ADMIN_SECRET>
```

**Admin secret required** in production. Returns a JSON array of Open311 records for recent issues (max 100). Unauthenticated requests receive **403**.

## Field notes

- **`lat` / `long`**: WGS84 coordinates from device GPS at report time.
- **`media_url`**: First photo URL from Firebase Storage (if uploaded).
- **`agency_responsible`**: Routed department from the 6-agent pipeline.
- **`service_request_id`**: Firestore document ID (stable, globally unique within project).

## Validation checklist

- [ ] `service_code` matches Appendix M for each category
- [ ] `service_request_status` is only `open` or `closed`
- [ ] Coordinates are valid floats in WGS84
- [ ] Datetimes are ISO 8601 UTC strings
- [ ] Export requires authentication (no public PII leakage)

## Interoperability targets

Compatible with municipal systems that accept GeoReport v2 JSON, including:

- FixMyStreet-style backends
- Custom Open311 adapters (SeeClickFix, Cityworks patterns)
- Civic tech data pipelines and ward dashboards

## Related docs

- [API contract](../api_contract.md) — full REST specification
- [Architecture](../architecture.md) — agent routing and SLA matrix
- Appendix M in the master development plan PDF
