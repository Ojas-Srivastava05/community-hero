#!/usr/bin/env bash
# Phase 13 — concurrent health check load smoke test (P95 latency)
set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
CONCURRENCY="${2:-10}"
ENDPOINT="${BASE_URL}/api/health"

echo "Load smoke test: ${CONCURRENCY} concurrent GET ${ENDPOINT}"

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

pids=()
for i in $(seq 1 "$CONCURRENCY"); do
  (
    start=$(python3 -c 'import time; print(time.time())')
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$ENDPOINT")
    end=$(python3 -c 'import time; print(time.time())')
    ms=$(python3 -c "print(int((${end} - ${start}) * 1000))")
    echo "${ms} ${code}" > "${tmpdir}/result-${i}"
  ) &
  pids+=($!)
done

for pid in "${pids[@]}"; do
  wait "$pid" || true
done

times=()
failures=0
for f in "${tmpdir}"/result-*; do
  read -r ms code < "$f"
  times+=("$ms")
  if [[ "$code" != "200" ]]; then
    failures=$((failures + 1))
  fi
done

IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
unset IFS
count=${#sorted[@]}
idx=$(( (count * 95 + 99) / 100 - 1 ))
if (( idx < 0 )); then idx=0; fi
p95=${sorted[$idx]}
sum=0
for t in "${times[@]}"; do sum=$((sum + t)); done
avg=$((sum / count))
min=${sorted[0]}
max=${sorted[$((count - 1))]}

echo ""
echo "Results (${count} requests, ${failures} non-200):"
echo "  min: ${min}ms"
echo "  avg: ${avg}ms"
echo "  p95: ${p95}ms"
echo "  max: ${max}ms"

if (( failures > 0 )); then
  echo "FAIL: ${failures} request(s) did not return HTTP 200"
  exit 1
fi

echo "PASS"
