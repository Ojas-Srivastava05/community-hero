.PHONY: dev build preview install verify

install:
	npm install
	cd frontend && npm install
	cd server && npm install

dev:
	npm run dev

build:
	cd frontend && npm run build

preview:
	cd frontend && npm run preview

verify:
	@echo "=== Phase 1 verification ==="
	@curl -sf http://localhost:3001/api/health | head -c 200 && echo "" || echo "API not running"
	@test -f firestore.rules && echo "✓ firestore.rules"
	@test -f docs/architecture.md && echo "✓ docs/architecture.md"
	@test -f README.md && echo "✓ README.md"
