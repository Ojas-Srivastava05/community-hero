.PHONY: dev build preview install verify seed deploy

install:
	cd frontend && npm install
	cd server && npm install

dev:
	@echo "Start server: cd server && npm run dev"
	@echo "Start frontend: cd frontend && npm run dev"

build:
	cd frontend && npm run build
	cd server && npm run build

preview:
	cd frontend && npm run preview

seed:
	cd server && npx tsx scripts/seed-firestore.ts

deploy:
	bash scripts/deploy-cloud-run.sh

verify:
	@echo "=== Production health ==="
	@curl -sf https://community-hero-987477089222.asia-south1.run.app/api/health | head -c 300 && echo ""
	@curl -sf "https://community-hero-987477089222.asia-south1.run.app/api/reports?limit=1" | head -c 100 && echo ""
