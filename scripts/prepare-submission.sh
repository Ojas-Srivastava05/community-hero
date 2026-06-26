#!/usr/bin/env bash
# Phase 18 — Prepare BlockseBlock submission package
# Tags v1.0.0-submission and prints the three mandatory URLs.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TAG="v1.0.0-submission"
DEPLOY_URL="https://community-hero-987477089222.asia-south1.run.app"
GITHUB_URL="https://github.com/Ojas-Srivastava05/community-hero"
GOOGLE_DOC_HINT="docs/submission/GOOGLE-DOC-CONTENT.md"

echo "=== Community Hero — Submission Preparation (Phase 18) ==="
echo ""

# Pre-flight checks
echo "→ Running phase verification against production..."
if bash scripts/verify-phases.sh "$DEPLOY_URL"; then
  echo "✅ Phase verification passed"
else
  echo "⚠️  Phase verification reported failures (see above). Continue only if acceptable for demo."
fi
echo ""

echo "→ Checking git working tree..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "⚠️  Uncommitted changes detected. Commit before tagging for a clean submission tag."
fi

echo "→ Creating annotated tag: $TAG"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ℹ️  Tag $TAG already exists — skipping create"
else
  git tag -a "$TAG" -m "Community Hero submission package — Vibe2Ship BlockseBlock 2026

Deployed: $DEPLOY_URL
GitHub: $GITHUB_URL
Google Doc: paste from $GOOGLE_DOC_HINT (public view link required)

Phases 18–19 documentation complete in-repo."
  echo "✅ Created tag $TAG"
fi

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  BLOCKSEBLOCK — THREE MANDATORY URLS"
echo "  Deadline: June 29, 2026, 2:00 PM"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "1. DEPLOYED APPLICATION LINK"
echo "   $DEPLOY_URL"
echo ""
echo "2. GITHUB REPOSITORY LINK"
echo "   $GITHUB_URL"
echo ""
echo "3. GOOGLE DOC LINK (anyone with link can view)"
echo "   → Copy content from: $GOOGLE_DOC_HINT"
echo "   → Paste into Google Docs, add screenshots, set public view"
echo "   → Paste the share URL here before Final Submit"
echo ""
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps (manual):"
echo "  • Push tag:  git push origin $TAG"
echo "  • BlockseBlock: Create Project → Community Hero → enter 3 links → Final Submit"
echo "  • Checklist:   docs/SUBMISSION-CHECKLIST.md"
echo "  • Demo script: docs/demo/APPENDIX-I-DEMO-SCRIPT.md"
echo ""
