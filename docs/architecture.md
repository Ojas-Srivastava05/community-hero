# Architecture

Community Hero is a monorepo: React PWA + Express API, backed by Firebase and Gemini.

## High-level

```
[React PWA] ──► [Express API] ──► [Firestore / Storage]
     │                │
     └─ Firebase Auth ┘
     └─ Gemini (Phase 2+) via server
```

## Agents (Phase 6+)

Triage, Dedup, Routing, SLA Monitor, Insight, WhatsApp Share — orchestrated server-side.

## References

- Master plan: `Community-Hero-Master-Plan.pdf`
- Phase plan: `Community-Hero-Phase-Development-Plan.pdf`
