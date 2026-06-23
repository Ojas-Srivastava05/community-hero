#!/usr/bin/env python3
"""Generate phase-wise development tracker PDF covering entire Master Plan."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Community-Hero-Phase-Development-Plan.pdf"
MASTER_PLAN = ROOT / "Community-Hero-Master-Plan.pdf"

UNICODE_REPLACEMENTS = {
    "\u2014": "-",
    "\u2013": "-",
    "\u2022": "-",
    "\u2192": "->",
    "\u2190": "<-",
    "\u2610": "[ ]",
    "\u2713": "[x]",
    "\u2026": "...",
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
}


def sanitize(text: str) -> str:
    for src, dst in UNICODE_REPLACEMENTS.items():
        text = text.replace(src, dst)
    return text.encode("ascii", "replace").decode("ascii")


class PhasePDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="A4", unit="mm")
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(15, 15, 15)
        self.phase_counter = 0

    def footer(self) -> None:
        self.set_y(-12)
        self.set_body_font(8, "I")
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, sanitize(f"CIVICPULSE AI Phase Plan  |  Page {self.page_no()}"), align="C")
        self.set_text_color(0, 0, 0)

    def set_body_font(self, size: int = 10, style: str = "") -> None:
        self.set_font("Helvetica", style, size)

    def _reset_x(self) -> None:
        self.set_x(self.l_margin)

    def h1(self, text: str) -> None:
        self._reset_x()
        self.ln(3)
        self.set_body_font(16, "B")
        self.set_text_color(20, 60, 120)
        self.multi_cell(0, 8, sanitize(text))
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def h2(self, text: str) -> None:
        self._reset_x()
        self.ln(2)
        self.set_body_font(12, "B")
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 7, sanitize(text))
        self.set_text_color(0, 0, 0)
        self.ln(1)

    def h3(self, text: str) -> None:
        self._reset_x()
        self.ln(1)
        self.set_body_font(11, "B")
        self.multi_cell(0, 6, sanitize(text))

    def p(self, text: str) -> None:
        self._reset_x()
        self.set_body_font(10)
        self.multi_cell(0, 5.5, sanitize(text))
        self.ln(0.5)

    def bullet(self, text: str) -> None:
        self._reset_x()
        self.set_body_font(10)
        self.multi_cell(0, 5.5, sanitize(f"  - {text}"))

    def checkbox(self, text: str) -> None:
        self._reset_x()
        self.set_body_font(10)
        self.multi_cell(0, 5.5, sanitize(f"  [ ] {text}"))

    def table_block(
        self,
        headers: list[str],
        rows: list[list[str]],
        widths: tuple[float, ...] | None = None,
    ) -> None:
        """Render a multi-column table using fpdf2 native table API."""
        self._reset_x()
        self.ln(1)
        if widths is None:
            n = len(headers)
            widths = tuple([self.epw / n] * n)
        with self.table(col_widths=widths, first_row_as_headings=True) as table:
            header = table.row()
            for h in headers:
                header.cell(sanitize(h))
            for row in rows:
                data = table.row()
                for cell in row:
                    data.cell(sanitize(cell))
        self.ln(2)

    def cover(self) -> None:
        self.add_page()
        self._reset_x()
        self.set_body_font(26, "B")
        self.set_text_color(20, 60, 120)
        self.multi_cell(0, 12, "CIVICPULSE AI", align="C")
        self.ln(3)
        self._reset_x()
        self.set_body_font(15, "B")
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 9, "Phase-Wise Development Plan", align="C")
        self.ln(4)
        self._reset_x()
        self.set_body_font(11)
        self.multi_cell(
            0,
            7,
            sanitize(
                "Complete build tracker mapping every section and appendix of the "
                "61-page Community-Hero-Master-Plan.pdf to 20 sequential phases."
            ),
            align="C",
        )
        self.ln(6)
        self._reset_x()
        self.set_body_font(10)
        for line in [
            "Companion doc: Community-Hero-Master-Plan.pdf",
            "Product: Community Hero - Hyperlocal Problem Solver (Vibe2Ship)",
            "Deadline: June 29, 2026, 2:00 PM (BlockseBlock submission)",
            "Phases: 0 through 19 (20 phases total)",
            "Usage: Complete each phase fully before starting the next.",
            "Track progress: Check [ ] boxes as you build with Cursor + AI Studio.",
        ]:
            self._reset_x()
            self.multi_cell(0, 6, sanitize(f"- {line}"))
        self.ln(4)
        self._reset_x()
        self.set_body_font(10, "I")
        self.cell(0, 6, "Generated: June 23, 2026", align="C")

    def render_phase(self, phase: dict) -> None:
        self.add_page()
        self.phase_counter += 1
        num = phase["number"]
        self.h1(f"PHASE {num}: {phase['title']}")
        self.p(f"Goal: {phase['goal']}")
        self.p(f"Suggested timing: {phase['timing']}")
        self.p(f"Depends on: {phase['depends_on']}")

        self.h2("Master Plan Coverage (sections + appendices)")
        for ref in phase["coverage"]:
            self.bullet(ref)

        if phase.get("official_features"):
            self.h2("Official Hackathon Features Addressed This Phase")
            for f in phase["official_features"]:
                self.bullet(f)

        self.h2("Build Tasks (complete every item)")
        for task in phase["tasks"]:
            self.checkbox(task)

        self.h2("Deliverables")
        for d in phase["deliverables"]:
            self.bullet(d)

        self.h2("Definition of Done")
        for d in phase["done"]:
            self.checkbox(d)

        self.h2("Verification Before Next Phase")
        for v in phase["verify"]:
            self.checkbox(v)


# ---------------------------------------------------------------------------
# MASTER COVERAGE INDEX - maps ALL Master Plan content to phases
# ---------------------------------------------------------------------------
COVERAGE_INDEX: list[tuple[str, str, str]] = [
    ("Section 1", "Executive Summary", "Phase 0"),
    ("Section 2", "Hackathon Problem Statement (all 2.1-2.4 + 8 features)", "Phase 0, spread across build phases"),
    ("Section 3", "Competitive & Research Landscape", "Phase 0"),
    ("Section 4", "Recommended Solution Architecture", "Phase 1"),
    ("Section 5.1", "Image & Video Reporting", "Phase 2"),
    ("Section 5.2", "AI Issue Categorization", "Phase 2"),
    ("Section 5.3", "Geo-location & Mapping", "Phase 3"),
    ("Section 5.4", "Community Verification", "Phase 5"),
    ("Section 5.5", "Real-time Issue Tracking", "Phase 4, 7"),
    ("Section 5.6", "Impact Dashboards", "Phase 8"),
    ("Section 5.7", "Predictive Insights", "Phase 9"),
    ("Section 5.8", "Gamification", "Phase 10"),
    ("Section 6", "Agentic AI Design (6 agents + orchestration + tools)", "Phase 6, 11"),
    ("Section 7", "Google Technologies Stack", "Phase 1, spread all phases"),
    ("Section 8", "Google AI Studio Deployment Strategy", "Phase 1, 16, 18"),
    ("Section 9", "MCP Toolchain Integration", "Phase 1, 15, 16"),
    ("Section 10", "Data Model (Firestore)", "Phase 4"),
    ("Section 11", "Open311 Interoperability", "Phase 12"),
    ("Section 12", "Evaluation Matrix Alignment", "Phase 0, 18"),
    ("Section 13", "7-Day Execution Roadmap", "Mapped across Phases 1-19"),
    ("Section 14", "Submission Deliverables Checklist", "Phase 18"),
    ("Section 15", "AI Studio Starter Prompts (6 prompts)", "Phases 2-11"),
    ("Section 16", "Risks & Mitigations", "Phase 13, 16"),
    ("Section 17", "Reference Repositories & Links", "Phase 0, 15"),
    ("Section 18", "Conclusion", "Phase 19"),
    ("Section 19", "LogiFlow Benchmark Quality Bar", "Phase 0, 15"),
    ("Section 20", "System Design Principles", "Phase 1, all build phases"),
    ("Section 21", "Full System Architecture", "Phase 1, 15"),
    ("Section 22", "Frontend Architecture (18 routes)", "Phases 3-14"),
    ("Section 23", "9 Civic Pipelines", "Phases 2-12"),
    ("Section 24", "Report Submission Lifecycle (10 steps)", "Phases 2, 6"),
    ("Section 25", "Performance & Caching L1-L5", "Phase 13"),
    ("Section 26", "Security & Rate Limiting", "Phase 13"),
    ("Section 27", "Full API Contract (20+ endpoints)", "Phases 2-12, 15"),
    ("Section 28", "Database Schema + Indexes", "Phase 4"),
    ("Section 29", "ML & AI Models (A-G)", "Phases 2, 5, 6, 9, 11"),
    ("Section 30", "Repository Structure", "Phase 1, 15"),
    ("Section 31", "Deployment Runbook", "Phase 16, 18"),
    ("Section 32", "16 Diagram Specifications", "Phase 15"),
    ("Section 33", "Testing & QA Strategy", "Phase 17"),
    ("Section 34", "Business Impact & USP", "Phase 0, 18"),
    ("Section 35", "Makefile & Automation", "Phase 16"),
    ("Section 36", "Hour-by-Hour 7-Day Sprint", "Phases 1-19 timeline"),
    ("Appendix A", "Evaluation Matrix (official weights)", "Phase 0, 18"),
    ("Appendix B", "Gemini Model Selection Guide", "Phases 2, 6, 9, 11"),
    ("Appendix C", "REST API Specification (10 endpoints)", "Phases 2-12"),
    ("Appendix D", "Gemini Structured Output Schema", "Phase 2"),
    ("Appendix E", "Screen-by-Screen UX (11 screens)", "Phases 3-14"),
    ("Appendix F", "Competitive Feature Matrix", "Phase 0, 18"),
    ("Appendix G", "Firestore Security Rules", "Phase 4, 13"),
    ("Appendix H", "AI Pipeline Server Pseudocode", "Phase 2, 6"),
    ("Appendix I", "3-Minute Judge Demo Script", "Phase 19"),
    ("Appendix J", "Google Doc Submission Template", "Phase 18"),
    ("Appendix K", "POST /api/reports Request/Response Schema", "Phase 2"),
    ("Appendix L", "SLA Matrix by Category & Severity", "Phase 7"),
    ("Appendix M", "Open311 Service Code Mapping", "Phase 12"),
    ("Appendix N", "Environment Variables (complete)", "Phase 1, 16"),
    ("Appendix O", "Gamification Point Economy", "Phase 10"),
    ("Appendix P", "Presentation Kit (15 slides)", "Phase 18"),
    ("Appendix Q", "LogiFlow vs CIVICPULSE AI Comparison", "Phase 0, 15"),
    ("Appendix R", "Seed Data Specification (25 issues)", "Phase 17"),
    ("Appendix S", "Mermaid 01-System-Architecture Source", "Phase 15"),
    ("Appendix T", "TODO.md Master Checklist", "All phases (rolling)"),
    ("Appendix U", "Team Role Assignments", "Phase 0, 1"),
    ("Appendix V", "Citizen Assistant Function Calling Tools", "Phase 11"),
    ("Appendix W", "Error Codes & HTTP Status", "Phase 13"),
]


PHASES: list[dict] = [
    {
        "number": "0",
        "title": "FOUNDATION, REQUIREMENTS & QUALITY BAR",
        "goal": "Lock scope, evaluation criteria, competitive positioning, and LogiFlow-grade quality expectations before writing code.",
        "timing": "Day 0 (before build) | ~2-3 hours",
        "depends_on": "None - read Master Plan Sections 1-3, 12, 18, 19, 34 and Appendices A, F, Q",
        "coverage": [
            "Master Plan Section 1 - Executive Summary (CIVICPULSE AI codename, strategic thesis)",
            "Master Plan Section 2.1-2.4 - Background, Challenge, 8 Example Features, Evaluation Focus",
            "Master Plan Section 3 - FixMyStreet, InfraGuard, Swachhata, CivicThreads, all research refs",
            "Master Plan Section 12 - Evaluation Matrix Alignment (20% agentic, 20% impact, etc.)",
            "Master Plan Section 18 - Conclusion and winning formula",
            "Master Plan Section 19 - LogiFlow benchmark (771 commits, 6275 doc lines, 16 diagrams)",
            "Master Plan Section 34 - Business Impact & USP (80% faster triage, 40% fewer duplicates)",
            "Appendix A - Official evaluation weights table",
            "Appendix F - Competitive matrix vs Swachhata, FixMyStreet, InfraGuard",
            "Appendix Q - LogiFlow vs CIVICPULSE AI comparison",
            "Appendix U - Team role assignments (Ojas = Tech Lead)",
        ],
        "official_features": [
            "All 8 features listed as MVP scope - assign each to build phase mentally",
        ],
        "tasks": [
            "Read entire Community-Hero-Master-Plan.pdf cover to cover (61 pages)",
            "Confirm problem statement: Community Hero - Hyperlocal Problem Solver",
            "Write 1-paragraph product vision mirroring Section 1 executive summary",
            "List all 8 official example features and note which phase builds each",
            "Memorize evaluation weights: Impact 20%, Agentic 20%, Innovation 20%, Google Tech 15%",
            "Identify differentiation vs Swachhata: agentic AI, predictive hotspots, sub-3s vision triage",
            "Assign team roles per Appendix U (Tech Lead, AI Engineer, Frontend, Data/Geo, DevOps)",
            "Create shared tracking doc or use this PDF checkboxes per phase",
            "Bookmark reference repos from Section 17 (InfraGuard, PotSoft, CivicThreads, etc.)",
            "Set calendar deadline: June 29, 2026 2:00 PM BlockseBlock final submit",
        ],
        "deliverables": [
            "Team aligned on scope, name (CIVICPULSE AI), and quality bar",
            "Phase tracker started (this PDF with checkboxes)",
            "Roles assigned",
        ],
        "done": [
            "Every team member read Master Plan Sections 1-3 and 12",
            "All 8 hackathon features mapped to phases 2-12",
            "Evaluation criteria understood and design decisions will target Agentic Depth 20%",
        ],
        "verify": [
            "Can explain product in 30 seconds (photo -> AI -> map -> verify -> resolve)",
            "Can name 3 competitor apps and 3 differentiators",
            "Deadline and submission requirements (Section 14) understood",
        ],
    },
    {
        "number": "1",
        "title": "PROJECT SCAFFOLD & GOOGLE CLOUD FOUNDATION",
        "goal": "Create AI Studio app, Firebase backend, GitHub repo, docs skeleton, and dev environment matching Section 30 repo structure.",
        "timing": "Day 1 hours 0-4 | Master Plan Section 36 Day 1 H0-H4",
        "depends_on": "Phase 0 complete",
        "coverage": [
            "Section 4 - Recommended Solution Architecture (4.1-4.4 latency budget)",
            "Section 7 - Google Technologies Stack (core: AI Studio, Gemini, Cloud Run, Firestore, Auth, Storage)",
            "Section 8.1 - AI Studio environment setup (Build mode, React + server runtime)",
            "Section 9 - MCP toolchain (firebase_login, gcloud, github, browser)",
            "Section 20 - System design principles (modular pipelines, separation of concerns)",
            "Section 21 - Production topology overview",
            "Section 30 - Repository structure (docs/, server/, scripts/, Makefile)",
            "Section 35 - Makefile targets (dev, seed, deploy, diagrams)",
            "Appendix N - All environment variables documented in .env.example",
            "Appendix T - Copy TODO.md master checklist into repo root",
        ],
        "official_features": [],
        "tasks": [
            "Open aistudio.google.com -> Build mode -> New app -> React + Node server runtime",
            "System instruction: 'Build Community Hero civic reporting platform per master plan'",
            "Prompt: 'Add Firestore database and Firebase Auth with Google Sign-In' (Section 8.1 step 3)",
            "Add Secrets panel: GEMINI_API_KEY (auto), MAPS_API_KEY if needed (Appendix N)",
            "Export to GitHub early - create repo community-hero or civicpulse-ai",
            "Clone to /Users/ojas/Desktop/Vibe2Ship and open in Cursor",
            "Scaffold docs/ folder: architecture.md, system-design.md, deployment.md, api_contract.md (stubs)",
            "Create firestore.rules, firestore.indexes.json, storage.rules (starter from Appendix G)",
            "Create .env.example with all Appendix N variables",
            "Create Makefile with targets: dev, seed, deploy, diagrams, lint, test, health (Section 35)",
            "Run firebase_login via MCP if using Firebase MCP tools",
            "Verify gcloud auth: project-6d6f652b-7066-4341-806, region asia-south1",
            "Create README.md with problem statement, stack, and links placeholders",
            "Initialize TODO.md from Appendix T (all items unchecked)",
        ],
        "deliverables": [
            "AI Studio app with Firestore + Auth enabled",
            "GitHub repository with docs/ skeleton and Makefile",
            "Local Cursor workspace synced",
            ".env.example and firestore.rules committed",
        ],
        "done": [
            "AI Studio Build mode loads without errors",
            "Google Sign-In works in dev container",
            "GitHub repo exists and is pushed",
            "docs/ and scripts/ folders match Section 30 structure",
        ],
        "verify": [
            "Firebase Auth login/logout works",
            "Firestore write test document succeeds",
            "README lists Google stack from Section 7",
        ],
    },
    {
        "number": "2",
        "title": "REPORT INTAKE + GEMINI VISION AI PIPELINE",
        "goal": "Ship core report flow: camera, GPS, image upload, Gemini 2.5 Flash structured classification, POST /api/reports.",
        "timing": "Day 1 H4-12 + Day 2 H0-6 | Section 36 Day 1-2",
        "depends_on": "Phase 1 complete",
        "coverage": [
            "Section 5.1 - Image & video reporting (camera, gallery, compress 1280px WebP)",
            "Section 5.2 - AI categorization (Gemini JSON schema, 9 categories, confidence)",
            "Section 15 Prompt 1 - Scaffold PWA report wizard",
            "Section 15 Prompt 2 - Gemini 2.5 Flash server-side analysis",
            "Section 23 Pipelines 1-2 - Intake + Vision pipelines",
            "Section 24 Steps 1-5 - Client capture through VisionAgent",
            "Section 27 - POST /api/reports, POST /ai/analyze endpoints",
            "Section 29 Model A - Gemini 2.5 Flash vision classifier",
            "Appendix B - Use gemini-2.5-flash NOT flash-image for JSON",
            "Appendix C - POST /api/reports in API spec",
            "Appendix D - Full structured output schema (category, severity, department, etc.)",
            "Appendix H - createReport pseudocode implementation",
            "Appendix K - Request/response multipart schema",
            "Appendix E Screens 2-4 - Report wizard steps",
        ],
        "official_features": [
            "Feature 1: Image and video-based issue reporting (photo path; video in Phase 2 stretch)",
            "Feature 2: AI-powered issue categorization",
        ],
        "tasks": [
            "Build 3-step Report Wizard UI (Appendix E screens 2-4)",
            "Implement camera capture + gallery upload + HTML5 Geolocation",
            "Client-side image resize max 1280px WebP before upload (Section 4.4)",
            "Implement POST /api/reports multipart handler (Appendix K)",
            "Upload images to Cloud Storage path issues/{id}/original.jpg (Section 28)",
            "Implement VisionAgent with gemini-2.5-flash + responseMimeType application/json",
            "Define Zod/IssueAnalysisSchema matching Appendix D all fields",
            "Pre-fill report form from AI output; user can edit before submit",
            "Confidence gate: if confidence < 0.6 return needs_review status (Section 20.3)",
            "Tag aiMetadata.data_source = 'ai' on all AI fields",
            "Implement GET /api/health endpoint",
            "Optional: 15s video upload + 3 keyframe extraction (Section 5.1 video)",
            "Write docs/pipelines/intake.md and docs/pipelines/vision.md",
            "Latency target: Gemini classify < 2s (Section 4.3 budget)",
        ],
        "deliverables": [
            "Working report wizard with photo + GPS",
            "Gemini returns structured JSON with category, severity, department",
            "Issue saved to Firestore issues collection",
            "api_contract.md documents POST /api/reports",
        ],
        "done": [
            "End-to-end: photo -> AI analysis -> editable form -> Firestore write",
            "P95 classify latency < 4s on test image",
            "Invalid/blank images rejected with InvalidMediaCard (Section 20.4)",
        ],
        "verify": [
            "Test with pothole, waste, streetlight sample images",
            "JSON validates against Appendix D schema",
            "GEMINI_API_KEY never exposed in browser network tab",
        ],
    },
    {
        "number": "3",
        "title": "GEO-LOCATION, MAPS & ISSUE DISCOVERY UI",
        "goal": "Google Maps integration, marker clustering, geocoding, landing page, map explorer, issue list.",
        "timing": "Day 2 H6-12 + Day 3 | Section 36 Day 2-3",
        "depends_on": "Phase 2 complete (issues exist in Firestore)",
        "coverage": [
            "Section 5.3 - Geo-location & mapping (Maps JS API, MarkerClusterer, Geocoding)",
            "Section 15 Prompt 3 - Maps integration prompt",
            "Section 22 Routes: /, /map, partial /issues/:id",
            "Section 23 Pipeline 3 - Geo pipeline (reverse geocode, ward, geohash-7)",
            "Section 24 Step 3 - parallel reverse-geocode",
            "Section 27 - GET /api/reports geospatial query",
            "Appendix E Screens 1, 6 - Landing + Map Explorer",
            "Appendix N - MAPS_API_KEY restricted to Cloud Run URL",
        ],
        "official_features": [
            "Feature 3: Geo-location and mapping",
        ],
        "tasks": [
            "Integrate Google Maps JavaScript API + Advanced Markers",
            "Add @googlemaps/markerclusterer with supercluster (Section 5.3)",
            "Color markers by severity: red/orange/yellow/green",
            "Reverse geocode lat/lng to address on report submit (Geo pipeline)",
            "Store GeoPoint + geohash + address on issue doc (Section 28)",
            "Build Landing page / with live issue count, map preview, Report CTA (Appendix E screen 1)",
            "Build Map Explorer /map with filters: category, status, severity",
            "Implement GET /api/reports?lat=&lng=&radius_km=2&status=open",
            "Click marker -> issue preview card with link to detail",
            "Places Autocomplete fallback when GPS weak (Section 5.3)",
            "Manual pin drop on map if GPS unavailable (Section 20.3)",
            "Create geocode_cache collection for TTL caching (Section 28)",
            "Write docs/pipelines/geo.md",
        ],
        "deliverables": [
            "Map shows all submitted issues with clustering",
            "Landing page with stats and CTA",
            "Issues have human-readable addresses",
        ],
        "done": [
            "Map loads on mobile Safari/Chrome over HTTPS",
            "Filters correctly hide/show issue categories",
            "Empty state: 'Be the first reporter' when no issues (Section 20.4)",
        ],
        "verify": [
            "10 test issues visible on map with correct colors",
            "Geocode returns sensible address for test coordinates",
            "Maps API key restricted in Google Cloud Console",
        ],
    },
    {
        "number": "4",
        "title": "FIRESTORE DATA LAYER, REALTIME SYNC & ISSUE DETAIL",
        "goal": "Complete schema, security rules, realtime listeners, issue detail page, my reports, status timeline.",
        "timing": "Day 3 H6-12 + Day 4 morning | Section 36 Day 3-4",
        "depends_on": "Phase 2-3 complete",
        "coverage": [
            "Section 5.5 - Real-time tracking (onSnapshot, status machine, timeline)",
            "Section 10 - Data Model all collections",
            "Section 22 Routes: /issues/:id, /my-reports, /login, /profile",
            "Section 28 - Full database schema, composite indexes, storage paths",
            "Appendix G - Firestore security rules (full implementation)",
            "Appendix E Screens 5, 7 - Issue detail + My Reports",
            "Section 20.4 - Honest empty states on my reports",
        ],
        "official_features": [
            "Feature 5: Real-time issue tracking (partial - timeline + statuses)",
        ],
        "tasks": [
            "Implement full Firestore schema from Section 28 (issues, users, departments, events subcollection)",
            "Deploy firestore.indexes.json composite indexes (status+createdAt, wardId+status, etc.)",
            "Implement firestore.rules from Appendix G with admin custom claims",
            "Status machine: Draft -> Submitted -> Verified -> Assigned -> In Progress -> Resolved -> Closed",
            "Subcollection issues/{id}/events for audit timeline",
            "Firestore onSnapshot on issues collection for realtime map updates",
            "Build Issue Detail page /issues/:id with photo, timeline, share link (Appendix E screen 5)",
            "WhatsApp-shareable public URL /issues/{id}",
            "Build My Reports /my-reports with status chips (Appendix E screen 7)",
            "Build Login /login and Profile /profile with useAuthStore (Section 22)",
            "Seed departments collection with SLA hours (prep for Phase 7 Appendix L)",
            "Implement GET /api/reports/:id with events array",
            "Create users collection on first login with civicPoints: 0",
        ],
        "deliverables": [
            "Realtime map updates when new issue submitted",
            "Issue detail with full status timeline",
            "Firestore rules deployed and tested",
        ],
        "done": [
            "Status transitions write events subcollection entries",
            "Unauthorized users cannot update others' issues",
            "My Reports shows only current user's issues",
        ],
        "verify": [
            "Open two browser tabs - new issue appears without refresh",
            "Security rules reject unauthenticated writes in Firebase emulator or prod test",
            "Share link opens issue detail for anonymous reader",
        ],
    },
    {
        "number": "5",
        "title": "COMMUNITY VERIFICATION & DUPLICATE DETECTION",
        "goal": "Upvote system, verification tiers, dedup agent with geohash + embeddings, merge UX.",
        "timing": "Day 4 H0-6 | Section 36 Day 4",
        "depends_on": "Phase 4 complete",
        "coverage": [
            "Section 5.4 - Community verification (upvote, tiers 1/3/10, anti-gaming)",
            "Section 15 Prompt 4 - Community upvote + dedup prompt",
            "Section 23 Pipelines 4-5 - Dedup + Verification pipelines",
            "Section 29 Model C - gemini-embedding-001 for duplicate detection",
            "Section 27 - POST /api/reports/:id/upvote, POST merge endpoint",
            "Appendix C - upvote endpoint",
        ],
        "official_features": [
            "Feature 4: Community verification",
        ],
        "tasks": [
            "Implement POST /api/reports/:id/upvote idempotent (votes subcollection doc id = userId)",
            "Verification tiers: 1 upvote = Acknowledged, 3 = Community Verified, 10 = Priority Escalation",
            "Rate limit 30 upvotes/hour per user (Section 5.4)",
            "Require auth for upvote; one vote per user per issue",
            "Implement DedupAgent: 50m geohash query + embedding cosine > 0.85 (Section 5.4)",
            "Generate embedding via gemini-embedding-001 on report submit (Section 29 Model C)",
            "If duplicate: return duplicate_suggestion payload (Appendix K response)",
            "Build merge UX: POST /api/reports/:id/merge with target_issue_id",
            "Anti-gaming: account age or 1 prior report required to upvote (Section 26)",
            "Update verificationLevel field on issue doc when thresholds crossed",
            "Display verification badges on issue cards and detail page",
            "Write docs/pipelines/verification.md and dedup notes in vision.md",
        ],
        "deliverables": [
            "Upvote button functional with live count",
            "Community Verified badge at 3 upvotes",
            "Duplicate suggestion when reporting same pothole twice nearby",
        ],
        "done": [
            "Second account upvote increments count in realtime",
            "Duplicate report within 50m suggests merge rather than duplicate pin spam",
            "Rate limit returns 429 with Retry-After (Appendix W)",
        ],
        "verify": [
            "Demo: two devices upvote same issue -> badge appears",
            "Submit same photo at same GPS -> merge suggestion shown",
        ],
    },
    {
        "number": "6",
        "title": "AGENTIC AI ORCHESTRATION (6 AGENTS)",
        "goal": "Implement all 6 agents with deterministic workflow graph, routing, SLA, notifications.",
        "timing": "Day 4 H6-12 | Section 36 Day 4",
        "depends_on": "Phase 2, 5 complete",
        "coverage": [
            "Section 6 - Full agentic design (6.1 six agents, 6.2 orchestration, 6.3 tools partial)",
            "Section 23 Pipelines 4, 6, 9 - Routing, Notification pipelines",
            "Section 24 Steps 6-10 - Dedup through NotifyAgent",
            "Section 29 Models D-G - Priority score, SLA predictor formulas",
            "Appendix H - Full agent chain after createReport",
            "Appendix B - gemini-2.5-flash-lite for status narratives",
        ],
        "official_features": [
            "Evaluation focus: Agentic Depth 20% - primary scoring phase",
        ],
        "tasks": [
            "Agent 1 Intake Triage: SafeSearch + is_civic_issue validation (Section 6.1)",
            "Agent 2 Vision Classifier: already in Phase 2 - wire into orchestrator",
            "Agent 3 Dedup & Cluster: Phase 5 - wire into orchestrator",
            "Agent 4 Routing & SLA: assign departmentId, compute slaDeadline from Appendix L matrix",
            "Agent 5 Citizen Communicator: generate plain-language status messages EN (+ HI stretch)",
            "Agent 6 Insights Analyst: stub for Phase 9 nightly batch",
            "Implement workflow graph: confidence < 0.7 -> review queue branch (Section 6.2)",
            "Priority score formula Section 29 Model G: severity*0.4 + upvotes*0.2 + safety*0.3 + age*0.1",
            "NotifyAgent: write notification on status change (in-app; FCM stretch)",
            "Implement runAgents() orchestrator called after every report create",
            "Log agent steps to issues/{id}/events with type ai_analysis, routing, notify",
            "Template-based status messages by default; Gemini lite for detailed mode (Section 25)",
            "Document agent workflow in docs/architecture.md matching Section 6",
        ],
        "deliverables": [
            "6 agents wired in server orchestrator",
            "Every new report gets department, SLA deadline, priority score automatically",
            "Agent execution logged in issue events timeline",
        ],
        "done": [
            "Low confidence report goes to review queue not public map",
            "SLA deadline visible on issue detail",
            "Agentic workflow diagram ready for docs (content for Phase 15)",
        ],
        "verify": [
            "Trace one report through all 6 agents in events subcollection",
            "Department assignment matches category taxonomy Section 5.2",
        ],
    },
    {
        "number": "7",
        "title": "ADMIN WORKFLOW, RESOLUTION & SLA ENFORCEMENT",
        "goal": "Authority admin panel, status updates, proof photo, SLA breach tracking, reopen flow.",
        "timing": "Day 4 H9-12 + Day 5 morning | Section 36 Day 4-5",
        "depends_on": "Phase 6 complete",
        "coverage": [
            "Section 5.5 - Admin status updates, resolved proof photo, before/after AI optional",
            "Section 22 Routes: /admin, /admin/analytics (partial)",
            "Section 23 Pipeline 7 - Resolution pipeline",
            "Section 27 - POST /api/reports/:id/status, POST reopen",
            "Appendix L - Full SLA matrix by category and severity",
            "Appendix E Screen 10 - Admin panel",
            "Appendix W - FORBIDDEN 403 for non-admin",
        ],
        "official_features": [
            "Feature 5: Real-time issue tracking (complete with admin resolution loop)",
        ],
        "tasks": [
            "Implement admin role via Firebase custom claims or ADMIN_UIDS env (Appendix N)",
            "Build Admin Queue /admin sorted by priorityScore desc",
            "Implement POST /api/reports/:id/status { status, note, proof_image }",
            "Upload proof photo to issues/{id}/proof.jpg",
            "Optional: Gemini before/after comparison Section 29 Model F",
            "SLA breach flag when now > slaDeadline and status not Resolved",
            "Dashboard tile for SLA breaches (prep Phase 8)",
            "Implement POST /api/reports/:id/reopen for unsatisfied citizens",
            "Status notifications via Agent 5 on each transition",
            "Bulk status update for demo (select multiple issues)",
            "Export CSV of open issues from admin panel",
            "Implement Appendix L SLA hours table in routing agent config",
            "Escalation: SLA breach -> priorityScore +25 (Appendix L note)",
        ],
        "deliverables": [
            "Admin can mark In Progress -> Resolved with proof photo",
            "Citizen sees status timeline update in realtime",
            "SLA countdown on issue detail for open issues",
        ],
        "done": [
            "Non-admin gets 403 on status update endpoint",
            "Resolved issue shows proof image on detail page",
            "Reopen flow returns issue to Submitted status",
        ],
        "verify": [
            "Full demo path: report -> verify -> admin resolve -> citizen sees Resolved",
            "SLA breach flagged on intentionally backdated test issue",
        ],
    },
    {
        "number": "8",
        "title": "IMPACT DASHBOARDS & ANALYTICS",
        "goal": "Citizen + admin dashboards, KPIs, charts, ward breakdown, cached aggregates.",
        "timing": "Day 5 H0-6 | Section 36 Day 5",
        "depends_on": "Phase 7 complete (resolved issues for metrics)",
        "coverage": [
            "Section 5.6 - Impact dashboards (KPIs, heatmaps, trends, SLA compliance)",
            "Section 15 Prompt 5 - Dashboard prompt",
            "Section 23 Pipeline 8 - Insights pipeline (aggregates portion)",
            "Section 27 - GET /api/analytics/summary, /hotspots, /trends",
            "Appendix E Screen 8 - Impact dashboard",
            "Section 25 - analytics_daily collection, 15min cache",
        ],
        "official_features": [
            "Feature 6: Impact dashboards",
        ],
        "tasks": [
            "Build Impact Dashboard /dashboard with KPI tiles: open, resolved, avg resolution time",
            "Category pie chart (Chart.js or Recharts)",
            "7-day and 30-day trend line charts",
            "Ward breakdown table if wardId populated",
            "Department SLA compliance percentage tile",
            "Citizen engagement metric: reports per day, upvotes per day",
            "Implement analytics_daily Firestore aggregation (Cloud Function or server cron)",
            "GET /api/analytics/summary with 15min cache (Section 25 L3)",
            "Build Admin Analytics /admin/analytics with heatmap view",
            "AI narrative card placeholder (filled Phase 9)",
            "Honest empty state when no data yet",
        ],
        "deliverables": [
            "Dashboard loads real metrics from Firestore",
            "Charts update when new issue resolved",
            "Admin analytics shows category breakdown",
        ],
        "done": [
            "KPI numbers match manual Firestore count verification",
            "Dashboard performs acceptably with 25+ seed issues",
        ],
        "verify": [
            "Resolve 3 issues -> resolved count increments on dashboard",
            "Export or screenshot dashboard for Google Doc submission",
        ],
    },
    {
        "number": "9",
        "title": "PREDICTIVE INSIGHTS & HOTSPOT INTELLIGENCE",
        "goal": "Hotspot detection, trend analysis, Gemini narrative insights, predictive cards.",
        "timing": "Day 5 H6-9 + Day 6 morning | Section 36 Day 5-6",
        "depends_on": "Phase 8 complete",
        "coverage": [
            "Section 5.7 - Predictive insights (hotspots, trends, recurring issues, preventive zones)",
            "Section 23 Pipeline 8 - Insights pipeline (full)",
            "Section 29 Models D-E - HotspotScorer v1, SLA Predictor v1",
            "Section 6.1 Agent 6 - Insights Analyst nightly batch",
            "Appendix R - Hotspot cells in seed data spec",
        ],
        "official_features": [
            "Feature 7: Predictive insights",
        ],
        "tasks": [
            "Implement HotspotScorer v1: geohash-6 cells with >5 open issues in 7 days flagged (Section 5.7)",
            "Severity weight + recency decay in risk score (Section 29 Model D)",
            "Collection hotspots/{geohash} with issueCount, predictedRisk, updatedAt",
            "GET /api/analytics/hotspots?ward_id=",
            "Trend agent: weekly Gemini summary of emerging categories (gemini-2.5-flash-lite)",
            "GET /api/analytics/trends with narrative + structured data",
            "Dashboard AI insight card with Gemini-generated ward summary",
            "Recurring issue detection: same category same geohash-6 within 30 days",
            "Seasonal waste spike alert rule (demo-grade)",
            "Suggested preventive maintenance zones list on dashboard",
            "Agent 6 nightly cron aggregates and writes insights (Cloud Scheduler stretch)",
            "Document Models D-E in docs/system-design.md",
        ],
        "deliverables": [
            "Hotspot list on dashboard with map overlay",
            "AI insight card with plain-language trend summary",
            "Predictive section visible to judges on demo",
        ],
        "done": [
            "Cluster of 5+ issues triggers hotspot alert",
            "Gemini narrative mentions actual category counts from data not hallucinated",
        ],
        "verify": [
            "Seed 6 issues in small area -> hotspot appears",
            "Trend API returns text referencing real Firestore aggregates",
        ],
    },
    {
        "number": "10",
        "title": "GAMIFICATION & CIVIC ENGAGEMENT",
        "goal": "Points, badges, opt-in leaderboard, streaks, ethics guardrails.",
        "timing": "Day 5 H9-12 | Section 36 Day 5",
        "depends_on": "Phase 5, 7 complete",
        "coverage": [
            "Section 5.8 - Gamification (points, badges, leaderboard, ethics)",
            "Appendix O - Full point economy table",
            "Appendix E Screen 9 - Leaderboard",
            "Section 27 - GET /api/leaderboard",
        ],
        "official_features": [
            "Feature 8: Gamification for citizen engagement",
        ],
        "tasks": [
            "Implement civicPoints on users collection (Appendix O values)",
            "+10 quality report conf>0.8, +15 Community Verified, +15 merge, +5 upvote, +25 resolved",
            "Badges array on user: First Report, Neighborhood Voice, Duplicate Hunter, etc.",
            "Award badges on trigger events server-side",
            "Build Leaderboard /leaderboard opt-in via leaderboardOptIn field",
            "GET /api/leaderboard?period=weekly|alltime",
            "7-day reporting streak detection (+30 points)",
            "Profile page shows private badges and points by default (Section 5.8 ethics)",
            "Transparent rules page /terms or /gamification-rules",
            "No public trust score affecting issue credibility (Appendix O ethics note)",
            "Display points earned toast on report submit and upvote",
        ],
        "deliverables": [
            "Users earn points and badges through real actions",
            "Opt-in leaderboard shows weekly champions",
            "Ethics rules page published",
        ],
        "done": [
            "Gamification cannot be gamed without real reports (rate limits)",
            "Leaderboard hidden unless user opts in",
        ],
        "verify": [
            "Submit report -> +10 points on profile",
            "3 upvotes on issue -> reporter gets +15 Neighborhood Voice badge",
        ],
    },
    {
        "number": "11",
        "title": "CITIZEN AI ASSISTANT (FUNCTION CALLING CHAT)",
        "goal": "Chat assistant with Gemini function calling - never hallucinates issue data.",
        "timing": "Day 6 H0-3 | Section 36 Day 6",
        "depends_on": "Phase 4, 9 complete",
        "coverage": [
            "Section 6.3 - Function calling tools list",
            "Section 15 Prompt 6 - Agent chat prompt",
            "Section 27 - POST /api/ai/chat",
            "Section 29 - Chat uses gemini-2.5-flash-lite with tools",
            "Appendix V - All 7 tool definitions",
            "Appendix E Screen 11 - AI Assistant Chat",
            "Appendix B - flash-lite for chat",
        ],
        "official_features": [
            "Evaluation: Agentic Depth - tool-grounded assistant",
        ],
        "tasks": [
            "Build /assistant chat UI with message history",
            "Implement POST /api/ai/chat with Gemini function calling",
            "Tool: findNearbyIssues(lat, lng, radius_km, status?)",
            "Tool: getIssueById(issue_id)",
            "Tool: searchIssues(query, ward_id?)",
            "Tool: getHotspots(ward_id)",
            "Tool: getMyReports(user_id from auth)",
            "Tool: getDepartmentInfo(department_id)",
            "Tool: explainStatus(status enum)",
            "System prompt Appendix V: Never invent data; always call tools",
            "Bilingual EN/HI response based on user message language",
            "Rate limit 20 chat requests/min (Section 26)",
        ],
        "deliverables": [
            "Chat answers 'issues near me' with real Firestore data",
            "Chat explains issue status for a given ID",
        ],
        "done": [
            "Ask about fake issue ID -> tool returns NOT_FOUND not hallucination",
            "Nearby search returns actual map issues within radius",
        ],
        "verify": [
            "Demo script step 2:10 - chat query during judge demo (Appendix I)",
        ],
    },
    {
        "number": "12",
        "title": "ISSUE THREADS & OPEN311 INTEROPERABILITY",
        "goal": "Thread clustering, Gemini thread summaries, Open311 export adapter.",
        "timing": "Day 6 H3-6 | Section 36 Day 6",
        "depends_on": "Phase 5, 6 complete",
        "coverage": [
            "Section 11 - Open311 GeoReport v2 interoperability",
            "Section 23 - Thread clustering (CivicThreads pattern)",
            "Section 27 - GET /threads, POST /open311/export/:id, GET /departments",
            "Appendix M - Open311 service code mapping table",
            "Section 22 Route /threads/:id",
        ],
        "official_features": [],
        "tasks": [
            "Collection threads with issueIds[], summary, centroid, category",
            "Cluster issues by embedding similarity + proximity into threads",
            "Gemini auto-summary on thread update (CivicThreads pattern Section 3.2)",
            "Build Thread Detail /threads/:id with linked issues and AI overview",
            "Implement Open311 export POST /open311/export/:id (Section 11)",
            "Map internal categories to Appendix M service codes 001-050",
            "GET /departments returns Open311-compatible service catalog",
            "Document Open311 compatibility in docs/miscellaneous/open311.md",
            "Optional: GET /api/threads on map as heatmap overlay",
        ],
        "deliverables": [
            "Related issues grouped into viewable threads",
            "Open311 JSON export for any issue ID",
            "Department service catalog API",
        ],
        "done": [
            "Export JSON validates against Open311 GeoReport v2 field names",
            "Thread summary updates when new related issue added",
        ],
        "verify": [
            "Export one issue -> inspect service_code matches Appendix M",
        ],
    },
    {
        "number": "13",
        "title": "PERFORMANCE, CACHING, SECURITY & RESILIENCE",
        "goal": "L1-L5 caching, rate limits, waiting room, error codes, production hardening.",
        "timing": "Day 6 H6-9 | Section 36 Day 6",
        "depends_on": "Phases 2-12 functional",
        "coverage": [
            "Section 4.3-4.4 - Latency budget and optimizations",
            "Section 16 - All risks and mitigations implemented",
            "Section 25 - Performance & Caching L1-L5 full implementation",
            "Section 26 - Security 7 layers + waiting room",
            "Appendix W - All error codes and HTTP statuses",
            "Appendix G - Hardened security rules review",
            "Section 22 Route /waiting - WaitingRoom page",
        ],
        "official_features": [],
        "tasks": [
            "L1 RequestContext per-request geocode cache (Section 25)",
            "L2 In-memory Gemini cache by image SHA256 TTL 1hr max 200 entries",
            "L3 Redis optional for rate limits and analytics cache (Section 25)",
            "L4 analytics_daily pre-aggregation (verify Phase 8)",
            "L5 Static ward GeoJSON and taxonomy in /public",
            "express-rate-limit: 10 reports/day, 30 upvotes/hr, 20 chat/min (Section 26)",
            "Vision SafeSearch on all uploads (Section 26 Layer 4)",
            "Build /waiting page for 429/503 with retry countdown (LogiFlow pattern)",
            "Implement all Appendix W error codes with consistent JSON error body",
            "NEEDS_REVIEW 202, DUPLICATE_SUGGESTED 200, INVALID_MEDIA 400, etc.",
            "Parallel Promise.all upload+geocode (Section 4.4)",
            "P95 latency test: 10 concurrent reports < 5s (Section 33)",
            "Mitigate Section 16 risks: JSON mode uses flash not flash-image, Maps key restricted",
            "Health check GET /api/health with firestore connected status",
        ],
        "deliverables": [
            "Rate limiting active on production",
            "Waiting room UX for overload",
            "Latency within Section 4.3 budget",
        ],
        "done": [
            "No API keys in client bundle verified",
            "429 returns proper Retry-After header",
        ],
        "verify": [
            "Run 11th report in one day -> rate limited",
            "Gemini cache hit on identical image re-upload shows lower latency",
        ],
    },
    {
        "number": "14",
        "title": "FRONTEND COMPLETE - ALL 18 ROUTES & PWA POLISH",
        "goal": "Finish every route from Section 22, all Appendix E screens, mobile PWA, accessibility.",
        "timing": "Day 6 H9-12 | Section 36 Day 6",
        "depends_on": "Phases 3-13 complete",
        "coverage": [
            "Section 22 - All 18 routes complete with Zustand stores",
            "Appendix E - All 11 screens polished",
            "Section 20.4 - Honest empty states on every list view",
            "Section 4 - Mobile-first PWA, offline draft queue IndexedDB stretch",
        ],
        "official_features": [
            "All 8 features visible in UI somewhere",
        ],
        "tasks": [
            "Verify all routes: /, /report, /map, /issues/:id, /my-reports, /dashboard, /leaderboard, /assistant, /admin, /admin/analytics, /threads/:id, /login, /profile, /terms, /privacy, /waiting",
            "useAuthStore, useIssueStore, useMapStore, useDashboardStore wired (Section 22)",
            "Mobile responsive QA on iPhone Safari and Android Chrome",
            "PWA manifest + service worker for install prompt stretch",
            "WCAG AA contrast on severity badges (Section 33)",
            "Alt text on all issue images",
            "Loading skeletons and error boundaries on every async view",
            "IndexedDB offline draft queue for report in progress stretch",
            "Legal pages /terms /privacy",
            "Consistent design system: colors, typography, severity chips",
            "404 page for unknown routes",
        ],
        "deliverables": [
            "Every Section 22 route navigable",
            "Mobile demo-ready UI",
            "No broken links or blank screens",
        ],
        "done": [
            "Complete user journey without dead ends: landing -> report -> map -> detail -> dashboard",
            "Appendix E all 11 screens implemented",
        ],
        "verify": [
            "Click through all nav links on mobile viewport 375px width",
            "Browser MCP E2E smoke test on deployed URL",
        ],
    },
    {
        "number": "15",
        "title": "DOCUMENTATION, DIAGRAMS & LOGIFLOW PARITY",
        "goal": "Complete docs/ folder, 16 mermaid diagrams, api_contract, LogiFlow-grade documentation.",
        "timing": "Day 6 H4-8 (parallel with Phase 14) | Section 36 Day 6",
        "depends_on": "Architecture stable from Phases 1-13",
        "coverage": [
            "Section 17 - Reference links in docs/README.md",
            "Section 19 - LogiFlow parity targets (8000+ doc lines goal)",
            "Section 30 - Full repository structure documentation",
            "Section 32 - All 16 diagram specifications",
            "Appendix Q - Match LogiFlow documentation depth",
            "Appendix S - Mermaid 01-system-architecture source",
            "Appendix T - Update TODO.md with completed items",
            "docs/pipelines/ - intake, vision, geo, verification, insights.md",
        ],
        "official_features": [],
        "tasks": [
            "Write docs/architecture.md from Sections 21, 22, 23 (LogiFlow architecture.md style)",
            "Write docs/system-design.md from Sections 20, 25 (LogiFlow system-design.md style)",
            "Write docs/deployment.md from Section 31",
            "Write docs/miscellaneous/api_contract.md from Section 27 + all appendices C,K,W",
            "Create docs/diagrams/mermaid/ 01 through 16 per Section 32 list",
            "Run render-diagrams.sh -> docs/diagrams/png/ exports",
            "docs/diagrams/README.md index like LogiFlow",
            "docs/ppt-info/slides/ 01-15 from Appendix P",
            "docs/README.md central index like LogiFlow docs/README.md",
            "Update README.md with architecture PNG, user journey PNG, live demo links",
            "Embed diagram 04-agent-workflow and 01-system-architecture in README",
            "Target 8000+ lines documentation cumulative (Section 19 stretch)",
        ],
        "deliverables": [
            "docs/ folder matches Section 30 structure",
            "16 PNG diagrams exported",
            "api_contract.md complete with every endpoint",
        ],
        "done": [
            "docs/README.md links all documents",
            "Every Section 32 diagram has .mmd source and .png export",
        ],
        "verify": [
            "Compare docs structure side-by-side with LogiFlow-Solution-Challenge-2026/docs/",
        ],
    },
    {
        "number": "16",
        "title": "DEVOPS, CI/CD & CLOUD DEPLOYMENT",
        "goal": "Publish AI Studio to Cloud Run, gcloud deploy script, GitHub Actions, env prod, health monitoring.",
        "timing": "Day 6 H8-10 + Day 7 H0-1 | Section 36 Day 6-7",
        "depends_on": "Phases 1-15 complete",
        "coverage": [
            "Section 8.2-8.5 - AI Studio build, publish, deployment checklist",
            "Section 9 - gcloud CLI, firebase deploy, github MCP",
            "Section 31 - Full deployment runbook all paths A/B/C",
            "Section 35 - Makefile deploy, health targets",
            "Appendix N - Production env vars set in Cloud Run",
            "Section 16 - Deployment URL downtime risk mitigation",
        ],
        "official_features": [],
        "tasks": [
            "PATH A: AI Studio Publish -> Get Started -> Publish App -> copy Cloud Run URL",
            "PATH B: Standard tier with project-6d6f652b-7066-4341-806 if Starter ineligible",
            "PATH C: scripts/deploy-cloud-run.sh gcloud run deploy civicpulse-api asia-south1",
            "Cloud Run profile: 1 CPU, 512Mi-1Gi, min-instances 0 or 1, max 3, timeout 60s (Section 31)",
            "Set all Appendix N env vars on Cloud Run service",
            "Restrict MAPS_API_KEY to production URL + localhost",
            "Create .github/workflows/deploy.yml on push to main",
            "Create .github/workflows/lint.yml",
            "make deploy and make health commands working",
            "UptimeRobot or manual cron ping GET /api/health every 5 min during evaluation",
            "Verify camera + GPS on HTTPS production URL (Section 8.5 checklist)",
            "Do NOT delete AI Studio app until evaluation ends (Section 16)",
            "Document production URL in README and docs/deployment.md",
        ],
        "deliverables": [
            "Stable public HTTPS Cloud Run URL",
            "GitHub Actions CI green",
            "deployment.md with exact URLs and env table",
        ],
        "done": [
            "Section 8.5 deployment checklist all boxes checked",
            "Production URL loads on mobile with camera permission",
        ],
        "verify": [
            "curl production /api/health -> status ok",
            "Submit real report on production URL end-to-end",
        ],
    },
    {
        "number": "17",
        "title": "TESTING, QA & DEMO SEED DATA",
        "goal": "Unit/integration/E2E tests, seed 25 demo issues, accessibility audit, load smoke test.",
        "timing": "Day 6 H10-12 + Day 7 H1-2 | Section 36 Day 6-7",
        "depends_on": "Phase 16 deployed to production",
        "coverage": [
            "Section 33 - Full testing & QA strategy",
            "Appendix R - Seed 25 demo issues specification exactly",
            "Appendix I - Rehearse demo on seeded data",
            "Section 13 - QA before submission",
        ],
        "official_features": [],
        "tasks": [
            "Unit tests: Zod schema, priority score formula, SLA deadline calc, geohash encode",
            "Integration test: POST /api/reports fixture image -> expect 201 + schema fields",
            "Agent tests: mock Gemini; verify low confidence -> review queue branch",
            "E2E via browser MCP: full report flow on production URL",
            "scripts/seed-demo-issues.ts: 25 issues per Appendix R breakdown",
            "5 potholes, 4 waste, 3 streetlights, 3 water leaks, 2 road_damage, 2 drainage, 2 resolved with proof, 2 community-verified",
            "All isDemo: true, wardId DEMO_WARD_001, within 2km cluster",
            "Load smoke: 10 concurrent POST /api/reports P95 < 5s",
            "Manual QA checklist Section 33: mobile Safari, Android Chrome, admin flow",
            "WCAG AA audit on severity colors",
            "Fix all P0 bugs before Phase 18",
        ],
        "deliverables": [
            "25 demo issues on production for judge exploration",
            "Test suite passing in CI",
            "QA sign-off checklist completed",
        ],
        "done": [
            "Demo ward shows rich map cluster for judges",
            "No P0 bugs open",
        ],
        "verify": [
            "Run Appendix I demo script once on production with seed data",
            "make test passes locally and in CI",
        ],
    },
    {
        "number": "18",
        "title": "SUBMISSION PACKAGE - GITHUB, GOOGLE DOC, BLOCKSEBLOCK",
        "goal": "Prepare and submit all mandatory hackathon deliverables with presentation kit.",
        "timing": "Day 7 H1-3 | Section 36 Day 7 | DEADLINE 2:00 PM",
        "depends_on": "Phases 16-17 complete",
        "coverage": [
            "Section 14 - All mandatory submission deliverables",
            "Section 12 - Evaluation matrix addressed in Google Doc narrative",
            "Appendix J - Google Doc 10-section template",
            "Appendix P - 15-slide presentation kit",
            "Appendix A - Evaluation criteria explicitly mapped in doc",
            "Appendix F - Competitive matrix in doc",
            "Section 34 - Business impact metrics in doc",
            "BlockseBlock submission steps from hackathon PDF",
        ],
        "official_features": [
            "Document all 8 official features with screenshots in Google Doc",
        ],
        "tasks": [
            "GitHub repo final polish: README with live URL, architecture diagram, team, stack",
            "Tag release v1.0.0-submission",
            "Write Google Doc per Appendix J all 10 sections with public link",
            "Section 1: Problem Statement Selected - Community Hero",
            "Section 2: Solution Overview 300 words",
            "Section 3: Key Features - all 8 with screenshots from production",
            "Section 4: Technologies Used",
            "Section 5: Google Technologies Utilized (AI Studio, Gemini, Cloud Run, Firestore, Auth, Storage, Maps)",
            "Section 6-7: Embed architecture + agent workflow PNGs",
            "Section 8: Live URL + GitHub URL",
            "Section 9: Team members and roles (Appendix U)",
            "Section 10: Future roadmap ADK, Open311, multilingual voice",
            "Build 15 slides from Appendix P in Google Slides or PPT",
            "BlockseBlock: Dashboard -> Create Project -> select Community Hero problem",
            "Enter Deployed Application Link (Cloud Run URL)",
            "Enter GitHub Repository Link",
            "Enter Google Doc Link (anyone with link can view)",
            "Toggle both notes -> Final Submit (irreversible - verify first)",
            "Verify all links work in incognito browser",
        ],
        "deliverables": [
            "Three submission links live and accessible",
            "BlockseBlock shows submitted status",
            "Google Doc version history available for jury",
        ],
        "done": [
            "Section 14 checklist fully checked",
            "All three mandatory links tested incognito",
            "Submitted before June 29 2026 2:00 PM",
        ],
        "verify": [
            "Open all 3 links on phone without login - all load",
            "Google Doc covers every evaluation criterion from Appendix A",
        ],
    },
    {
        "number": "19",
        "title": "FINAL DEMO, LAUNCH & PROJECT CLOSURE",
        "goal": "Rehearse judge demo, mentor-ready walkthrough, monitor production, close project with retrospective.",
        "timing": "Day 7 H0-2 rehearsal + post-submit monitoring | Section 36 + Section 18",
        "depends_on": "Phase 18 submitted",
        "coverage": [
            "Section 18 - Conclusion and winning formula delivered",
            "Appendix I - 3-minute judge demo script (full rehearsal twice)",
            "Section 36 Day 7 - Final buffer and deadline",
            "Appendix T - All TODO items checked",
            "Hackathon mentor session insights applied (June 24 retrospective)",
        ],
        "official_features": [],
        "tasks": [
            "Rehearse Appendix I demo script twice timed (target under 3 minutes)",
            "0:00 landing stats -> 0:20 report photo -> 0:45 AI fill -> 1:10 map pin",
            "1:30 second device upvote -> 1:50 dashboard -> 2:10 AI chat -> 2:30 admin resolve -> 2:50 GitHub+Doc+stack",
            "Prepare QR code slide pointing to production URL for jury",
            "Monitor Cloud Run logs during evaluation period",
            "Keep AI Studio app published - do not delete",
            "Respond to any jury requests for additional evidence",
            "Team retrospective: what shipped vs master plan",
            "Mark all Phase 0-19 checkboxes complete in this PDF",
            "Optional: post-hackathon roadmap - ADK full deploy, Capacitor APK, BigQuery, Vertex fine-tuning",
            "Celebrate - CIVICPULSE AI shipped",
        ],
        "deliverables": [
            "Flawless 3-minute demo capability",
            "Production stable through evaluation window",
            "All phase checkboxes complete",
        ],
        "done": [
            "Demo rehearsed twice under 3 minutes",
            "Appendix T TODO.md all items checked",
            "Section 18 conclusion vision achieved: shipped not slideware",
        ],
        "verify": [
            "Record demo video as backup for presentation",
            "Final read of Section 18 winning formula - did we deliver agentic depth + Google stack + impact?",
        ],
    },
]


def render_coverage_index(pdf: PhasePDF) -> None:
    pdf.add_page()
    pdf.h1("MASTER PLAN COVERAGE INDEX (100% MAPPING)")
    pdf.p(
        "Every section (1-36) and appendix (A-W) from Community-Hero-Master-Plan.pdf "
        "is assigned to exactly one primary phase below. No content is omitted."
    )
    pdf.table_block(
        ["ID", "Master Plan Content", "Phase"],
        [list(row) for row in COVERAGE_INDEX],
        widths=(28, 112, 40),
    )


def render_phase_timeline(pdf: PhasePDF) -> None:
    pdf.add_page()
    pdf.h1("PHASE TIMELINE vs 7-DAY SPRINT (SECTION 36)")
    timeline = [
        ("0", "Foundation", "Day 0", "2-3h"),
        ("1", "Scaffold & GCP", "Day 1 AM", "4h"),
        ("2", "Report + Vision AI", "Day 1 PM - Day 2 AM", "10h"),
        ("3", "Maps & Geo", "Day 2 PM - Day 3 AM", "8h"),
        ("4", "Firestore Realtime", "Day 3 PM - Day 4 AM", "6h"),
        ("5", "Community Verify", "Day 4 AM", "6h"),
        ("6", "6 Agents", "Day 4 PM", "6h"),
        ("7", "Admin & SLA", "Day 4 PM - Day 5 AM", "4h"),
        ("8", "Dashboards", "Day 5 AM", "6h"),
        ("9", "Predictive Insights", "Day 5 PM - Day 6 AM", "4h"),
        ("10", "Gamification", "Day 5 PM", "3h"),
        ("11", "AI Chat", "Day 6 AM", "3h"),
        ("12", "Threads & Open311", "Day 6 AM", "3h"),
        ("13", "Security & Perf", "Day 6 AM-PM", "4h"),
        ("14", "Frontend Polish", "Day 6 PM", "4h"),
        ("15", "Docs & Diagrams", "Day 6 PM", "4h"),
        ("16", "Deploy & CI/CD", "Day 6 PM - Day 7 AM", "4h"),
        ("17", "Testing & Seed", "Day 7 AM", "3h"),
        ("18", "Submission", "Day 7 AM-2PM", "3h"),
        ("19", "Demo & Closure", "Day 7 + eval period", "2h+"),
    ]
    pdf.table_block(
        ["Phase", "Title", "Sprint Day", "Hours"],
        [list(row) for row in timeline],
        widths=(14, 72, 44, 20),
    )


def render_official_features_matrix(pdf: PhasePDF) -> None:
    pdf.add_page()
    pdf.h1("OFFICIAL 8 HACKATHON FEATURES -> PHASE MAP")
    features = [
        ("1", "Image and video-based reporting", "Phase 2", "Phase 14 UI"),
        ("2", "AI-powered issue categorization", "Phase 2", "Phase 6 Agent 2"),
        ("3", "Geo-location and mapping", "Phase 3", "Phase 4 geo fields"),
        ("4", "Community verification", "Phase 5", "Phase 10 points"),
        ("5", "Real-time issue tracking", "Phase 4, 7", "Phase 6 notify"),
        ("6", "Impact dashboards", "Phase 8", "Phase 9 insights"),
        ("7", "Predictive insights", "Phase 9", "Phase 6 Agent 6"),
        ("8", "Gamification", "Phase 10", "Phase 14 leaderboard UI"),
    ]
    pdf.table_block(
        ["#", "Official Feature (Section 2.3)", "Primary Phase", "Also Covered"],
        [list(row) for row in features],
        widths=(10, 78, 28, 44),
    )


def render_master_checklist(pdf: PhasePDF) -> None:
    pdf.add_page()
    pdf.h1("ROLLING MASTER CHECKLIST (APPENDIX T - ALL PHASES)")
    pdf.p("Copy to repo TODO.md. Check each item as the corresponding phase completes.")
    all_todos = []
    for phase in PHASES:
        all_todos.append(f"PHASE {phase['number']} COMPLETE: {phase['title']}")
        for task in phase["done"]:
            all_todos.append(f"  [ ] P{phase['number']} Done: {task}")
    for item in all_todos:
        pdf.p(item)


def build_pdf() -> None:
    pdf = PhasePDF()
    pdf.cover()
    render_coverage_index(pdf)
    render_phase_timeline(pdf)
    render_official_features_matrix(pdf)

    pdf.add_page()
    pdf.h1("HOW TO USE THIS DOCUMENT")
    pdf.p("1. Complete phases in order 0 -> 19. Do not skip.")
    pdf.p("2. For each phase: read listed Master Plan sections in Community-Hero-Master-Plan.pdf.")
    pdf.p("3. Execute every Build Task checkbox.")
    pdf.p("4. Verify all Definition of Done items before advancing.")
    pdf.p("5. Run Verification checklist - if any fail, stay in current phase.")
    pdf.p("6. Mark phase complete in Rolling Master Checklist at end of this PDF.")
    pdf.p("7. Use Cursor + AI Studio + MCP tools referenced in Master Plan Section 9.")

    for phase in PHASES:
        pdf.render_phase(phase)

    render_master_checklist(pdf)

    pdf.add_page()
    pdf.h1("APPENDIX: MASTER PLAN SECTION QUICK REFERENCE")
    pdf.p("Sections 1-36 and Appendices A-W are fully distributed across Phases 0-19.")
    pdf.p("If unsure where a topic lives, consult the Coverage Index at the start of this PDF.")
    pdf.p("Source document: Community-Hero-Master-Plan.pdf (~61 pages, ~36 sections, 23 appendices).")
    pdf.p("This phase plan adds: timelines, checkboxes, dependencies, verification gates, and 100% coverage mapping.")
    pdf.p("PROJECT END: Phase 19 complete + BlockseBlock submitted = Community Hero project delivered.")

    pdf.output(str(OUTPUT))
    size_kb = OUTPUT.stat().st_size // 1024
    print(f"Generated: {OUTPUT} ({size_kb} KB)")


if __name__ == "__main__":
    build_pdf()
