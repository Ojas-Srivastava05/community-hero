#!/usr/bin/env bash
# Health monitor for Cloud Run — use with cron every 5 min during evaluation.
# Example crontab: */5 * * * * /path/to/scripts/uptime-ping.sh >> /tmp/community-hero-health.log 2>&1
set -euo pipefail

URL="${1:-https://community-hero-987477089222.asia-south1.run.app}"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

HTTP_CODE="$(curl -s -o /tmp/ch-health.json -w "%{http_code}" --max-time 30 "${URL}/api/health")"

if [ "${HTTP_CODE}" != "200" ]; then
  echo "${TS} FAIL health HTTP ${HTTP_CODE} url=${URL}"
  exit 1
fi

STATUS="$(python3 -c "import json; print(json.load(open('/tmp/ch-health.json')).get('status',''))" 2>/dev/null || echo "")"
FS="$(python3 -c "import json; print(json.load(open('/tmp/ch-health.json')).get('firestore',''))" 2>/dev/null || echo "")"

if [ "${STATUS}" != "ok" ]; then
  echo "${TS} FAIL status=${STATUS} url=${URL}"
  exit 1
fi

echo "${TS} OK status=${STATUS} firestore=${FS} url=${URL}"
