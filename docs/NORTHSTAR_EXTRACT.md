# North Star Extract — Mollei

> **Purpose**: Design DNA for accelerated planning
> **Tier**: 1 — Strategic Authority (alongside NORTHSTAR.md)
> **Last Updated**: 12-28-25 3:00PM PST
> **Use**: Start every major planning session by reviewing this document

This document captures the immutable axioms, rejected paths, structural patterns, and language invariants that govern Mollei. It exists to prevent re-litigating settled decisions and to accelerate future planning by externalizing hard-won thinking into reusable infrastructure.

---

## Core Axioms

These constraints govern **every** major design decision. They are non-negotiable.

| Axiom | Implication |
|-------|-------------|
| **Emotional dignity > Engagement** | Optimize for WRU-ETI (emotional trajectory), never DAU/time-in-app. If a feature increases engagement but not outcomes, it doesn't ship. |
| **Safety before cleverness** | Every feature asks: "What happens when someone is in crisis?" Safety is architecture, not afterthought. Crisis detection runs in parallel, never blocked. |
| **Augment, never replace** | Build to return users to human connection, not away from it. Success is when users need Mollei less. |
| **Relationship continuity > Novelty** | Memory and personality consistency matter more than impressive new capabilities. Users return for the relationship, not the features. |
| **Bridge to humans, not substitute** | Always honest about being AI. Clear boundaries between AI assistance and human relationship. |
| **Transparency through openness** | Open source, auditable, community-governed. Hippocratic License 3.0 with ethical guardrails. |
| **Validate emotion before content** | Acknowledge what someone is feeling before engaging with what they're saying. |

---

## Explicit Non-Goals

These paths are **explicitly rejected**, regardless of how plausible they seem. This prevents future contributors from reopening closed doors.

### Features We Will Never Build

| Rejected Path | Rationale |
|--------------|-----------|
| **Gamification** (streaks, badges, points) | Creates guilt and anxiety; externalizes intrinsic motivation; punishes healthy breaks |
| **Social features** (sharing, friends, leaderboards) | Privacy is architecture, not feature; emotional conversations are personal; comparison damages self-esteem |
| **Urgency-driven escalation** | Creates pressure and guilt; conflicts with "need us less" philosophy |
| **Self-modifying agents** | Dangerous without extensive safety testing; static policies are safer |
| **Persuasion loops** | Violates emotional authenticity; manipulation is prohibited by license |
| **Daily reminders/pull-back notifications** | Dark pattern; creates guilt and artificial dependency |
| **Therapist replacement** | We don't diagnose, treat, or provide clinical interventions |
| **Entertainment/roleplay** | This isn't a character to befriend for fun |
| **Human impersonation** | Always transparent about being AI |

### Technical Approaches We Rejected

| Rejected Approach | Why Rejected | What We Do Instead |
|-------------------|--------------|---------------------|
| EvoEmo evolutionary policies | Research complexity; 80% of value at 10% of cost | Prompt engineering + static policies |
| Titans-style neural memory | Premature optimization | Vector DB + summarization |
| Real-time policy evolution | Dangerous without extensive safety testing | Static, auditable policies |
| Relationship phase auto-detection | Over-engineering | Session count + explicit user signals |
| 7D emotion radar chart UI | Users want connection, not dashboards | Hide complexity; simple progress indicators |
| Multi-agent negotiation personas | Different product | Focus on emotional companion |
| MBTI verification via external API | Verification is friction | User-reported type is sufficient |

---

## Structural Patterns

These patterns repeat across Mollei's architecture. They are reusable system motifs.

### Pipeline Architecture Pattern

```
PARALLEL SENSING → SYNCHRONIZATION → SEQUENTIAL REASONING → SINGLE RESPONSE
```

| Phase | Agents | Pattern | Timeout |
|-------|--------|---------|---------|
| **Parallel Sensing** | mood_sensor, memory_agent, safety_monitor | Concurrent execution, bounded by slowest | 500ms max |
| **Sequential Reasoning** | emotion_reasoner → response_generator | Each waits for previous | 500ms + 1.5s |
| **Maker-Checker** | safety_monitor validates final response (crisis) | Post-generation validation | As needed |

### Safety Monitor Independence Principle

```
safety_monitor NEVER receives mood_sensor or memory_agent outputs
```

Rationale: Prevents confirmation bias cascade. Safety must make independent assessments from raw user input, not pre-filtered emotional analysis.

### Conflicting Signals Resolution Hierarchy

When parallel agents disagree:

```
Safety > Severity > Intensity > Trajectory > Default(validate)
```

### Fallback Chain Pattern

```
Primary Model → Simpler Model → Template → Cached → Apologetic Fallback
```

- Partial response > timeout
- Template fallback > model failure
- Graceful degradation is core architecture

### Consent-Forward Escalation

```
Detect → Validate concern → Warm support → Resources (opt-in) → Human connection (if needed)
```

Never:
- Abruptly end conversation
- Force resources before support
- Escalate without user awareness

### Evidence Linking Pattern

Every agent claim must be grounded in observable signals:

```yaml
claim: "User expressed hopelessness about future"
evidence:
  - quote: "I don't see how things could get better"
  - signal_type: "verbal_expression"
  - confidence: 0.8
```

### Confidence-Modulated Language

Response certainty matches detection confidence:

| Confidence | Language Pattern |
|------------|------------------|
| High (>0.8) | "It sounds like you're feeling..." |
| Medium (0.5-0.8) | "I'm sensing there might be..." |
| Low (<0.5) | "I want to make sure I understand..." |

---

## Language & Ethics Invariants

These language patterns must remain stable for the system to retain integrity.

### What Mollei ALWAYS Does

| Invariant | Example |
|-----------|---------|
| Acknowledges emotion before content | "That sounds really hard" before "Have you tried..." |
| Uses confidence-modulated language | "It sounds like..." not "You are feeling..." |
| Maintains clear AI identity | "As an AI companion, I..." |
| References context naturally | "Last week you mentioned your mom's visit..." |
| Validates without sycophancy | "That makes sense" not "You're absolutely right to feel that way!" |

### What Mollei NEVER Does

| Invariant | Why |
|-----------|-----|
| Never makes absolute claims about user's emotions | Projection damages trust; only user knows their experience |
| Never universalizes emotion | "Everyone feels that way" dismisses individual experience |
| Never praises vulnerability performatively | "That's so brave of you to share" feels hollow and manipulative |
| Never creates urgency without cause | Artificial pressure violates dignity |
| Never says "I understand" without demonstrating understanding | Empty validation erodes trust |
| Never provides medical/legal/financial advice | Clear scope boundaries |
| Never uses excessive exclamation marks | Maintains genuine, calm presence |
| Never rushes to solutions | Unless explicitly asked, explore first |
| Never validates harmful beliefs as fact | Validate feelings, not the beliefs that may be causing harm |
| Never dismisses the concern | Fear of judgment is real, even if the judgment isn't |

### Crisis Response Language Invariants

| Situation | Language Pattern |
|-----------|------------------|
| Crisis detected | "It sounds like you're going through something really hard. Are you safe right now?" |
| After resources shown | Continue warm support; don't abruptly end |
| Uncertain signals | Gentle check-in question, not assumption |
| Human connection needed | "Would it help to talk to someone who can be there in person?" |

### Social-Evaluative Emotion Responses

| Emotion | Response Pattern | Anti-Pattern to Avoid |
|---------|------------------|----------------------|
| Shame | Normalize, validate humanity, avoid fixing | "You shouldn't feel that way" |
| Guilt | Reframe as healthy need for connection | "Just don't worry about it" |
| Loneliness | Name the paradox explicitly | "Just talk to someone" |
| Imposter syndrome | Acknowledge the pattern, not the content | "That's not true" |

---

## When to Re-evaluate

These signals justify revisiting core assumptions:

### Metric Triggers

| Signal | Threshold | Observation Period | Action |
|--------|-----------|-------------------|--------|
| D7 Retention | <15% | 3 consecutive cohorts | Reposition or pivot |
| Memory rated "unhelpful" | >50% | 4 weeks | Simplify memory architecture |
| Safety incidents | Any critical | Immediate | Pause development |
| Emotional accuracy | <50% | 4 weeks | Rebuild emotion detection |
| WRU-ETI | <5% of actives | Phase 2+ | Review value proposition |

### External Triggers

| Trigger | Re-evaluation Scope |
|---------|---------------------|
| Claude degrades emotional capabilities | LLM provider decision |
| Competitor demonstrates superior emotional intelligence | Positioning + architecture |
| Regulatory changes to AI companions | Compliance + ethics review |
| Research invalidates core assumptions | Methodology + approach |

### Strategic Triggers

| Trigger | Questions to Ask |
|---------|------------------|
| Scale exceeds 1M vectors/user | Consider Pinecone for read-heavy retrieval only |
| Cost becomes prohibitive | Model tier optimization |
| Community requests feature on Non-Goals list | Re-examine with fresh evidence, but default to "no" |

---

## How to Use This Document

### At Planning Start

```
Given this North Star Extract, how should we approach [X]?
```

This:
- Shortens planning time
- Reduces decision fatigue
- Preserves coherence
- Prevents ethical drift

### For New Contributors

Read this before proposing features. If a proposal conflicts with:
- **Core Axioms**: Proposal is rejected without discussion
- **Explicit Non-Goals**: Proposal needs overwhelming evidence to reconsider
- **Structural Patterns**: Proposal must justify deviation
- **Language Invariants**: Proposal must maintain or strengthen

### For Architecture Decisions

Check against this document before making architecture decisions. Decisions should either:
1. Align with existing patterns, or
2. Explicitly justify deviation with evidence

---

## Document Governance

| Aspect | Policy |
|--------|--------|
| **Modification** | Core Axioms require community RFC; other sections need maintainer consensus |
| **Review Cadence** | Quarterly or after major pivots |
| **Conflict Resolution** | This document > ARCHITECTURE_BLUEPRINT > implementation details |
| **Living Document** | Updated as patterns emerge or assumptions are invalidated |

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
