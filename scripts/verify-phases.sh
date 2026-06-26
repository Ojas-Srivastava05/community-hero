#!/usr/bin/env bash
# Comprehensive phase verification — Phases 1–17 against live Cloud Run URL
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

file_exists() {
  [ -f "$1" ] && echo "yes" || echo "no"
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Community Hero Phase Verification ==="
echo "URL: $URL"
echo "Repo: $ROOT"
echo ""

# Phase 1 — scaffold + health
code=$(http_code "$URL/api/health")
[ "$code" = "200" ] && check "1" "API health endpoint" "PASS" || check "1" "API health endpoint" "HTTP $code"

fs=$(json_field "$URL/api/health" "['firestore']" 2>/dev/null || echo "error")
[ "$fs" = "connected" ] && check "1" "Firestore connected" "PASS" || check "1" "Firestore connected" "$fs"

# Phase 2 — reports API (include demo seed for hackathon verification)
issues_json=$(curl -sf --max-time 30 "$URL/api/reports?limit=50" || echo '{"issues":[]}')
demo_issues_json=$(curl -sf --max-time 30 "$URL/api/reports?limit=50&include_demo=1" || echo '{"issues":[]}')
count=$(echo "$issues_json" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('issues',[])))")
demo_count=$(echo "$demo_issues_json" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('issues',[])))" 2>/dev/null || echo 0)
total_count=$((count + 0))
[ "${demo_count:-0}" -gt "${total_count:-0}" ] && total_count=$demo_count
[ "${total_count:-0}" -ge 1 ] && check "2" "Issues in Firestore ($total_count)" "PASS" || check "2" "Issues in Firestore" "0 issues"

# Phase 3 — map + landing routes
for route in "/" "/map" "/report"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "3" "Route $route" "PASS" || check "3" "Route $route" "HTTP $code"
done

code=$(http_code "$URL/api/geo/reverse?lat=12.97&lng=77.59")
[ "$code" = "200" ] && check "3" "Geo reverse API" "PASS" || check "3" "Geo reverse API" "HTTP $code"

# Phase 4 — issue detail + my reports (prefer demo issue if public list empty)
issue_id=$(echo "$issues_json" | python3 -c "import sys,json; i=json.load(sys.stdin).get('issues',[]); print(i[0]['id'] if i else '')" 2>/dev/null || echo "")
if [ -z "$issue_id" ]; then
  issue_id=$(echo "$demo_issues_json" | python3 -c "import sys,json; i=json.load(sys.stdin).get('issues',[]); print(i[0]['id'] if i else '')" 2>/dev/null || echo "")
fi
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

# Phase 5 — upvote endpoint
upvote_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/reports/${issue_id:-test}/upvote")
[ "$upvote_code" = "401" ] || [ "$upvote_code" = "200" ] && check "5" "Upvote endpoint (auth-gated)" "PASS" || check "5" "Upvote endpoint" "HTTP $upvote_code"

# Phase 6 — agent metadata (demo seed includes departmentId + priorityScore)
dept=$(echo "$demo_issues_json" | python3 -c "import sys,json; issues=json.load(sys.stdin).get('issues',[]); i=issues[0] if issues else {}; print(i.get('departmentId','') or i.get('priorityScore',''))" 2>/dev/null || echo "")
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

# Phase 12 — Open311 export (200 with auth or 403 when secured)
code=$(http_code "$URL/api/analytics/export/open311")
[ "$code" = "200" ] || [ "$code" = "403" ] && check "12" "Open311 export (auth-gated OK)" "PASS" || check "12" "Open311 export" "HTTP $code"

# Phase 14 — key routes
for route in "/activity" "/profile" "/login" "/terms" "/privacy" "/admin/analytics"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "14" "Route $route" "PASS" || check "14" "Route $route" "HTTP $code"
done

if [ -n "$issue_id" ]; then
  thread_id="thread-$(curl -sf "$URL/api/reports/$issue_id" | python3 -c "import sys,json; print(json.load(sys.stdin)['issue'].get('geohash','')[:5])" 2>/dev/null || echo 'test')"
  code=$(http_code "$URL/threads/$thread_id")
  [ "$code" = "200" ] && check "14" "Route /threads/:id" "PASS" || check "14" "Route /threads/:id" "HTTP $code"
fi

# Phase 15 — documentation & diagrams
mmd_count=$(find "$ROOT/docs/diagrams/mermaid" -name '*.mmd' 2>/dev/null | wc -l | tr -d ' ')
[ "${mmd_count:-0}" -ge 16 ] && check "15" "16 mermaid diagram sources ($mmd_count)" "PASS" || check "15" "16 mermaid diagrams" "found $mmd_count/16"

[ "$(file_exists "$ROOT/scripts/render-diagrams.sh")" = "yes" ] && check "15" "render-diagrams.sh" "PASS" || check "15" "render-diagrams.sh" "missing"

sys_lines=$(wc -l < "$ROOT/docs/system-design.md" | tr -d ' ')
[ "${sys_lines:-0}" -ge 400 ] && check "15" "system-design.md 400+ lines ($sys_lines)" "PASS" || check "15" "system-design.md lines" "$sys_lines (need 400+)"

arch_lines=$(wc -l < "$ROOT/docs/architecture.md" | tr -d ' ')
[ "${arch_lines:-0}" -ge 300 ] && check "15" "architecture.md 300+ lines ($arch_lines)" "PASS" || check "15" "architecture.md lines" "$arch_lines (need 300+)"

slide_count=$(find "$ROOT/docs/ppt-info/slides" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
[ "${slide_count:-0}" -ge 15 ] && check "15" "15 presentation slides ($slide_count)" "PASS" || check "15" "presentation slides" "$slide_count/15"

# Phase 16 — DevOps & deployment
[ "$(file_exists "$ROOT/.github/workflows/deploy.yml")" = "yes" ] && check "16" "GitHub Actions deploy.yml" "PASS" || check "16" "deploy.yml" "missing"
[ "$(file_exists "$ROOT/scripts/uptime-ping.sh")" = "yes" ] && check "16" "uptime-ping.sh health monitor" "PASS" || check "16" "uptime-ping.sh" "missing"
[[ "$URL" == *".run.app"* ]] && check "16" "Cloud Run .run.app URL" "PASS" || check "16" "Cloud Run URL format" "wrong domain"

dep_check=$(grep -c '\[x\].*Published URL loads' "$ROOT/docs/deployment.md" 2>/dev/null || echo 0)
[ "${dep_check:-0}" -ge 1 ] && check "16" "Section 8.5 checklist in deployment.md" "PASS" || check "16" "Section 8.5 checklist" "not checked"

# Phase 17 — testing & QA
[ "$(file_exists "$ROOT/server/tests/integration/reports.test.ts")" = "yes" ] && check "17" "integration/reports.test.ts" "PASS" || check "17" "reports.test.ts" "missing"
[ "$(file_exists "$ROOT/server/tests/agents.test.ts")" = "yes" ] && check "17" "agents.test.ts" "PASS" || check "17" "agents.test.ts" "missing"
[ "$(file_exists "$ROOT/server/tests/geohash.test.ts")" = "yes" ] && check "17" "geohash.test.ts" "PASS" || check "17" "geohash.test.ts" "missing"
[ "$(file_exists "$ROOT/scripts/qa-checklist.md")" = "yes" ] && check "17" "qa-checklist.md" "PASS" || check "17" "qa-checklist.md" "missing"

grep -q 'seed-all' "$ROOT/Makefile" 2>/dev/null && check "17" "Makefile seed-all target" "PASS" || check "17" "Makefile seed-all" "missing"

[ "${demo_count:-0}" -ge 20 ] && check "17" "Demo seed data ($demo_count issues, target 25)" "PASS" || check "17" "Demo seed data ($demo_count issues, target 25)" "need more seed data"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
