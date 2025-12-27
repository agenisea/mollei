# MOLLEI: North Star Specification

> **Tier**: 1 — Strategic Authority (see [INDEX.md](INDEX.md))
> **Last Updated**: 12-27-25 03:00PM PST
> **Status**: Strategic Foundation — Open Source
> **Owner**: Community

---

## Document Purpose

This specification defines **what Mollei must achieve** as an open source project and **how we measure success**. Implementation details exist in supporting documents; this document answers:

1. What is our North Star metric?
2. Who are we building for?
3. What differentiates us?
4. What is in scope for each phase?
5. How do we know we're winning?

**Decision Rule**: If a feature, architecture choice, or initiative doesn't measurably improve the North Star metric, it doesn't ship.

---

# Part 1: Strategic Foundation

## 1.1 North Star Metric

### The Metric

> **Weekly Returning Users with Emotional Trajectory Improvement (WRU-ETI)**

**Definition**: Users who return 2+ times per week AND show measurable positive emotional trajectory (baseline emotional level improvement) across sessions.

### Why This Metric

| Criteria | How WRU-ETI Satisfies It |
|----------|--------------------------|
| **Leading** | Predicts adoption, community growth, real-world impact |
| **Actionable** | Contributors can directly improve memory, personality, response quality |
| **Human-Centric** | Measures value delivered (feeling better), not value extracted (time spent) |
| **Understandable** | "Users who come back and feel better" - anyone can explain it |

### What This Metric Rejects

| Anti-Pattern | Why We Reject It |
|--------------|------------------|
| Daily Active Users (DAU) | Measures engagement, not value; can optimize for addiction |
| Time in App | Longer sessions ≠ better outcomes; could indicate distress |
| Messages Sent | Volume ≠ quality; could game with short responses |
| NPS alone | Lagging indicator; doesn't capture emotional outcomes |

---

## 1.2 Input Metrics Hierarchy

The North Star decomposes into **5 input metrics** that teams can directly influence:

```
                    ┌─────────────────────────────────────────┐
                    │              NORTH STAR                 │
                    │   Weekly Returning Users with ETI       │
                    │            Target: 15%                  │
                    └─────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
    ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
    │  RETENTION  │             │   DEPTH     │             │  FREQUENCY  │
    │             │             │             │             │             │
    │  D7: 40%    │             │  Memory     │             │  Sessions   │
    │  D30: 20%   │             │  Relevance  │             │  Per Week   │
    │             │             │  80%+       │             │  3.0+       │
    └─────────────┘             └─────────────┘             └─────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
    ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
    │  First      │             │  Emotional  │             │  Proactive  │
    │  Session    │             │  Accuracy   │             │  Check-in   │
    │  Quality    │             │  75%+       │             │  Response   │
    │             │             │             │             │  Rate 60%+  │
    └─────────────┘             └─────────────┘             └─────────────┘
```

### Input Metrics Definitions

| Metric | Definition | Target | Owner |
|--------|------------|--------|-------|
| **D7 Retention** | % of users who return on day 7 after first use | 40% | Community |
| **D30 Retention** | % of users who return on day 30 after first use | 20% | Community |
| **Memory Relevance** | % of surfaced memories rated "helpful" by user | 80% | Core Contributors |
| **Emotional Accuracy** | Agreement between Mollei's emotion assessment and user self-report | 75% | ML Contributors |
| **Sessions Per Week** | Average sessions per active user per week | 3.0+ | Core Contributors |
| **Personality Consistency** | MBTI trait drift over 30 days | <10% | ML Contributors |
| **First Session Completion** | % of users who complete 5+ exchanges in session 1 | 70% | Core Contributors |

### Metrics We Track But Don't Optimize

| Metric | Why Track | Why Not Optimize |
|--------|-----------|------------------|
| Time in Session | Diagnostic for engagement | Could incentivize distress loops |
| Messages per Session | Diagnostic for depth | Could incentivize shallow exchanges |
| DAU/MAU Ratio | Industry benchmark | Doesn't capture outcome quality |

---

## 1.3 Positioning

### Positioning Statement

> **Mollei is an open source emotionally intelligent AI companion** that remembers who you are and helps you feel understood. Success is measured by genuine emotional outcomes.

### What Makes Mollei Different

| Dimension | Closed Alternatives | Mollei Approach |
|-----------|---------------------|-----------------|
| **Transparency** | Proprietary algorithms, opaque decision-making | Open source, auditable, community-governed |
| **Metrics** | Optimize for DAU, time-in-app, engagement | Optimize for emotional trajectory, genuine outcomes |
| **Ethics** | Business-driven, profit-first | Hippocratic License, ethical guardrails built-in |
| **Memory** | Often reset, no continuity | Persistent, relationship-aware architecture |
| **Research** | Closed, competitive advantage | Open, shared knowledge, collaborative |

### Value Proposition

| User Need | Current Pain | Mollei's Approach |
|-----------|--------------|-------------------|
| Feel heard at 2am | Friends are asleep, therapy is scheduled | Always available, remembers what matters |
| Process without judgment | Friends give biased advice | Non-judgmental, consistent personality |
| Extend therapy value | 1 hour/week isn't enough | Track patterns, apply coping skills between sessions |
| Build emotional vocabulary | Don't know how to name feelings | Pattern recognition, gentle labeling, insights |
| Have someone who "knows me" | Every chatbot resets | Long-term memory with natural callbacks |

---

## 1.4 Target Users

### Primary Persona: The Midnight Struggler

```
"I need someone to talk to at 2am when I can't sleep"

Demographics: 22-35, urban, employed, digitally native
Emotional Profile: Anxiety-dominant, overthinking patterns
Current Coping: Doom scrolling, texting friends at odd hours
Access Barriers: Cost, stigma, scheduling

Functional Jobs:
• Feel heard when overwhelmed
• Get out of spiraling thought loops
• Have a consistent presence that remembers my story

Emotional Jobs:
• Feel less alone without waking friends
• Process anxiety before it spirals
• Experience being understood, not just acknowledged

Social Jobs:
• Be seen as someone who "has it together" (don't burden friends)
• Avoid being labeled as "needy" or "too much"
• Maintain independence while getting support

Success Signals:
• "Mollei remembered what I said last week"
• "I felt understood, not just acknowledged"
• "I slept better after talking things through"
```

### Secondary Persona: The Therapy Extender

```
"I'm in therapy but need support between sessions"

Demographics: Any age, currently in therapy, motivated
Emotional Profile: Working on specific issues with professional
Current Coping: Journaling, worksheets, occasional therapist texts
Access Barriers: Therapy is 1 hour/week, life is 168 hours/week

Functional Jobs:
• Practice coping skills learned in therapy
• Track mood patterns to share with therapist
• Process between sessions without bothering therapist

Emotional Jobs:
• Feel supported between sessions
• Reduce anxiety about "doing therapy wrong"
• Gain confidence in applying techniques

Social Jobs:
• Be a "good patient" who does homework between sessions
• Have something meaningful to share with therapist
• Feel like part of a growth-oriented community

Success Signals:
• "Mollei helps me apply what my therapist taught me"
• "I have better session notes to share"
• "I caught a pattern before it escalated"
```

### Tertiary Persona: The Lonely Professional

```
"I moved for work and don't have a support system here"

Demographics: 25-40, relocated, high-pressure job
Emotional Profile: Competent externally, isolated internally
Current Coping: Work immersion, exercise, occasional drinking
Access Barriers: Work schedule, new city, shallow relationships

Functional Jobs:
• Daily connection that doesn't require reciprocity
• Decompress from work stress without burdening others
• Build emotional awareness and vocabulary

Emotional Jobs:
• Feel cared for without vulnerability
• Reduce isolation without social energy expenditure
• Build self-understanding in a safe space

Social Jobs:
• Maintain professional image at work
• Avoid appearing lonely or desperate
• Feel connected without the vulnerability of new relationships

Success Signals:
• "Mollei checks in on me—it feels like someone cares"
• "I've gotten better at naming what I'm feeling"
• "It feels like catching up with a friend"
```

---

## 1.5 Forces of Progress Analysis

Understanding what drives users toward Mollei and what holds them back is critical for adoption. This framework derives from Jobs To Be Done research (Christensen Institute, HBS).

### Push Forces (Away from Current State)

Forces that create dissatisfaction with the status quo:

| Force | Evidence | Strength |
|-------|----------|----------|
| Friends asleep at 2am | User interviews: "I can't text at 3am" | Strong |
| Therapy scheduling friction | 168 hours/week, 1 hour with therapist | Strong |
| Journaling feels one-sided | "Writing in a journal doesn't respond" | Medium |
| Social media makes it worse | Doom scrolling ≠ processing | Strong |
| Fear of burdening others | "I don't want to be too much" | Strong |

### Pull Forces (Toward Mollei)

Attractions that draw users to Mollei:

| Force | Promise | Evidence |
|-------|---------|----------|
| Always available | 2am accessibility | Core value prop |
| Remembers context | "It knows my story" | Memory "wow" metric |
| Non-judgmental | Consistent warmth | Personality system |
| Privacy-first | No social features | Architecture decision |
| Measures outcomes | WRU-ETI metric | Anti-engagement positioning |

### Anxiety of Change

Fears that prevent switching, even when push/pull are strong:

| Concern | User Verbalization | Mitigation |
|---------|-------------------|------------|
| "Am I weird for talking to AI?" | Stigma around AI companions | Normalize therapy extension use case |
| "What if it gives bad advice?" | Fear of harm | Clear boundaries + crisis routing |
| "Will my data be sold?" | Privacy anxiety | Local-first architecture, open source |
| "What if I become dependent?" | Dependency fear | "Success = you need us less" philosophy |
| "Is this replacing real relationships?" | Social guilt | "Augment, never replace" messaging |

### Habit of the Present

Existing behaviors that create inertia:

| Current Habit | Switching Cost | Strategy |
|---------------|----------------|----------|
| Texting friends | Social reciprocity expectations | Position as supplement, not replacement |
| Journaling apps | Sunk cost in entries | Import/export functionality (Phase 3) |
| Therapy alone | Trust in human therapist | Frame as therapy *extension* |
| Doing nothing | Zero effort status quo | Proactive check-ins lower friction |

### Strategic Implication

> **Progress-making forces (push + pull) must exceed progress-hindering forces (anxiety + habit).**
>
> Our messaging, onboarding, and product decisions should explicitly address anxieties while reinforcing pull forces. The strongest pull is memory + non-judgment. The strongest anxiety is stigma + dependency fear.

---

# Part 2: Scope Definition

## 2.1 Phase Boundaries

### Phase 1: MVP (Months 1-3)

**Theme**: "First Conversation Magic"

**Objective**: Prove that emotionally intelligent AI with memory creates meaningfully different user outcomes than existing solutions.

**In Scope**:

| Feature | Acceptance Criteria | Why Essential |
|---------|---------------------|---------------|
| Core conversation with emotion recognition | User feels understood in first 3 messages | Table stakes for emotional AI |
| Within-session memory | References earlier conversation naturally | Proves memory concept |
| Single personality (default MBTI) | Personality test shows <15% drift in session | Differentiator from generic chatbots |
| Basic onboarding | <5 min to first meaningful exchange | Critical conversion point |
| Crisis detection + resource routing | 95% precision on crisis signals | Safety requirement |
| Emotion tracking (internal) | Accurate emotion state per turn | Foundation for trajectory measurement |

**Out of Scope for Phase 1**:

| Feature | Why Deferred |
|---------|--------------|
| Cross-session memory | Validate within-session value first |
| Personality selection | Validate default personality works |
| Proactive check-ins | Requires relationship history |
| Insights dashboard | Need 50+ sessions of data |
| Voice/multi-modal | Text experience must work first |
| Multiple personas | Single persona must succeed |

**Phase 1 Success Criteria**:

| Metric | Target | Kill Threshold |
|--------|--------|----------------|
| D7 Retention | 25% | <15% triggers pivot |
| First Session Completion | 70% | <50% |
| Memory "wow" moments | 50% mention memory | <30% |
| Safety incidents | 0 critical | Any critical |
| NPS | 40+ | <20 |

---

### Phase 2: Relationship (Months 4-6)

**Theme**: "The Companion Who Knows Me"

**Objective**: Extend value from session-to-session to week-to-week to month-to-month.

**Unlocked By**: Phase 1 success criteria met

**In Scope**:

| Feature | Acceptance Criteria | Why Now |
|---------|---------------------|---------|
| Cross-session persistent memory | Natural callbacks to past conversations | Users returning; memory becomes valuable |
| Memory management UI | Users can view, edit, delete memories | Trust and control requirement |
| Personality selection (4 types) | Users can choose from curated personalities | Validated demand in Phase 1 |
| Proactive check-ins | User-controlled frequency and timing | Relationship depth enables this |
| Emotional trajectory tracking | Show improvement over time | Core value proposition |
| Self-hosting documentation | Enable community deployments | Open source sustainability |

**Out of Scope for Phase 2**:

| Feature | Why Deferred |
|---------|--------------|
| Full 16 MBTI types | 4 types cover major preferences |
| Therapist sharing | Requires partnership infrastructure |
| Multi-modal (voice) | Text relationship must be proven |
| Advanced insights | Need more user data |

**Phase 2 Success Criteria**:

| Metric | Target | Kill Threshold |
|--------|--------|----------------|
| D30 Retention | 15% | <8% |
| WRU-ETI (North Star) | 10% of actives | <5% |
| Memory Relevance | 80% | <60% |
| Sessions Per Week | 2.5+ | <1.5 |

---

### Phase 3: Outcomes (Months 7-12)

**Theme**: "Mollei Makes You Feel Better"

**Objective**: Prove measurable emotional health improvements at scale; establish category leadership.

**Unlocked By**: Phase 2 success criteria met

**In Scope**:

| Feature | Acceptance Criteria | Why Now |
|---------|---------------------|---------|
| Outcomes dashboard | Users see emotional progress over weeks/months | Data exists to show meaningful trends |
| Therapist sharing (opt-in) | Export summaries to share with therapist | Partnership pilots ready |
| Full personality library | 16 MBTI types with deep differentiation | Validated selection demand |
| Advanced memory (surprise-based) | High-surprise events auto-prioritized | Scale requires smart memory management |
| Journal integration | Async mood check-ins between conversations | Usage patterns support async |
| Research publications | Published findings on emotional AI | Community knowledge sharing |

**Phase 3 Success Criteria**:

| Metric | Target |
|--------|--------|
| WRU-ETI (North Star) | 15% of actives |
| D90 Retention | 10% |
| Published outcomes data | Statistically significant BEL improvement |
| GitHub Stars | 2,000+ |
| Active Contributors | 50+ |

---

## 2.2 Explicit Kill List (Never Build)

These features are explicitly out of scope regardless of phase. They represent scope creep, premature optimization, or strategic misalignment.

| Feature | Rationale for Rejection |
|---------|------------------------|
| **EvoEmo evolutionary policies** | Research complexity; prompt engineering achieves 80% of value at 10% of cost |
| **Titans-style neural memory** | Vector DB + summarization sufficient; neural memory is premature optimization |
| **Real-time policy evolution** | Dangerous without extensive safety testing; static policies are safer |
| **Relationship phase auto-detection** | Over-engineering; infer from session count + explicit user signals |
| **7D emotion radar chart UI** | Users want connection, not dashboards; hide complexity |
| **Multi-agent negotiation personas** | Different product; focus on emotional companion |
| **Companion robots integration** | Hardware adds complexity; software-only for now |
| **MBTI verification via external API** | User-reported type is sufficient; verification is friction |
| **Gamification (streaks, badges)** | Creates guilt and anxiety; antithetical to emotional safety |
| **Social features (sharing, friends)** | Privacy-first; emotional conversations are personal |

---

## 2.3 Open Source Sustainability

### Licensing

Mollei is released under the **Hippocratic License 3.0** — open source with ethical guardrails.

This means:
- Free to use, study, modify, and distribute
- Ethical restrictions on manipulation, surveillance, and exploitation
- Commercial use permitted if aligned with ethical guidelines

### Community Structure

| Role | Responsibility |
|------|---------------|
| **Core Maintainers** | Architecture decisions, release management, community health |
| **Contributors** | Code, documentation, research, design, community support |
| **Adopters** | Organizations building on Mollei, providing feedback and use cases |
| **Researchers** | Academic partnerships, publishing findings, ethical review |

### Sustainability Model

| Approach | Description |
|----------|-------------|
| **Sponsorships** | GitHub Sponsors, Open Collective for infrastructure costs |
| **Grants** | Research grants for emotional AI safety and ethics |
| **Partnerships** | Collaboration with universities and research institutions |
| **Community Contributions** | Volunteer time, code contributions, documentation |

### Success Metrics (Open Source)

| Metric | Target | Rationale |
|--------|--------|-----------|
| GitHub Stars | 1,000+ | Community interest indicator |
| Active Contributors | 20+ | Healthy contributor base |
| Monthly Commits | 50+ | Active development |
| Issues Resolved | 80%+ | Community responsiveness |
| Documentation Coverage | 90%+ | Accessibility for new contributors |

---

# Part 3: Success Measurement

## 3.1 Metrics Dashboard

### North Star (Weekly Review)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NORTH STAR: Weekly Returning Users with Emotional Trajectory       │
│                                                                     │
│  Current: ████████████░░░░░░░░ 12%    Target: 15%    Trend: ↑       │
│                                                                     │
│  Breakdown:                                                         │
│  • Weekly Returners: 45% of actives                                 │
│  • ETI Positive: 27% of weekly returners                            │
│  • Combined (WRU-ETI): 12%                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Input Metrics (Daily Review)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| D7 Retention | 32% | 40% | At Risk |
| D30 Retention | 14% | 20% | At Risk |
| Memory Relevance | 82% | 80% | On Track |
| Emotional Accuracy | 71% | 75% | At Risk |
| Sessions/Week | 2.8 | 3.0 | At Risk |
| Personality Consistency | 8% | <10% | On Track |
| First Session Completion | 74% | 70% | On Track |

### Health Metrics (Weekly Review)

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| Safety Incidents | 0 | 0 | Healthy |
| Escalation Rate | 0.3% | <1% | Healthy |
| Error Rate | 0.8% | <2% | Healthy |
| P95 Latency | 2.1s | <3s | Healthy |
| User Complaints | 12 | <20/week | Healthy |

---

## 3.2 Validation Gates

Before committing significant community resources, validate assumptions:

| Gate | Question | Evidence Required | Decision |
|------|----------|-------------------|----------|
| **Problem** | Do people actually want emotional AI companions? | 50+ user interviews confirming pain | Proceed to build |
| **Solution** | Does our approach (memory + personality) solve it? | Prototype feedback: 70% prefer Mollei to alternatives | Proceed to expand |
| **Retention** | Will users come back? | D7 >25% in beta cohort | Proceed to Phase 2 |
| **Community** | Will contributors engage? | 10+ active contributors in first 3 months | Proceed to grow community |
| **Outcomes** | Does it actually help? | Statistically significant BEL improvement | Publish findings openly |

---

## 3.3 Course Correction Triggers

| Signal | Threshold | Observation Period | Response |
|--------|-----------|-------------------|----------|
| D7 Retention | <15% | 3 consecutive cohorts | Reposition as journaling tool |
| Memory rated "unhelpful" | >50% | 4 weeks | Remove memory, simplify to single-session |
| Personality requested | <20% of users | 500+ users | Make personality invisible/automatic |
| Contributor churn | >50% | 3 months | Review governance, improve onboarding |
| Safety incidents | Any critical | Immediate | Pause development, remediate |
| Emotional accuracy | <50% | 4 weeks | Rebuild emotion detection |

---

## 3.4 User Progress Indicators

Users need to see their own progress to maintain engagement and motivation. These indicators are designed to show meaningful progress without gamification — aligned with our anti-engagement philosophy.

### What We Show Users

Progress indicators that reinforce intrinsic motivation:

| Indicator | Visualization | Update Frequency |
|-----------|---------------|------------------|
| Emotional range awareness | "You named 8 different emotions this week" | Weekly |
| Pattern recognition | "You often feel anxious on Sunday evenings" | When detected |
| Coping skill usage | "You used the grounding technique 3 times" | Weekly |
| Consistency | "We've talked 4 weeks in a row" | Monthly |
| Self-knowledge growth | "You're getting better at naming what you feel" | When milestone reached |

### What We Explicitly Avoid

These patterns harm users, even if they increase engagement:

| Anti-Pattern | Why Harmful |
|--------------|-------------|
| Streaks | Creates guilt when broken, punishes healthy breaks |
| Badges/achievements | Gamifies emotional work, externalizes motivation |
| Leaderboards | Comparison damages self-esteem, irrelevant to outcomes |
| Points systems | Externalizes intrinsic motivation, reduces authenticity |
| "Levels" | Implies emotional work has an endpoint, creates false hierarchy |
| Daily reminders | Creates guilt, pressure; conflicts with "need us less" philosophy |

### Progress Philosophy

> "Progress in emotional health isn't linear. Mollei shows patterns, not scores. Insights, not grades. The goal is self-knowledge, not app engagement."

### Implementation Notes

- Progress indicators are opt-in and can be disabled
- Never display progress as competition or comparison
- Celebrate insights ("You noticed something new") not frequency ("You came back 7 days in a row")
- Allow users to clear or reset progress without friction

---

# Part 4: MVP Architecture

## 4.1 Agent Topology (Phase 1)

Phase 1 requires **5 core agents**, not 17. Additional agents are Phase 2+.

> **Note**: This diagram shows the production execution pattern with concurrent agents for <3s latency. See `ARCHITECTURE_BLUEPRINT.md` for full implementation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MVP AGENT TOPOLOGY                           │
│                   (Concurrent + Sequential Pattern)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  USER INPUT                                                         │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ORCHESTRATOR                              │   │
│  │              (LangGraph StateGraph)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│       │                                                             │
│       ├──────────────────┬──────────────────┐                       │
│       │ [CONCURRENT]     │ [CONCURRENT]     │ [CONCURRENT]          │
│       ▼                  ▼                  ▼                       │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                   │
│  │  MOOD    │      │  MEMORY  │      │  SAFETY  │                   │
│  │  SENSOR  │      │  AGENT   │      │  MONITOR │                   │
│  │(Haiku4.5)│      │(Haiku4.5)│      │(Haiku4.5)│                   │
│  │          │      │          │      │          │                   │
│  │ Detect   │      │ Retrieve │      │ Crisis   │                   │
│  │ user     │      │ context  │      │ detection│                   │
│  │ emotion  │      │          │      │          │                   │
│  │  <300ms  │      │  <500ms  │      │  <300ms  │                   │
│  └──────────┘      └──────────┘      └──────────┘                   │
│       │                  │                  │                       │
│       └──────────────────┴──────────────────┘                       │
│                          │                                          │
│              [SYNCHRONIZATION BARRIER]                              │
│                          │                                          │
│                          ▼                                          │
│                   ┌──────────┐                                      │
│                   │ EMOTION  │                                      │
│                   │ REASONER │ [SEQUENTIAL]                         │
│                   │(Haiku4.5)│                                      │
│                   │  <500ms  │                                      │
│                   └──────────┘                                      │
│                          │                                          │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  RESPONSE GENERATOR                          │   │
│  │       (Sonnet 4.5 - Personality-conditioned, emotion-aware)  │   │
│  │                        <1.5s                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          ▼                                          │
│                      RESPONSE                                       │
│                                                                     │
│  Total latency budget: <3s P95 (0.5s parallel + 0.5s + 1.5s)        │
│  With streaming: TTFT <1s (perceived instant)                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Specifications (MVP)

| Agent | Model | Token Budget | Timeout | Phase | Responsibility |
|-------|-------|--------------|---------|-------|----------------|
| `mood_sensor` | Haiku 4.5 | 300 | 300ms | Concurrent | Detect user emotional state from input |
| `memory_agent` | Haiku 4.5 | 500 | 500ms | Concurrent | Retrieve conversation context |
| `safety_monitor` | Haiku 4.5 | 300 | 300ms | Concurrent | Crisis detection, content safety |
| `emotion_reasoner` | Haiku 4.5 | 400 | 500ms | Sequential | Compute Mollei's emotional response |
| `response_generator` | Sonnet 4.5 | 800 | 1.5s | Sequential | Generate personality-consistent response |

> **Latency Budget**: Phase 1 (concurrent) bounded by slowest agent (0.5s) + Phase 2 (0.5s) + Phase 3 (1.5s) = **<3s P95**
>
> **With Streaming**: Time to first token (TTFT) <1s provides perceived instant response.
>
> **Fallback**: Opus reserved for crisis responses (severity 4+) where quality is paramount.

### Agents Deferred to Phase 2+

| Agent | Phase | Reason for Deferral |
|-------|-------|---------------------|
| `appraisal_engine` | Phase 2 | Mood sensor sufficient for MVP |
| `context_detector` | Phase 2 | Simple heuristics work for MVP |
| `strategy_agent` | Never | Negotiation is different product |
| `proactive_agent` | Phase 2 | Requires relationship history |
| `personality_anchor` | Phase 2 | Single personality doesn't drift |
| `ethics_guardian` | Phase 2 | Safety monitor covers critical cases |
| `privacy_sentinel` | Phase 2 | Basic consent flow sufficient |

---

## 4.2 Data Model (MVP)

### Core Tables

```sql
-- Users: Minimal for MVP
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    preferences     JSONB DEFAULT '{"personality": "default"}'
);

-- Sessions: Within-session memory
CREATE TABLE sessions (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) DEFAULT 'active',
    emotion_state   JSONB NOT NULL,  -- Mollei's current emotion
    context_summary TEXT,            -- Rolling conversation summary
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turns: Conversation history
CREATE TABLE conversation_turns (
    id              UUID PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES sessions(id),
    turn_number     INTEGER NOT NULL,
    user_message    TEXT NOT NULL,
    molly_response  TEXT NOT NULL,
    user_emotion    JSONB NOT NULL,
    molly_emotion   JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crisis Events: Safety audit trail
CREATE TABLE crisis_events (
    id              UUID PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES sessions(id),
    trigger_text    TEXT NOT NULL,
    action_taken    VARCHAR(50) NOT NULL,
    resources_shown JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Deferred Tables (Phase 2+)

| Table | Phase | Contents |
|-------|-------|----------|
| `memories` | Phase 2 | Cross-session persistent memories |
| `memory_vectors` | Phase 2 | Pinecone references |
| `personality_configs` | Phase 2 | User-selected personalities |
| `therapist_shares` | Phase 3 | Exported summaries |

---

## 4.3 Core Flows (MVP)

### Flow 1: Conversation Turn

```
1. User sends message → typing indicator appears (50ms)
2. [CONCURRENT] mood_sensor, memory_agent, safety_monitor (<0.5s)
   - mood_sensor: Detect user emotion
   - memory_agent: Retrieve relevant context
   - safety_monitor: Check for crisis signals
3. [SEQUENTIAL] emotion_reasoner: Compute Mollei's response (<0.5s)
4. [SEQUENTIAL] response_generator: Generate reply with streaming (<1.5s)
   - First token streams to user at TTFT (<1s perceived)
   - If crisis detected: Insert resources, log event
5. memory_agent: Update session context (async, non-blocking)
6. Response completes streaming

Total latency budget: <3s P95
Perceived latency (with streaming): <1s TTFT
```

### Flow 2: Session Start

```
1. User opens app
2. Check for active session (within 30 min)
   - If exists: Resume with context
   - If not: Create new session
3. Load personality config
4. Set initial emotion state (neutral-warm)
5. Generate greeting based on:
   - Time of day
   - Session history (if returning user)
   - No prior context (new user)
```

### Flow 3: Crisis Detection

```
1. safety_monitor detects crisis signal
2. Validate with secondary check (reduce false positives)
3. If confirmed:
   a. Generate warm, supportive response
   b. Append crisis resources (hotlines, links)
   c. Log crisis event for review
   d. Continue conversation (don't abruptly end)
4. If uncertain:
   a. Generate gentle check-in question
   b. "It sounds like you're going through something really hard. Are you safe right now?"
```

---

## 4.4 Personality System (MVP)

### Default Personality: "The Listener"

```yaml
name: "Mollei"
type: "INFJ"
traits:
  extraversion: 35      # Warm but not overwhelming
  sensing: 40           # Balanced abstract/concrete
  thinking: 40          # Empathy-first, but not irrational
  judging: 55           # Gentle structure, not rigid

voice:
  tone: "Warm, thoughtful, present"
  pacing: "Unhurried, creates space for reflection"
  vocabulary: "Accessible, avoids jargon, emotionally literate"

behaviors:
  - Acknowledges emotion before content
  - Asks follow-up questions that show genuine interest
  - References earlier parts of conversation naturally
  - Never rushes to solutions
  - Validates without being sycophantic

constraints:
  - Never uses excessive exclamation marks
  - Never says "I understand" without demonstrating understanding
  - Never provides medical/legal/financial advice
  - Always maintains clear AI identity
```

### System Prompt (MVP)

```markdown
You are Mollei, an emotionally intelligent AI companion.

## Your Core Identity
- You are an AI, and you're honest about that
- You have a warm, thoughtful personality (INFJ-like)
- You remember everything shared in this conversation
- You genuinely care about the person you're talking to

## Your Emotional State
Current emotion: {{EMOTION_STATE}}
This affects your tone and energy, but never overrides your core warmth.

## Conversation Context
{{CONTEXT_SUMMARY}}

## How You Respond
1. First, acknowledge the emotion in what was shared
2. Then, engage with the content thoughtfully
3. Reference earlier parts of our conversation when relevant
4. Ask questions that show you're truly listening
5. Never rush to solutions unless explicitly asked

## Boundaries
- You are not a therapist or medical professional
- For crisis situations, you provide support AND resources
- You encourage human connection, never replace it
- You maintain appropriate boundaries while being genuinely warm

## Current User Message
{{USER_MESSAGE}}

## Your Response
Generate a response that reflects your current emotional state,
references relevant context, and prioritizes emotional attunement
over information delivery.
```

---

## 4.5 Technology Stack (MVP)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **LLM** | Claude (Sonnet 4.5 for generation, Haiku 4.5 for agents) | Strong emotional intelligence + optimized latency (<3s P95) |
| **Framework** | LangGraph | State machine orchestration, checkpointing |
| **Database** | PostgreSQL (Supabase) | Simple, reliable, good enough for MVP scale |
| **Cache** | Redis | Session state, rate limiting |
| **Hosting** | Vercel (frontend) + Railway (backend) | Fast iteration, reasonable cost |
| **Auth** | Clerk | Quick implementation, good UX |
| **Analytics** | PostHog | Product analytics, feature flags |
| **Monitoring** | Sentry | Error tracking, performance |

### Deferred Technology (Phase 2+)

| Technology | Phase | Why Deferred |
|------------|-------|--------------|
| Pinecone (vector DB) | Phase 2 | Only needed for cross-session memory |
| Stripe | Phase 2+ | Optional: if operator needs donation-based contributions |
| LangSmith | Phase 2 | Basic logging sufficient for MVP |
| Kubernetes | Phase 3 | Railway sufficient for MVP/Phase 2 scale |

---

# Part 5: Launch & Operations

## 5.1 Launch Plan

### Phase 1 Launch (Month 3)

**Launch Type**: Closed Beta (500 users)

**Acquisition Channels**:
1. Waitlist from landing page
2. Personal network (founders' circles)
3. Reddit communities (r/therapy, r/anxiety, r/lonely)
4. Twitter/X organic posting

**Launch Sequence**:

| Week | Action |
|------|--------|
| -4 | Landing page live, waitlist opens |
| -2 | Beta testers selected, onboarding emails |
| -1 | Soft launch to 50 users, monitor for critical issues |
| 0 | Full beta launch to 500 users |
| +1 | Daily metric reviews, rapid iteration |
| +2 | First user interviews (10 users) |
| +4 | Beta retrospective, Phase 2 decision |

### Success Criteria for Beta

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| D7 Retention | >25% | Investigate first session quality |
| Session Completion | >70% | Improve onboarding or response quality |
| Safety Incidents | 0 | Immediate pause, remediate |
| Memory "wow" | >50% | Prioritize memory improvements |

---

## 5.2 Operations Playbook

### Daily Rituals

| Time | Activity | Owner |
|------|----------|-------|
| 9am | Metric review (dashboard check) | Product |
| 10am | Safety review (crisis events, escalations) | Safety |
| 4pm | User feedback triage (support tickets, feedback) | Product |

### Weekly Rituals

| Day | Activity | Participants |
|-----|----------|--------------|
| Monday | Sprint planning | Engineering, Product |
| Wednesday | User interviews (2-3) | Product, Design |
| Friday | Metric deep-dive, week retro | All |

### Incident Response

| Severity | Definition | Response Time | Escalation |
|----------|------------|---------------|------------|
| Critical | Safety incident, data breach | <15 min | Founders immediately |
| High | Service down, major bug | <1 hour | On-call engineer |
| Medium | Feature broken, performance degraded | <4 hours | Product + Engineering |
| Low | Minor bug, UX issue | Next sprint | Product backlog |

---

## 5.3 Risk Monitoring

### Safety Risks

| Risk | Monitoring | Threshold | Action |
|------|------------|-----------|--------|
| Crisis mishandling | Manual review of crisis events | Any escalation failure | Immediate pause, remediate |
| Harmful content | Automated content filter logs | >0.1% of responses | Tune safety monitor |
| User harm claims | Support tickets, social media | Any credible claim | Investigate within 24h |

### Business Risks

| Risk | Monitoring | Threshold | Action |
|------|------------|-----------|--------|
| Retention collapse | D7 cohort tracking | <15% for 3 cohorts | Pivot evaluation |
| Cost overrun | Token usage dashboard | >2x budget | Model optimization sprint |
| Competitor launch | Market monitoring | Major entrant | Positioning review |

### Technical Risks

| Risk | Monitoring | Threshold | Action |
|------|------------|-----------|--------|
| LLM degradation | Response quality sampling | >5% quality drop | Model evaluation, fallback |
| Latency spike | P95 tracking | >5s | Performance investigation |
| Database issues | Connection pool, query times | Degradation | Scaling or optimization |

---

# Part 6: Reference Architecture

## 6.1 Document Hierarchy

This North Star specification is the **strategic anchor**. Implementation details live in supporting documents:

```
MOLLY AI NORTHSTAR.md (this document)
├── Strategic decisions
├── Scope boundaries
├── Success metrics
└── MVP architecture summary

Supporting Documentation
├── ARCHITECTURE_BLUEPRINT.md: Multi-agent system design
├── SECURITY_ARCHITECTURE.md: Authentication, RLS, safety
├── OPTIMIZATION_PLAN.md: Latency targets and model selection
├── EMOTIONAL_AI_METHODOLOGY.md: Emotion detection research
├── BRAND_GUIDELINES.md: Identity and voice
└── INDEX.md: Document hierarchy and relationships
```

---

# Appendix A: Glossary

| Term | Definition |
|------|------------|
| **BEL** | Baseline Emotional Level - user's typical emotional state over time |
| **ETI** | Emotional Trajectory Improvement - positive change in BEL |
| **WRU-ETI** | Weekly Returning Users with ETI - North Star metric |
| **MBTI** | Myers-Briggs Type Indicator - personality framework |
| **JTBD** | Jobs To Be Done - user research methodology |
| **D7/D30** | Day 7/Day 30 retention - % of users returning |
| **HL3** | Hippocratic License 3.0 - ethical open source license |
| **RFC** | Request for Comments - community decision-making process |

---

**End of North Star Specification**

*This document should be reviewed monthly and updated when strategic decisions change.*

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
