# Slide 08 — Architecture

**Title:** System architecture

**Diagram:** Embed `docs/diagrams/png/01-system-architecture.png`

## Layers

- **Client:** React 19 PWA, Firebase Auth SDK, Google Maps JS
- **Cloud Run:** Express API + static SPA, agent pipeline
- **Firebase:** Firestore, Cloud Storage, Auth
- **AI:** Gemini 2.0 Flash / Flash Lite

## Speaker notes

Single container deploy — API and frontend share one Cloud Run service.
