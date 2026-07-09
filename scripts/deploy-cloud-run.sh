#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-community-hero-vibe2ship}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-community-hero}"

# Prefer .env.production when it has real values; otherwise fall back to .env
load_env_file() {
  local f="$1"
  [ -f "$f" ] || return 1
  # Skip empty / placeholder-only files
  grep -qE '^VITE_[A-Z0-9_]+=.+' "$f" || return 1
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
  return 0
}
load_env_file frontend/.env.production || load_env_file frontend/.env || true
# Server secrets (Gemini) for Cloud Run runtime
if [ -f server/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source server/.env
  set +a
fi
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "Building image via Cloud Build..."
gcloud builds submit \
  --project="${PROJECT_ID}" \
  --config=cloudbuild.yaml \
  --substitutions="_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:-},_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID:-},_VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY:-}" \
  .

IMAGE="gcr.io/${PROJECT_ID}/community-hero:latest"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --min-instances=1 \
  --update-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID},NODE_ENV=production,ADMIN_EMAILS=srivastavaojas454@gmail.com,FIREBASE_STORAGE_BUCKET=community-hero-vibe2ship-uploads,INCLUDE_DEMO_ANALYTICS=1,GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY:-}${GEMINI_API_KEY:+,GEMINI_API_KEY=${GEMINI_API_KEY}}${ADMIN_SECRET:+,ADMIN_SECRET=${ADMIN_SECRET}}" \

URL=$(gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format='value(status.url)')
echo ""
echo "✅ Deployed: ${URL}"
echo "Add ${URL#https://} to Firebase Auth authorized domains."
