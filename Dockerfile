# Multi-stage build: frontend + server → Cloud Run
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY shared/ ../shared/
# Vite loads frontend/.env.production automatically during build.
# Only pass build-args when explicitly set (non-empty) in Cloud Build.
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY shared/ ./shared/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["npx", "tsx", "src/index.ts"]
