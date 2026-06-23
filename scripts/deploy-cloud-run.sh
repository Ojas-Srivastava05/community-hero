#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-community-hero-vibe2ship}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-community-hero}"

if [ -f frontend/.env.production ]; then
  set -a
  # shellcheck disable=SC1091
  source frontend/.env.production
  set +a
elif [ -f frontend/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source frontend/.env
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
  --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID},NODE_ENV=production,ADMIN_EMAILS=srivastavaojas454@gmail.com,FIREBASE_STORAGE_BUCKET=community-hero-vibe2ship-uploads,GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY:-}${GEMINI_API_KEY:+,GEMINI_API_KEY=${GEMINI_API_KEY}}" \

URL=$(gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format='value(status.url)')
echo ""
echo "✅ Deployed: ${URL}"
echo "Add ${URL#https://} to Firebase Auth authorized domains."
