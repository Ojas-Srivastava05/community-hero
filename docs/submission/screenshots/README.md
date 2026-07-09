# Submission screenshots (captured Jul 2026)

Mobile viewport **390×844** (iPhone 13). Re-capture with:

```bash
# Terminal 1 — API with Firestore + demo auth
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json INCLUDE_DEMO_ANALYTICS=1 npm run dev --prefix server

# Terminal 2 — frontend
npm run dev --prefix frontend

# Terminal 3 — capture (hybrid prod + local)
npm run screenshots
```

| File | Source | Route | Content |
|------|--------|-------|---------|
| `01-landing.png` | **Production** | `/` | Hero + 49 issues / 40 open / 9 resolved |
| `02-map.png` | **Production** | `/map` | Bengaluru map tiles + issue markers |
| `03-report.png` | Local | `/report` | Report wizard step 1 + Hindi toggle |
| `04-dashboard.png` | **Production** | `/dashboard` | KPI dashboard (49 total, dept SLA) |
| `05-leaderboard.png` | **Production** | `/leaderboard` | Civic champions podium |
| `06-assistant.png` | Local | `/assistant` | Civic AI chat (demo citizen signed in) |
| `07-scorecards.png` | Local | `/scorecards` | 8 department accountability grades |
| `08-login.png` | Local | `/login` | Demo citizen / demo authority / Google |

## Audit notes (Jul 9)

**Previous issues fixed:**
- `02-map.png` showed Google Maps error (captured from local dev without working tiles).
- `01-landing.png` / `04-dashboard.png` showed only 1 issue (stale local analytics cache).
- `06-assistant.png` showed sign-in gate instead of chat UI.
- `07-scorecards.png` showed 1 department (missing `INCLUDE_DEMO_ANALYTICS=1`).

**Capture strategy:** Production for map + rich Firestore demo data; local for new finals UI (demo login, scorecards, Hindi).

See `audit.json` after each `npm run screenshots` run.
