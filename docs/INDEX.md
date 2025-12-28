# Mollei Documentation Index

> **Last Updated**: 12-28-25 10:38PM PST
> **Purpose**: Single source of truth for documentation structure and hierarchy

---

## Document Hierarchy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         MOLLEI DOCUMENTATION                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  TIER 1: STRATEGIC AUTHORITY                                              │
│  ───────────────────────────                                              │
│  The source of truth for product direction. All other docs defer here.    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │  NORTHSTAR.md                                                   │      │
│  │  • North Star metric (WRU-ETI)                                  │      │
│  │  • Target users & personas                                      │      │
│  │  • Phase boundaries (MVP → Growth)                              │      │
│  │  • What we build / explicitly don't build                       │      │
│  │  • Success metrics & validation gates                           │      │
│  └─────────────────────────────────────────────────────────────────┘      │
│                              │                                            │
│                              ▼                                            │
│  TIER 2: IMPLEMENTATION                                                   │
│  ──────────────────────                                                   │
│  How we build what the North Star defines.                                │
│                                                                           │
│  ┌───────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │  ARCHITECTURE_BLUEPRINT.md        │  │  SECURITY_ARCHITECTURE.md    │  │
│  │  (with architecture/ modules)     │  │                              │  │
│  │  • Agent topology (5 agents)      │  │  • Threat model (OWASP)      │  │
│  │  • Custom pipeline orchestration  │  │  • Authentication/authz      │  │
│  │  • State schema (Zod)             │  │  • Trust boundaries          │  │
│  │  • Self-correction patterns       │  │  • Audit & incident response │  │
│  │  • OpenTelemetry observability    │  │  • Security checklist        │  │
│  └───────────────────────────────────┘  └──────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  TIER 3: RESEARCH & OPTIMIZATION                                          │
│  ───────────────────────────────                                          │
│  Active work, research, and optimization.                                 │
│                                                                           │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐       │
│  │  OPTIMIZATION_PLAN.md        │  │  EMOTIONAL_AI_METHODOLOGY.md │       │
│  │                              │  │                              │       │
│  │  • Latency targets (<3s)     │  │  • Research foundations      │       │
│  │  • Model selection rationale │  │  • Ethical approach          │       │
│  │  • Implementation roadmap    │  │  • Academic citations        │       │
│  │  • Quality trade-offs        │  │  • Design principles         │       │
│  └──────────────────────────────┘  └──────────────────────────────┘       │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐       │
│  │  ARCHITECTURE_RESEARCH_INSIGHTS.md                             │       │
│  │                                                                │       │
│  │  • Industry pattern validation      • Competitive analysis     │       │
│  │  • Academic research citations      • Gap identification       │       │
│  │  • Risk assessment                  • External references      │       │
│  └────────────────────────────────────────────────────────────────┘       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Blueprint Modules

The ARCHITECTURE_BLUEPRINT.md has been modularized into focused documents in `docs/architecture/`:

```
ARCHITECTURE_BLUEPRINT.md (Core - ~624 lines)
    │
    ├── architecture/PIPELINE_ORCHESTRATION.md (1,397 lines)
    │   • State schema (Zod-based)
    │   • Pipeline orchestrator implementation
    │   • Microsoft AI Agent Design Patterns
    │   • Self-correction patterns
    │   • Performance optimization
    │
    ├── architecture/RESILIENCE_PATTERNS.md (247 lines)
    │   • Circuit breaker configuration
    │   • Fallback chains per agent
    │   • Timeout handling
    │   • Idempotency patterns
    │
    ├── architecture/AGENT_PROMPTS.md (1,231 lines)
    │   • System prompts for all 5 agents
    │   • JTBD framework (job_to_be_done, success_criteria)
    │   • 21 few-shot examples
    │   • Edge case handling
    │
    ├── architecture/IMPLEMENTATION_SCAFFOLD.md (646 lines)
    │   • Next.js directory structure
    │   • BaseAgent class
    │   • Agent implementations
    │   • API routes
    │
    ├── architecture/OBSERVABILITY.md (2,256 lines)
    │   • Trace architecture and events
    │   • OpenTelemetry handler (primary)
    │   • LangSmith handler (optional)
    │   • Cost aggregator
    │   • PII sanitization
    │   • North Star instrumentation (WRU-ETI)
    │
    └── architecture/TESTING_STRATEGY.md (240 lines)
        • Test categories and coverage
        • Vitest configuration
        • Golden datasets for safety
        • Integration tests
```

---

## Quick Reference

| Document | Tier | Purpose | When to Use |
|----------|------|---------|-------------|
| [NORTHSTAR.md](NORTHSTAR.md) | 1 | Strategic direction | Product decisions, prioritization, metrics |
| [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) | 2 | Technical implementation | Building agents, orchestration, resilience |
| ↳ [architecture/PIPELINE_ORCHESTRATION.md](architecture/PIPELINE_ORCHESTRATION.md) | 2 | Pipeline details | State schema, orchestrator, patterns |
| ↳ [architecture/RESILIENCE_PATTERNS.md](architecture/RESILIENCE_PATTERNS.md) | 2 | Failure handling | Circuit breakers, fallbacks, timeouts |
| ↳ [architecture/AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md) | 2 | Agent contracts | System prompts, JTBD, examples |
| ↳ [architecture/IMPLEMENTATION_SCAFFOLD.md](architecture/IMPLEMENTATION_SCAFFOLD.md) | 2 | Code structure | Directory layout, base classes, routes |
| ↳ [architecture/OBSERVABILITY.md](architecture/OBSERVABILITY.md) | 2 | Tracing & metrics | OpenTelemetry, LangSmith, North Star |
| ↳ [architecture/TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md) | 2 | Test patterns | Vitest, golden datasets, integration |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | 2 | Security patterns | Auth, threats, compliance, incident response |
| [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) | 3 | Performance work | Latency optimization, model selection |
| [EMOTIONAL_AI_METHODOLOGY.md](EMOTIONAL_AI_METHODOLOGY.md) | 3 | Research basis | Understanding approach, ethics, citations |
| [ARCHITECTURE_RESEARCH_INSIGHTS.md](ARCHITECTURE_RESEARCH_INSIGHTS.md) | 3 | Architecture validation | Pattern validation, competitive analysis |

---

## Decision Authority

When documents conflict, defer to lower tier number:

```
Tier 1 (NORTHSTAR) > Tier 2 (Blueprint/Security) > Tier 3 (Optimization/Methodology)
```

**Example**: If NORTHSTAR says "optimize for outcomes over engagement" and another doc suggests engagement metrics, NORTHSTAR wins.

---

## Document Dependencies

```
NORTHSTAR.md
    │
    ├──► ARCHITECTURE_BLUEPRINT.md (implements North Star requirements)
    │    │
    │    ├──► architecture/*.md (modular implementation details)
    │    │
    │    ├──► SECURITY_ARCHITECTURE.md (secures the architecture)
    │    │
    │    └──► ARCHITECTURE_RESEARCH_INSIGHTS.md (validates patterns)
    │
    ├──► OPTIMIZATION_PLAN.md (optimizes against North Star metrics)
    │
    └──► EMOTIONAL_AI_METHODOLOGY.md (research foundation for North Star)
```

---

## Current State

| Document | Status | Last Updated | Lines |
|----------|--------|--------------|-------|
| NORTHSTAR.md | Active | December 2025 | — |
| ARCHITECTURE_BLUEPRINT.md | Active (Modularized) | December 2025 | ~624 |
| ↳ architecture/PIPELINE_ORCHESTRATION.md | Active | December 2025 | 1,397 |
| ↳ architecture/RESILIENCE_PATTERNS.md | Active | December 2025 | 247 |
| ↳ architecture/AGENT_PROMPTS.md | Active | December 2025 | 1,231 |
| ↳ architecture/IMPLEMENTATION_SCAFFOLD.md | Active | December 2025 | 646 |
| ↳ architecture/OBSERVABILITY.md | Active | December 2025 | 2,256 |
| ↳ architecture/TESTING_STRATEGY.md | Active | December 2025 | 240 |
| SECURITY_ARCHITECTURE.md | Active | December 2025 | — |
| OPTIMIZATION_PLAN.md | Active | December 2025 | — |
| EMOTIONAL_AI_METHODOLOGY.md | Active | December 2025 | — |
| ARCHITECTURE_RESEARCH_INSIGHTS.md | Active | December 2025 | — |

---

## Contributing

When adding or modifying documentation:

1. **Check tier placement** — Does this belong in an existing doc or need a new one?
2. **Maintain hierarchy** — Strategic docs shouldn't contain implementation details
3. **Use architecture/ modules** — For implementation details, add to appropriate module
4. **Cross-reference** — Link to related docs using relative paths
5. **Update this index** — Keep the hierarchy current

---

*Mollei Documentation Structure — Established December 2025*

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
