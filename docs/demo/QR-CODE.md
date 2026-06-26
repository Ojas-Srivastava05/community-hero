# QR Code — Jury Demo Slide

Use this URL on **Slide 12** (Live Demo) so judges can open the app on their phones.

---

## Production URL

```
https://community-hero-987477089222.asia-south1.run.app
```

---

## Generate QR code

### Option A — Google Chrome

1. Open the production URL in Chrome
2. Click the **Share** icon in the address bar (or right-click page → **Create QR Code**)
3. Download PNG
4. Insert into Google Slides on Slide 12

### Option B — CLI (qrencode)

```bash
# macOS: brew install qrencode
qrencode -o docs/demo/qr-production.png -s 10 \
  'https://community-hero-987477089222.asia-south1.run.app'
```

### Option C — Online (no install)

1. Visit https://goqr.me/ or Google Charts QR API
2. Paste production URL
3. Download PNG → save as `docs/demo/qr-production.png`

---

## Slide placement

| Property | Value |
|----------|-------|
| Slide | 12 — Live Demo |
| Position | Bottom-right, min 2×2 cm print size |
| Label | "Scan to open live app" |
| Backup text | Full URL printed below QR for manual entry |

---

## Backup URL (optional second QR)

```
https://community-hero-eight.vercel.app
```

Use only if Cloud Run is unavailable during presentation.

---

## Verification

Before jury session:

- [ ] Scan QR with phone camera → lands on landing page
- [ ] HTTPS certificate valid (no browser warning)
- [ ] Page loads within 5 seconds (cold start acceptable once)

---

## Related

- [`APPENDIX-I-DEMO-SCRIPT.md`](APPENDIX-I-DEMO-SCRIPT.md)
- [`../ppt-info/SLIDES-COMPLETE.md`](../ppt-info/SLIDES-COMPLETE.md) — Slide 12
- [`REHEARSAL-CHECKLIST.md`](REHEARSAL-CHECKLIST.md)
