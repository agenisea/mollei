# Mollei Documentation Index

> **Last Updated**: 12-27-25 02:00PM PST
> **Purpose**: Single source of truth for documentation structure and hierarchy

---

## Document Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MOLLEI DOCUMENTATION                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  TIER 1: STRATEGIC AUTHORITY                                           │
│  ───────────────────────────                                           │
│  The source of truth for product direction. All other docs defer here. │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  NORTHSTAR.md                                                   │   │
│  │  • North Star metric (WRU-ETI)                                  │   │
│  │  • Target users & personas                                      │   │
│  │  • Phase boundaries (MVP → Growth)                              │   │
│  │  • What we build / explicitly don't build                       │   │
│  │  • Success metrics & validation gates                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
│  TIER 2: IMPLEMENTATION                                                │
│  ──────────────────────                                                │
│  How we build what the North Star defines.                             │
│                                                                        │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  ARCHITECTURE_BLUEPRINT.md   │  │  SECURITY_ARCHITECTURE.md    │    │
│  │                              │  │                              │    │
│  │  • Agent topology (5 agents) │  │  • Threat model (OWASP)      │    │
│  │  • LangGraph orchestration   │  │  • Authentication/authz      │    │
│  │  • State schema              │  │  • Trust boundaries          │    │
│  │  • Resilience patterns       │  │  • Audit & incident response │    │
│  │  • Observability             │  │  • Security checklist        │    │
│  └──────────────────────────────┘  └──────────────────────────────┘    │
│                              │                                         │
│                              ▼                                         │
│  TIER 3: EXECUTION                                                     │
│  ────────────────                                                      │
│  Active work, research, and optimization.                              │
│                                                                        │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  OPTIMIZATION_PLAN.md        │  │  EMOTIONAL_AI_METHODOLOGY.md │    │
│  │                              │  │                              │    │
│  │  • Latency targets (<3s)     │  │  • Research foundations      │    │
│  │  • Model selection rationale │  │  • Ethical approach          │    │
│  │  • Implementation roadmap    │  │  • Academic citations        │    │
│  │  • Quality trade-offs        │  │  • Design principles         │    │
│  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Document | Tier | Purpose | When to Use |
|----------|------|---------|-------------|
| [NORTHSTAR.md](NORTHSTAR.md) | 1 | Strategic direction | Product decisions, prioritization, metrics |
| [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) | 2 | Technical implementation | Building agents, orchestration, resilience |
| [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) | 2 | Security patterns | Auth, threats, compliance, incident response |
| [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) | 3 | Performance work | Latency optimization, model selection |
| [EMOTIONAL_AI_METHODOLOGY.md](EMOTIONAL_AI_METHODOLOGY.md) | 3 | Research basis | Understanding approach, ethics, citations |

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
    │         │
    │         └──► SECURITY_ARCHITECTURE.md (secures the architecture)
    │
    ├──► OPTIMIZATION_PLAN.md (optimizes against North Star metrics)
    │
    └──► EMOTIONAL_AI_METHODOLOGY.md (research foundation for North Star)
```

---

## Current State

| Document | Status | Last Updated |
|----------|--------|--------------|
| NORTHSTAR.md | Active | December 2025 |
| ARCHITECTURE_BLUEPRINT.md | Active | December 2025 |
| SECURITY_ARCHITECTURE.md | Active | December 2025 |
| OPTIMIZATION_PLAN.md | Active (recommendations integrated) | December 2025 |
| EMOTIONAL_AI_METHODOLOGY.md | Active | December 2025 |

---

## Contributing

When adding or modifying documentation:

1. **Check tier placement** — Does this belong in an existing doc or need a new one?
2. **Maintain hierarchy** — Strategic docs shouldn't contain implementation details
3. **Cross-reference** — Link to related docs using relative paths
4. **Update this index** — Keep the hierarchy current

---

*Mollei Documentation Structure — Established December 2025*

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
