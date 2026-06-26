.PHONY: dev build preview install verify seed seed-all deploy test lint health diagrams

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

seed-departments:
	cd server && npx tsx scripts/seed-departments.ts

seed-all: seed seed-departments
	@echo "Seeded Firestore issues + departments"

deploy:
	bash scripts/deploy-cloud-run.sh

diagrams:
	bash scripts/render-diagrams.sh

test:
	cd server && npm test

lint:
	cd frontend && npm run lint

health:
	@curl -sf http://localhost:3001/api/health | head -c 500 && echo ""

verify:
	@echo "=== Production health ==="
	@curl -sf https://community-hero-987477089222.asia-south1.run.app/api/health | head -c 300 && echo ""
	@curl -sf "https://community-hero-987477089222.asia-south1.run.app/api/reports?limit=1" | head -c 100 && echo ""
