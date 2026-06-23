# System Design

## Data model (Firestore)

- `users/{uid}` — profile, ward, opt-in leaderboard
- `issues/{id}` — reports with geo, severity, status timeline
- `health_checks/{id}` — Phase 1 connectivity tests

## Auth

Firebase Google Sign-In; rules enforce owner writes on `users`, authenticated creates on `issues`.

## API

See `api_contract.md`. Phase 1: `GET /api/health` only.
