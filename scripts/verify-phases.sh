#!/usr/bin/env bash
# Comprehensive phase verification — Phases 1–19 against live Cloud Run URL
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

code=$(http_code "$URL/report")
[ "$code" = "200" ] && check "2" "Report wizard route /report" "PASS" || check "2" "Report wizard route /report" "HTTP $code"

analyze_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST --max-time 30 "$URL/api/reports/analyze")
[ "$analyze_code" = "401" ] && check "2" "POST /api/reports/analyze auth-gated" "PASS" || check "2" "POST /api/reports/analyze auth-gated" "HTTP $analyze_code"

create_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST --max-time 30 "$URL/api/reports")
[ "$create_code" = "401" ] && check "2" "POST /api/reports auth-gated" "PASS" || check "2" "POST /api/reports auth-gated" "HTTP $create_code"

# Phase 3 — map + landing routes
for route in "/" "/map"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "3" "Route $route" "PASS" || check "3" "Route $route" "HTTP $code"
done

code=$(http_code "$URL/api/geo/reverse?lat=12.97&lng=77.59")
[ "$code" = "200" ] && check "3" "Geo reverse API" "PASS" || check "3" "Geo reverse API" "HTTP $code"

code=$(http_code "$URL/api/geo/wards")
[ "$code" = "200" ] && check "3" "Ward GeoJSON API" "PASS" || check "3" "Ward GeoJSON API" "HTTP $code"

prio_code=$(http_code "$URL/api/reports?limit=2&sort=priority&status=Submitted")
[ "$prio_code" = "200" ] && check "3" "Priority+status reports query" "PASS" || check "3" "Priority+status reports query" "HTTP $prio_code"

notif_code=$(http_code "$URL/api/notifications")
[ "$notif_code" = "401" ] && check "3" "Notifications API auth-gated" "PASS" || check "3" "Notifications API auth-gated" "HTTP $notif_code"

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

approve_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/reports/${issue_id:-test}/approve")
[ "$approve_code" = "401" ] && check "7" "Judge approve endpoint auth-gated" "PASS" || check "7" "Judge approve endpoint" "HTTP $approve_code"

code=$(http_code "$URL/notifications")
[ "$code" = "200" ] && check "7" "Notifications page route" "PASS" || check "7" "Notifications page route" "HTTP $code"

# Phase 8 — dashboard + analytics
code=$(http_code "$URL/dashboard")
[ "$code" = "200" ] && check "8" "Dashboard route" "PASS" || check "8" "Dashboard route" "HTTP $code"
open=$(json_field "$URL/api/analytics/summary" "['open']" 2>/dev/null || echo -1)
[ "${open:-0}" -ge 0 ] 2>/dev/null && check "8" "Analytics summary API" "PASS" || check "8" "Analytics summary API" "failed"
code=$(http_code "$URL/api/analytics/trends")
[ "$code" = "200" ] && check "8" "GET /api/analytics/trends" "PASS" || check "8" "GET /api/analytics/trends" "HTTP $code"
code=$(http_code "$URL/api/departments")
[ "$code" = "200" ] && check "8" "GET /api/departments" "PASS" || check "8" "GET /api/departments" "HTTP $code"

# Phase 9 — hotspots + trends predictive fields
code=$(http_code "$URL/api/analytics/hotspots")
[ "$code" = "200" ] && check "9" "Hotspots API" "PASS" || check "9" "Hotspots API" "HTTP $code"
hotspot_count=$(curl -sf "$URL/api/analytics/hotspots" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('hotspots',[])))" 2>/dev/null || echo 0)
[ "${hotspot_count:-0}" -gt 0 ] 2>/dev/null && check "9" "Hotspots payload ($hotspot_count cells)" "PASS" || check "9" "Hotspots payload" "empty"
code=$(http_code "$URL/api/analytics/trends")
[ "$code" = "200" ] && check "9" "Trends API (30d + preventive)" "PASS" || check "9" "Trends API (30d + preventive)" "HTTP $code"
trend30=$(curl -sf "$URL/api/analytics/trends" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('daily30',[])))" 2>/dev/null || echo 0)
[ "${trend30:-0}" -ge 7 ] 2>/dev/null && check "9" "30-day trend series ($trend30 days)" "PASS" || check "9" "30-day trend series" "short ($trend30)"
code=$(http_code "$URL/admin/analytics")
[ "$code" = "200" ] && check "9" "Admin analytics route" "PASS" || check "9" "Admin analytics route" "HTTP $code"

# Phase 10 — gamification (leaderboard, rules, confidence-gated points)
[ "$(file_exists "$ROOT/server/src/lib/gamification.ts")" = "yes" ] && check "10" "gamification.ts module" "PASS" || check "10" "gamification.ts module" "missing"
code=$(http_code "$URL/leaderboard")
[ "$code" = "200" ] && check "10" "Leaderboard route" "PASS" || check "10" "Leaderboard route" "HTTP $code"
code=$(http_code "$URL/gamification-rules")
[ "$code" = "200" ] && check "10" "Gamification rules route" "PASS" || check "10" "Gamification rules route" "HTTP $code"
code=$(http_code "$URL/api/leaderboard")
[ "$code" = "200" ] && check "10" "Leaderboard API (alltime)" "PASS" || check "10" "Leaderboard API (alltime)" "HTTP $code"
lb_period=$(curl -sf --max-time 30 "$URL/api/leaderboard?period=weekly" | python3 -c "import sys,json; print(json.load(sys.stdin).get('period',''))" 2>/dev/null || echo "")
[ "$lb_period" = "weekly" ] && check "10" "Leaderboard API (weekly period)" "PASS" || check "10" "Leaderboard API (weekly period)" "got '$lb_period'"

# Phase 11 — assistant
code=$(http_code "$URL/assistant")
[ "$code" = "200" ] && check "11" "Civic Assistant route" "PASS" || check "11" "Civic Assistant route" "HTTP $code"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X POST "$URL/api/ai/chat" -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"test"}]}')
[ "$code" = "401" ] && check "11" "Chat API auth-gated" "PASS" || check "11" "Chat API auth-gated" "HTTP $code (expected 401)"

# Phase 12 — Threads & Open311
code=$(http_code "$URL/api/threads")
[ "$code" = "200" ] && check "12" "GET /api/threads" "PASS" || check "12" "GET /api/threads" "HTTP $code"

thread_id=$(curl -sf --max-time 30 "$URL/api/threads" | python3 -c "import sys,json; t=json.load(sys.stdin).get('threads',[]); print(t[0]['id'] if t else '')" 2>/dev/null || echo "")
if [ -n "$thread_id" ]; then
  code=$(http_code "$URL/api/threads/$thread_id")
  [ "$code" = "200" ] && check "12" "GET /api/threads/:id ($thread_id)" "PASS" || check "12" "GET /api/threads/:id" "HTTP $code"
else
  check "12" "GET /api/threads/:id" "no threads to test"
fi

code=$(http_code "$URL/api/departments")
[ "$code" = "200" ] && check "12" "Open311 service catalog /api/departments" "PASS" || check "12" "Open311 service catalog" "HTTP $code"

open311_code=$(curl -sf --max-time 30 "$URL/api/departments" | python3 -c "import sys,json; s=json.load(sys.stdin).get('services',[]); print(s[0].get('service_code','') if s else '')" 2>/dev/null || echo "")
[ -n "$open311_code" ] && check "12" "Open311 service_code present ($open311_code)" "PASS" || check "12" "Open311 service_code" "missing"

code=$(http_code "$URL/api/analytics/export/open311")
[ "$code" = "200" ] || [ "$code" = "403" ] && check "12" "Bulk Open311 export (admin-gated OK)" "PASS" || check "12" "Bulk Open311 export" "HTTP $code"

per_issue_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST --max-time 30 "$URL/api/reports/${issue_id:-test}/open311/export")
[ "$per_issue_code" = "401" ] || [ "$per_issue_code" = "403" ] && check "12" "Per-issue Open311 export auth-gated" "PASS" || check "12" "Per-issue Open311 export auth-gated" "HTTP $per_issue_code"

# Phase 13 — Security & performance
[ "$(file_exists "$ROOT/server/src/middleware/rateLimit.ts")" = "yes" ] && check "13" "Rate limit middleware" "PASS" || check "13" "Rate limit middleware" "missing"
[ "$(file_exists "$ROOT/server/src/lib/errors.ts")" = "yes" ] && check "13" "Appendix W errors.ts" "PASS" || check "13" "errors.ts" "missing"
[ "$(file_exists "$ROOT/firestore.rules")" = "yes" ] && check "13" "firestore.rules" "PASS" || check "13" "firestore.rules" "missing"
[ "$(file_exists "$ROOT/frontend/src/pages/Waiting.tsx")" = "yes" ] && check "13" "Waiting page source" "PASS" || check "13" "Waiting page source" "missing"
code=$(http_code "$URL/waiting")
[ "$code" = "200" ] && check "13" "Route /waiting live" "PASS" || check "13" "Route /waiting live" "HTTP $code"
open311_body=$(curl -s --max-time 30 "$URL/api/analytics/export/open311" 2>/dev/null || echo '{}')
echo "$open311_body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('code')=='FORBIDDEN', d" 2>/dev/null \
  && check "13" "Admin export returns FORBIDDEN code" "PASS" \
  || check "13" "Admin export FORBIDDEN code" "missing (deploy pending)"
[ "$(file_exists "$ROOT/server/src/lib/media.ts")" = "yes" ] || [ "$(file_exists "$ROOT/server/src/lib/media-validation.ts")" = "yes" ] \
  && check "13" "Media validation module" "PASS" || check "13" "Media validation" "missing"
grep -q 'SERVICE_UNAVAILABLE' "$ROOT/server/src/lib/errors.ts" 2>/dev/null && check "13" "SERVICE_UNAVAILABLE 503 code" "PASS" || check "13" "SERVICE_UNAVAILABLE 503 code" "missing"
grep -q 'Promise.all' "$ROOT/server/src/routes/reports.ts" 2>/dev/null && check "13" "Parallel upload+geocode Promise.all" "PASS" || check "13" "Parallel upload+geocode" "missing"
grep -q 'RATE_LIMIT_ENABLED' "$ROOT/server/src/middleware/rateLimit.ts" 2>/dev/null && check "13" "RATE_LIMIT_ENABLED env toggle" "PASS" || check "13" "RATE_LIMIT_ENABLED env toggle" "missing"
grep -q 'X-RateLimit-Remaining' "$ROOT/server/src/middleware/rateLimit.ts" 2>/dev/null && check "13" "X-RateLimit-Remaining header" "PASS" || check "13" "X-RateLimit-Remaining header" "missing"
grep -q 'geocode_cache' "$ROOT/firestore.rules" 2>/dev/null && check "13" "geocode_cache rules locked" "PASS" || check "13" "geocode_cache rules locked" "missing"
[ "$(file_exists "$ROOT/server/tests/security.test.ts")" = "yes" ] && check "13" "security.test.ts" "PASS" || check "13" "security.test.ts" "missing"

# Phase 14 — all 18 SPA routes + PWA assets
PHASE14_ROUTES=(
  "/"
  "/map"
  "/report"
  "/activity"
  "/profile"
  "/login"
  "/terms"
  "/gamification-rules"
  "/privacy"
  "/waiting"
  "/my-reports"
  "/dashboard"
  "/admin"
  "/admin/analytics"
  "/assistant"
  "/leaderboard"
)
for route in "${PHASE14_ROUTES[@]}"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "14" "Route $route" "PASS" || check "14" "Route $route" "HTTP $code"
done

if [ -n "$issue_id" ]; then
  code=$(http_code "$URL/issues/$issue_id")
  [ "$code" = "200" ] && check "14" "Route /issues/:id" "PASS" || check "14" "Route /issues/:id" "HTTP $code"
  thread_id="thread-$(curl -sf "$URL/api/reports/$issue_id" | python3 -c "import sys,json; print(json.load(sys.stdin)['issue'].get('geohash','')[:5])" 2>/dev/null || echo 'test')"
  code=$(http_code "$URL/threads/$thread_id")
  [ "$code" = "200" ] && check "14" "Route /threads/:id" "PASS" || check "14" "Route /threads/:id" "HTTP $code"
fi

for asset in "/manifest.webmanifest" "/manifest.json" "/sw.js"; do
  code=$(http_code "$URL$asset")
  [ "$code" = "200" ] && check "14" "PWA asset $asset" "PASS" || check "14" "PWA asset $asset" "HTTP $code"
done

[ "$(file_exists "$ROOT/frontend/public/manifest.json")" = "yes" ] && check "14" "manifest.json in repo" "PASS" || check "14" "manifest.json in repo" "missing"
[ "$(file_exists "$ROOT/frontend/src/components/ErrorBoundary.tsx")" = "yes" ] && check "14" "ErrorBoundary component" "PASS" || check "14" "ErrorBoundary component" "missing"
[ "$(file_exists "$ROOT/frontend/src/components/PageSkeleton.tsx")" = "yes" ] && check "14" "PageSkeleton component" "PASS" || check "14" "PageSkeleton component" "missing"

route_count=$(grep -c '<Route path=' "$ROOT/frontend/src/App.tsx" 2>/dev/null || echo 0)
[ "${route_count:-0}" -ge 18 ] && check "14" "18 routes in App.tsx ($route_count)" "PASS" || check "14" "18 routes in App.tsx" "found $route_count"

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
[ "$(file_exists "$ROOT/.github/workflows/ci.yml")" = "yes" ] && check "16" "GitHub Actions ci.yml" "PASS" || check "16" "ci.yml" "missing"
[ "$(file_exists "$ROOT/.github/workflows/deploy.yml")" = "yes" ] && check "16" "GitHub Actions deploy.yml" "PASS" || check "16" "deploy.yml" "missing"
[ "$(file_exists "$ROOT/scripts/deploy-cloud-run.sh")" = "yes" ] && check "16" "deploy-cloud-run.sh" "PASS" || check "16" "deploy-cloud-run.sh" "missing"
[ "$(file_exists "$ROOT/scripts/uptime-ping.sh")" = "yes" ] && check "16" "uptime-ping.sh health monitor" "PASS" || check "16" "uptime-ping.sh" "missing"
[[ "$URL" == *".run.app"* ]] && check "16" "Cloud Run .run.app URL" "PASS" || check "16" "Cloud Run URL format" "wrong domain"

dep_check=$(grep -c '\[x\].*Published URL loads' "$ROOT/docs/deployment.md" 2>/dev/null || echo 0)
[ "${dep_check:-0}" -ge 1 ] && check "16" "Section 8.5 checklist in deployment.md" "PASS" || check "16" "Section 8.5 checklist" "not checked"

uptime_ok=$(bash "$ROOT/scripts/uptime-ping.sh" "$URL" >/dev/null 2>&1 && echo yes || echo no)
[ "$uptime_ok" = "yes" ] && check "16" "Production uptime-ping /api/health" "PASS" || check "16" "Production uptime-ping" "failed"

grep -q 'ADMIN_SECRET' "$ROOT/.github/workflows/deploy.yml" 2>/dev/null && check "16" "deploy.yml sets ADMIN_SECRET" "PASS" || check "16" "deploy.yml ADMIN_SECRET" "missing"
grep -q 'GEMINI_API_KEY' "$ROOT/.github/workflows/deploy.yml" 2>/dev/null && check "16" "deploy.yml sets GEMINI_API_KEY" "PASS" || check "16" "deploy.yml GEMINI_API_KEY" "missing"

admin_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -X POST "${URL}/api/analytics/insights-batch" -H "Content-Type: application/json" -d '{}')
[ "$admin_code" = "403" ] && check "16" "ADMIN_SECRET enforced on prod" "PASS" || check "16" "ADMIN_SECRET enforced" "HTTP $admin_code (expect 403)"

# Phase 17 — testing & QA
[ "$(file_exists "$ROOT/server/tests/integration/reports.test.ts")" = "yes" ] && check "17" "integration/reports.test.ts" "PASS" || check "17" "reports.test.ts" "missing"
[ "$(file_exists "$ROOT/server/tests/agents.test.ts")" = "yes" ] && check "17" "agents.test.ts" "PASS" || check "17" "agents.test.ts" "missing"
[ "$(file_exists "$ROOT/server/tests/geohash.test.ts")" = "yes" ] && check "17" "geohash.test.ts" "PASS" || check "17" "geohash.test.ts" "missing"
[ "$(file_exists "$ROOT/scripts/qa-checklist.md")" = "yes" ] && check "17" "qa-checklist.md" "PASS" || check "17" "qa-checklist.md" "missing"

grep -q 'seed-all' "$ROOT/Makefile" 2>/dev/null && check "17" "Makefile seed-all target" "PASS" || check "17" "Makefile seed-all" "missing"

[ "${demo_count:-0}" -ge 20 ] && check "17" "Demo seed data ($demo_count issues, target 25)" "PASS" || check "17" "Demo seed data ($demo_count issues, target 25)" "need more seed data"

# Phase 18 — submission package (in-repo)
[ "$(file_exists "$ROOT/docs/submission/GOOGLE-DOC-CONTENT.md")" = "yes" ] && check "18" "GOOGLE-DOC-CONTENT.md" "PASS" || check "18" "GOOGLE-DOC-CONTENT.md" "missing"
gdoc_lines=$(wc -l < "$ROOT/docs/submission/GOOGLE-DOC-CONTENT.md" 2>/dev/null | tr -d ' ')
[ "${gdoc_lines:-0}" -ge 200 ] && check "18" "Google Doc template 200+ lines ($gdoc_lines)" "PASS" || check "18" "Google Doc template lines" "$gdoc_lines (need 200+)"
[ "$(file_exists "$ROOT/docs/ppt-info/SLIDES-COMPLETE.md")" = "yes" ] && check "18" "SLIDES-COMPLETE.md" "PASS" || check "18" "SLIDES-COMPLETE.md" "missing"
[ "$(file_exists "$ROOT/docs/SUBMISSION-CHECKLIST.md")" = "yes" ] && check "18" "SUBMISSION-CHECKLIST.md" "PASS" || check "18" "SUBMISSION-CHECKLIST.md" "missing"
[ "$(file_exists "$ROOT/scripts/prepare-submission.sh")" = "yes" ] && check "18" "prepare-submission.sh" "PASS" || check "18" "prepare-submission.sh" "missing"
gdoc_sections=$(grep -c '^## Section' "$ROOT/docs/submission/GOOGLE-DOC-CONTENT.md" 2>/dev/null || echo 0)
[ "${gdoc_sections:-0}" -ge 10 ] && check "18" "Google Doc 10 sections ($gdoc_sections)" "PASS" || check "18" "Google Doc sections" "$gdoc_sections/10"
png_arch=$(file_exists "$ROOT/docs/diagrams/png/01-system-architecture.png")
png_agent=$(file_exists "$ROOT/docs/diagrams/png/04-agent-workflow.png")
[ "$png_arch" = "yes" ] && [ "$png_agent" = "yes" ] && check "18" "Architecture + agent PNGs" "PASS" || check "18" "Architecture + agent PNGs" "missing"
[ "$(file_exists "$ROOT/docs/submission/screenshots/README.md")" = "yes" ] && check "18" "screenshots/README.md capture guide" "PASS" || check "18" "screenshots/README.md" "missing"
grep -q 'Slide 12' "$ROOT/docs/ppt-info/SLIDES-COMPLETE.md" 2>/dev/null && check "18" "Slide 12 Live Demo in SLIDES-COMPLETE" "PASS" || check "18" "Slide 12 Live Demo" "missing"

# Phase 19 — demo & closure (in-repo + demo-path smoke)
[ "$(file_exists "$ROOT/docs/demo/APPENDIX-I-DEMO-SCRIPT.md")" = "yes" ] && check "19" "APPENDIX-I-DEMO-SCRIPT.md" "PASS" || check "19" "APPENDIX-I-DEMO-SCRIPT.md" "missing"
demo_script_lines=$(wc -l < "$ROOT/docs/demo/APPENDIX-I-DEMO-SCRIPT.md" 2>/dev/null | tr -d ' ')
grep -q '2:50' "$ROOT/docs/demo/APPENDIX-I-DEMO-SCRIPT.md" 2>/dev/null && check "19" "Demo script timed to 2:50" "PASS" || check "19" "Demo script timing" "missing 2:50 target"
[ "$(file_exists "$ROOT/docs/demo/REHEARSAL-CHECKLIST.md")" = "yes" ] && check "19" "REHEARSAL-CHECKLIST.md" "PASS" || check "19" "REHEARSAL-CHECKLIST.md" "missing"
grep -q 'Rehearsal run 2' "$ROOT/docs/demo/REHEARSAL-CHECKLIST.md" 2>/dev/null && check "19" "Twice-timed rehearsal protocol" "PASS" || check "19" "Twice-timed rehearsal" "missing"
[ "$(file_exists "$ROOT/docs/demo/QR-CODE.md")" = "yes" ] && check "19" "QR-CODE.md" "PASS" || check "19" "QR-CODE.md" "missing"
[ "$(file_exists "$ROOT/docs/demo/qr-production.png")" = "yes" ] && check "19" "qr-production.png for Slide 12" "PASS" || check "19" "qr-production.png" "missing (run scripts/generate-demo-qr.sh)"
[ "$(file_exists "$ROOT/scripts/generate-demo-qr.sh")" = "yes" ] && check "19" "generate-demo-qr.sh" "PASS" || check "19" "generate-demo-qr.sh" "missing"

# Appendix I click-path routes on production (demo E2E smoke)
for route in "/" "/map" "/report" "/dashboard" "/assistant" "/admin"; do
  code=$(http_code "$URL$route")
  [ "$code" = "200" ] && check "19" "Demo path $route" "PASS" || check "19" "Demo path $route" "HTTP $code"
done

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)
