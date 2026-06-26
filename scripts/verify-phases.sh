#!/usr/bin/env bash
# Phase-by-phase verification against live Cloud Run URL
set -euo pipefail

URL="${1:-https://community-hero-987477089222.asia-south1.run.app}"
PASS=0
FAIL=0

check() {
  local phase="$1"
  local name="$2"
  local result="$3"
  if [ "$result" = "PASS" ]; then
    echo "✅ Phase $phase — $name"
    PASS=$((PASS + 1))
  else
    echo "❌ Phase $phase — $name — $result"
    FAIL=$((FAIL + 1))
  fi
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$1"
}

json_field() {
  curl -sf --max-time 30 "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d$2)"
}

echo "=== Community Hero Phase Verification ==="
echo "URL: $URL"
echo ""

# Phase 1 — scaffold + health
code=$(http_code "$URL/api/health")
[ "$code" = "200" ] && check "1" "API health endpoint" "PASS" || check "1" "API health endpoint" "HTTP $code"

fs=$(json_field "$URL/api/health" "['firestore']" 2>/dev/null || echo "error")
[ "$fs" = "connected" ] && check "1" "Firestore connected" "PASS" || check "1" "Firestore connected" "$fs"

# Phase 2 — reports API
issues_json=$(curl -sf --max-time 30 "$URL/api/reports?limit=50" || echo '{"issues":[]}')
count=$(echo "$issues_json" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('issues',[])))")
[ "${count:-0}" -ge 1 ] && check "2" "Issues in Firestore ($count)" "PASS" || check "2" "Issues in Firestore" "0 issues"

# Phase 3 — map + landing routes
for route in "/" "/map" "/report"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "3" "Route $route" "PASS" || check "3" "Route $route" "HTTP $code"
done

# Phase 4 — issue detail + my reports
issue_id=$(echo "$issues_json" | python3 -c "import sys,json; i=json.load(sys.stdin).get('issues',[]); print(i[0]['id'] if i else '')" 2>/dev/null || echo "")
if [ -n "$issue_id" ]; then
  code=$(http_code "$URL/issues/$issue_id")
  [ "$code" = "200" ] && check "4" "Issue detail page /issues/$issue_id" "PASS" || check "4" "Issue detail page" "HTTP $code"
  detail=$(http_code "$URL/api/reports/$issue_id")
  [ "$detail" = "200" ] && check "4" "GET /api/reports/:id" "PASS" || check "4" "GET /api/reports/:id" "HTTP $detail"
else
  check "4" "Issue detail" "no issues to test"
fi
code=$(http_code "$URL/my-reports")
[ "$code" = "200" ] && check "4" "My Reports route" "PASS" || check "4" "My Reports route" "HTTP $code"

# Phase 5 — upvote endpoint exists (401 without auth = expected)
code=$(http_code "$URL/api/reports/${issue_id:-x}/upvote" -X POST 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/reports/${issue_id:-x}/upvote")
# curl doesn't support -X in http_code helper - fix
upvote_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/reports/${issue_id:-test}/upvote")
[ "$upvote_code" = "401" ] || [ "$upvote_code" = "200" ] && check "5" "Upvote endpoint (auth-gated)" "PASS" || check "5" "Upvote endpoint" "HTTP $upvote_code"

# Phase 6 — agent metadata on issues
agents=$(json_field "$URL/api/reports?limit=1" "['issues'][0].get('departmentId','')" 2>/dev/null || echo "")
# simpler check
dept=$(curl -sf "$URL/api/reports?limit=1" | python3 -c "import sys,json; i=json.load(sys.stdin)['issues'][0]; print(i.get('departmentId','') or i.get('priorityScore',''))" 2>/dev/null || echo "")
[ -n "$dept" ] && check "6" "Agent routing metadata on issues" "PASS" || check "6" "Agent routing metadata" "missing"

# Phase 7 — admin route
code=$(http_code "$URL/admin")
[ "$code" = "200" ] && check "7" "Admin panel route" "PASS" || check "7" "Admin panel route" "HTTP $code"

# Phase 8 — dashboard + analytics
code=$(http_code "$URL/dashboard")
[ "$code" = "200" ] && check "8" "Dashboard route" "PASS" || check "8" "Dashboard route" "HTTP $code"
open=$(json_field "$URL/api/analytics/summary" "['open']" 2>/dev/null || echo -1)
[ "${open:-0}" -ge 0 ] 2>/dev/null && check "8" "Analytics summary API" "PASS" || check "8" "Analytics summary API" "failed"
code=$(http_code "$URL/api/analytics/trends")
[ "$code" = "200" ] && check "8" "GET /api/analytics/trends" "PASS" || check "8" "GET /api/analytics/trends" "HTTP $code"
code=$(http_code "$URL/api/departments")
[ "$code" = "200" ] && check "8" "GET /api/departments" "PASS" || check "8" "GET /api/departments" "HTTP $code"

# Phase 9 — hotspots
code=$(http_code "$URL/api/analytics/hotspots")
[ "$code" = "200" ] && check "9" "Hotspots API" "PASS" || check "9" "Hotspots API" "HTTP $code"

# Phase 10 — leaderboard
code=$(http_code "$URL/leaderboard")
[ "$code" = "200" ] && check "10" "Leaderboard route" "PASS" || check "10" "Leaderboard route" "HTTP $code"
code=$(http_code "$URL/api/leaderboard")
[ "$code" = "200" ] && check "10" "Leaderboard API" "PASS" || check "10" "Leaderboard API" "HTTP $code"

# Phase 11 — assistant
code=$(http_code "$URL/assistant")
[ "$code" = "200" ] && check "11" "Civic Assistant route" "PASS" || check "11" "Civic Assistant route" "HTTP $code"

# Phase 12 — Open311 export
code=$(http_code "$URL/api/analytics/export/open311")
[ "$code" = "200" ] && check "12" "Open311 export" "PASS" || check "12" "Open311 export" "HTTP $code"

# Phase 14 — key routes
for route in "/activity" "/profile" "/login" "/terms" "/privacy" "/admin/analytics"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "14" "Route $route" "PASS" || check "14" "Route $route" "HTTP $code"
done

# Phase 14 — threads route (SPA)
if [ -n "$issue_id" ]; then
  thread_id="thread-$(curl -sf "$URL/api/reports/$issue_id" | python3 -c "import sys,json; print(json.load(sys.stdin)['issue'].get('geohash','')[:5])" 2>/dev/null || echo 'test')"
  code=$(http_code "$URL/threads/$thread_id")
  [ "$code" = "200" ] && check "14" "Route /threads/:id" "PASS" || check "14" "Route /threads/:id" "HTTP $code"
fi

# Phase 3 — geo reverse API
code=$(http_code "$URL/api/geo/reverse?lat=12.97&lng=77.59")
[ "$code" = "200" ] && check "3" "Geo reverse API" "PASS" || check "3" "Geo reverse API" "HTTP $code"

# Phase 16 — deployment
[[ "$URL" == *".run.app"* ]] && check "16" "Cloud Run .run.app URL" "PASS" || check "16" "Cloud Run URL format" "wrong domain"

# Phase 17 — seed data count
[ "${count:-0}" -ge 20 ] && check "17" "Demo seed data ($count issues, target 25)" "PASS" || check "17" "Demo seed data ($count issues, target 25)" "need more seed data"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
