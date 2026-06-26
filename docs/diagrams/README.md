# Diagrams — Community Hero

Mermaid sources and PNG exports for Section 32 (16 diagrams).

## Render

```bash
make diagrams
# or
bash scripts/render-diagrams.sh
```

Requires Node.js. Uses `npx @mermaid-js/mermaid-cli` when available.

Manual fallback: https://mermaid.live — paste `.mmd` content, export PNG to `png/`.

## Index

| # | Mermaid | PNG | Topic |
|---|---------|-----|-------|
| 01 | [01-system-architecture.mmd](mermaid/01-system-architecture.mmd) | png/01-system-architecture.png | End-to-end topology |
| 02 | [02-user-journey.mmd](mermaid/02-user-journey.mmd) | png/02-user-journey.png | Citizen journey |
| 03 | [03-report-wizard-flow.mmd](mermaid/03-report-wizard-flow.mmd) | png/03-report-wizard-flow.png | 3-step wizard |
| 04 | [04-agent-workflow.mmd](mermaid/04-agent-workflow.mmd) | png/04-agent-workflow.png | 6-agent pipeline |
| 05 | [05-report-intake.mmd](mermaid/05-report-intake.mmd) | png/05-report-intake.png | API sequence |
| 06 | [06-upvote-verification.mmd](mermaid/06-upvote-verification.mmd) | png/06-upvote-verification.png | Verification tiers |
| 07 | [07-admin-resolution.mmd](mermaid/07-admin-resolution.mmd) | png/07-admin-resolution.png | Admin workflow |
| 08 | [08-firestore-schema.mmd](mermaid/08-firestore-schema.mmd) | png/08-firestore-schema.png | Firestore ERD |
| 09 | [09-gamification-flow.mmd](mermaid/09-gamification-flow.mmd) | png/09-gamification-flow.png | Points + badges |
| 10 | [10-ai-assistant-tools.mmd](mermaid/10-ai-assistant-tools.mmd) | png/10-ai-assistant-tools.png | Chat tools |
| 11 | [11-open311-export.mmd](mermaid/11-open311-export.mmd) | png/11-open311-export.png | Open311 mapping |
| 12 | [12-deployment.mmd](mermaid/12-deployment.mmd) | png/12-deployment.png | Cloud Run deploy |
| 13 | [13-analytics-pipeline.mmd](mermaid/13-analytics-pipeline.mmd) | png/13-analytics-pipeline.png | Analytics flow |
| 14 | [14-security-layers.mmd](mermaid/14-security-layers.mmd) | png/14-security-layers.png | Security layers |
| 15 | [15-mobile-pwa-architecture.mmd](mermaid/15-mobile-pwa-architecture.mmd) | png/15-mobile-pwa-architecture.png | Mobile PWA |
| 16 | [16-evaluation-alignment.mmd](mermaid/16-evaluation-alignment.mmd) | png/16-evaluation-alignment.png | Hackathon criteria |

Legacy aliases (same content): `05-report-intake-sequence.mmd`, `12-deployment-topology.mmd`.
