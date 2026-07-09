# Submission screenshots (captured Jul 2026)

Mobile viewport **390×844** (iPhone 13). All captures from **production Cloud Run**:

`https://community-hero-987477089222.asia-south1.run.app`

Re-capture:

```bash
npm run screenshots
```

| File | Route | Content |
|------|-------|---------|
| `01-landing.png` | `/` | Hero + live issue counts (49 total) |
| `02-map.png` | `/map` | Google Maps + issue markers |
| `03-report.png` | `/report` | Report wizard step 1 (demo citizen signed in) |
| `04-dashboard.png` | `/dashboard` | KPI dashboard + hotspots |
| `05-leaderboard.png` | `/leaderboard` | Civic champions podium |
| `06-assistant.png` | `/assistant` | Civic AI chat (demo citizen) |
| `07-scorecards.png` | `/scorecards` | Department accountability grades |
| `08-login.png` | `/login` | Demo citizen / authority / guest / Google |
| `09-embed.png` | `/embed/map` | Embeddable map widget |

After each run, see `audit.json` for pass/fail per shot.
