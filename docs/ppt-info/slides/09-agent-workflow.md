# Slide 09 — Agent workflow

**Title:** 6-agent orchestration

**Diagram:** Embed `docs/diagrams/png/04-agent-workflow.png`

**Agents:** Intake → Vision → Dedup → Routing (SLA + priority) → Communicator → Insights (batch)  
**Branches:** Low confidence (&lt; 0.6) → Draft review queue; duplicates → merge suggestions

## Speaker notes

Emphasize conditional edges — this is agentic, not a single prompt.
