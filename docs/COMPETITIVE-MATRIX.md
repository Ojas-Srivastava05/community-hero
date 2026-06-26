# Competitive Feature Matrix (Appendix F)

Side-by-side comparison of Community Hero (CIVICPULSE AI) against leading civic-tech references. Use in Google Doc submission (Phase 18) and jury Q&A.

**Last updated:** Phase 0 — June 2026

---

## Feature matrix

| Feature | Swachhata | FixMyStreet | InfraGuard | Community Hero (CIVICPULSE AI) |
|---------|:---------:|:-----------:|:----------:|--------------------------------|
| Photo + GPS report | Yes | Yes | Yes | **Yes** + optional 15s video |
| AI vision classify | No | No | Yes | **Yes** (Gemini 2.5 Flash, structured JSON) |
| Community upvote | Yes | Yes | No | **Yes** + verification tiers (1 / 3 / 10) |
| Real-time map | Yes | Yes | Yes | **Yes** + severity clustering |
| Agentic workflow | No | No | Partial | **Yes** (6 agents + orchestrator) |
| Predictive hotspots | No | No | Yes | **Yes** (geohash-6 + Gemini narratives) |
| Gamification | No | No | No | **Yes** (ethical, opt-in leaderboard) |
| AI Studio deploy | No | No | No | **Yes** (Vibe2Ship requirement) |
| Open311 export | No | Yes | No | **Yes** (GeoReport v2 adapter) |
| SLA tracking | Partial | Yes | Yes | **Yes** (per-category matrix) |

---

## Competitor profiles

### Swachhata-MoHUA (Janaagraha)

- **Scale:** 4,041+ Indian cities; government-backed citizen reporting.
- **Strengths:** Photo + GPS + category + upvote + resolved image proof; push notifications on status change.
- **Weaknesses:** No Gemini vision triage, no agentic routing, no predictive prevention, limited transparency on AI-assisted triage.
- **Our edge:** Sub-3s AI classification, 6-agent automation, hotspot prediction, Open311 export.

### FixMyStreet (mySociety)

- **Scale:** Global gold standard; 595+ GitHub stars; v6.0 (Nov 2024).
- **Strengths:** Map-pin reporting, authority routing, Open311 compatibility, mature UX patterns.
- **Weaknesses:** Perl stack (reference only); no native AI vision; no gamification; no Google AI Studio path.
- **Our edge:** Gemini multimodal intake, realtime Firestore sync, ethical civic points, AI Studio one-click deploy.

### InfraGuard

- **Scale:** AI-native hackathon project; Gemini 1.5/2.5 Flash vision pipeline.
- **Strengths:** Issue type + severity + cost estimate + SLA deadline + hotspot analytics; ~3s analysis target.
- **Weaknesses:** Partial agentic design; no Swachhata-grade community verification tiers; no full municipal workflow demo.
- **Our edge:** Full agent orchestration, community verification tiers, thread clustering, gamification, production Cloud Run + docs parity with LogiFlow.

---

## LogiFlow vs CIVICPULSE AI (Appendix Q summary)

| Dimension | LogiFlow | CIVICPULSE AI |
|-----------|----------|---------------|
| Domain | Multi-modal logistics | Hyperlocal civic issues |
| AI depth | Gemini intent + explain | 6 agents + vision + embeddings + chat tools |
| Realtime | Supabase + Redis | Firestore live sync |
| Deploy | Vercel + Cloud Run | AI Studio Publish + Cloud Run |
| Hackathon | Solution Challenge 2026 | Vibe2Ship BlockseBlock 2026 |

---

## Winning formula (Section 18)

> Swachhata-grade community participation + InfraGuard-grade AI vision speed + CivicThreads-grade clustering + AI Studio one-click deploy + full Google stack documentation.

---

## Business impact claims (Section 34 — for submission narrative)

| Metric | Target | How we demonstrate |
|--------|--------|-------------------|
| Faster triage | ~80% vs manual categorization | Gemini pre-fills form; department auto-assigned |
| Fewer duplicates | ~40% reduction | Geohash + embedding dedup agent |
| AI classification accuracy | ~90% on demo images | Confidence gate + community verification |
