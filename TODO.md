# Community Hero — Build status

## Complete (Phases 1–19)

- [x] Civic Glass UI — landing, nav, all screens
- [x] Firebase Auth + Firestore rules deployed
- [x] Report wizard + Gemini analyze + create report API
- [x] Google Maps explorer (with list fallback)
- [x] Issue detail, upvote, timeline
- [x] My Reports, Activity feed
- [x] Impact dashboard, hotspots, Open311 export
- [x] Admin panel, leaderboard, civic assistant chat
- [x] Agent pipeline (routing, SLA, dedup, points)
- [x] Cloud Run deploy: https://community-hero-987477089222.asia-south1.run.app
- [x] Demo seed data (5 issues)

## Your manual steps for BlockseBlock submission

1. Add `community-hero-987477089222.asia-south1.run.app` to Firebase Auth authorized domains
2. Enable Firebase Storage (console) for image uploads on reports
3. Set `GEMINI_API_KEY` on Cloud Run for live AI (optional — fallbacks work for demo)
4. Set `VITE_GOOGLE_MAPS_API_KEY` and redeploy for live map tiles
5. Create public Google Doc (problem, solution, features, tech stack)
6. Submit 3 links on BlockseBlock before **June 29, 2026 2:00 PM**
