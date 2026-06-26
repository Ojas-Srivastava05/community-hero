#!/usr/bin/env bash
# Render all Mermaid diagrams to PNG for docs/README and Google Doc embeds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MMD_DIR="${ROOT}/docs/diagrams/mermaid"
PNG_DIR="${ROOT}/docs/diagrams/png"

mkdir -p "${PNG_DIR}"

if command -v npx >/dev/null 2>&1; then
  echo "Rendering diagrams with @mermaid-js/mermaid-cli..."
    for mmd in "${MMD_DIR}"/*.mmd; do
    base="$(basename "${mmd}" .mmd)"
    if npx -y @mermaid-js/mermaid-cli@latest \
      -i "${mmd}" \
      -o "${PNG_DIR}/${base}.png" \
      -b transparent \
      -w 1200 \
      -H 800 2>/dev/null; then
      echo "  ✓ ${base}.png"
    else
      echo "  ✗ ${base}.png — render failed (fix .mmd syntax or use mermaid.live)"
    fi
  done
  echo ""
  echo "Done — $(ls -1 "${PNG_DIR}"/*.png 2>/dev/null | wc -l | tr -d ' ') PNG(s) in docs/diagrams/png/"
else
  cat <<'MANUAL'
npx not found. Install Node.js, then run manually:

  npx @mermaid-js/mermaid-cli -i docs/diagrams/mermaid/01-system-architecture.mmd -o docs/diagrams/png/01-system-architecture.png

Or render all:

  for f in docs/diagrams/mermaid/*.mmd; do
    base=$(basename "$f" .mmd)
    npx @mermaid-js/mermaid-cli -i "$f" -o "docs/diagrams/png/${base}.png"
  done

Alternative: paste .mmd content into https://mermaid.live and export PNG.
MANUAL
  exit 1
fi
