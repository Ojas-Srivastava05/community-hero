#!/usr/bin/env bash
# Production smoke test — run after deploy. Exit 1 on any critical failure.
set -euo pipefail

BASE="${PRODUCTION_URL:-https://community-hero-987477089222.asia-south1.run.app}"
FAIL=0

check() {
  local name="$1" url="$2" pattern="$3"
  local body code
  body=$(curl -sf -w "\n%{http_code}" "$url" 2>/dev/null || echo -e "\n000")
  code=$(echo "$body" | tail -1)
  body=$(echo "$body" | sed '$d')
  if [[ "$code" != "200" ]]; then
    echo "FAIL $name — HTTP $code ($url)"
    FAIL=1
    return
  fi
  if ! echo "$body" | grep -qE "$pattern"; then
    echo "FAIL $name — body missing pattern: $pattern"
    FAIL=1
    return
  fi
  echo "OK   $name"
}

check_post_json() {
  local name="$1" url="$2" data="$3" pattern="$4"
  local body code
  body=$(curl -sf -w "\n%{http_code}" -X POST "$url" \
    -H 'Content-Type: application/json' \
    -d "$data" 2>/dev/null || echo -e "\n000")
  code=$(echo "$body" | tail -1)
  body=$(echo "$body" | sed '$d')
  if [[ "$code" != "200" ]]; then
    echo "FAIL $name — HTTP $code ($url)"
    FAIL=1
    return
  fi
  if ! echo "$body" | grep -qE "$pattern"; then
    echo "FAIL $name — body missing pattern: $pattern"
    FAIL=1
    return
  fi
  echo "OK   $name"
}

echo "=== Community Hero production smoke ==="
echo "Base: $BASE"
echo ""

check "health" "$BASE/api/health" '"ok"|ok|healthy'
check "analytics summary" "$BASE/api/analytics/summary" '"total"'
check "analytics trends" "$BASE/api/analytics/trends" '"daily30"|"wardBreakdown"|"narrative"'
check "analytics hotspots" "$BASE/api/analytics/hotspots" '"hotspots"'
check "reports list" "$BASE/api/reports?limit=5" '"issues"'
check "departments" "$BASE/api/departments" '"services"'
check "demo status" "$BASE/api/auth/demo-status" '"enabled":true'
check_post_json "demo citizen token" "$BASE/api/auth/demo-token" '{"role":"citizen"}' '"token".*"role":"citizen"'
check_post_json "demo admin token" "$BASE/api/auth/demo-token" '{"role":"admin"}' '"token".*"role":"admin"'

# Intake regression: waste reports mentioning food must not be hard-blocked at keyword layer
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if (cd "$ROOT/server" && node --import tsx --test src/lib/agents/intake.test.ts >/dev/null 2>&1); then
  echo "OK   intake food-in-waste not blocked"
else
  echo "FAIL intake food-in-waste regression tests"
  FAIL=1
fi

check "SPA index" "$BASE/" '<div id="root"|Community Hero'
check "embed map" "$BASE/embed/map?lat=12.9716&lng=77.5946" '<div id="root"|Community Hero|map'
check "scorecards" "$BASE/scorecards" '<div id="root"|Community Hero|Scorecard'

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "All smoke checks passed."
else
  echo "Some checks FAILED."
  exit 1
fi
