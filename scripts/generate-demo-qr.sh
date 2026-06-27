#!/usr/bin/env bash
# Phase 19 — Generate jury QR code PNG for Slide 12
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/docs/demo/qr-production.png"
URL="${1:-https://community-hero-987477089222.asia-south1.run.app}"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$URL', safe=''))")

mkdir -p "$(dirname "$OUT")"

if command -v qrencode >/dev/null 2>&1; then
  qrencode -o "$OUT" -s 10 "$URL"
else
  curl -sf "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=$ENCODED" -o "$OUT"
fi

echo "✅ QR code saved: $OUT"
echo "   URL encoded: $URL"
echo "   Insert on Slide 12 per docs/demo/QR-CODE.md"
