<p align="center">
  <img src="public/logo.png" alt="Mollei" width="200" />
</p>

<h1 align="center">Mollei™</h1>

<p align="center">
  <strong>Exploring how to build AI that understands human emotion.</strong>
</p>

---

## Why This Exists

Therapy is expensive and scheduled. Friends have their own lives. At 2am, when thoughts spiral, most people reach for their phone — and find nothing that helps.

Meanwhile, AI companions optimize for engagement. Time in app. Messages sent. Metrics that reward keeping people coming back, not helping them feel better.

We think there's a different way.

---

## What We're Building

Mollei is an open source project asking: **Can AI understand emotion without exploiting it?**

We're exploring AI that's there at 2am when friends are asleep — that helps you apply what you learn in therapy, remembers your story, and helps you see patterns.

We believe emotionally intelligent AI should:

- **Measure feeling better, not time spent** — Success means you needed us less over time
- **Remember what matters** — Not just what you said, but why it mattered
- **Be honest about what it is** — AI that helps, not AI that pretends to be human
- **Augment human connection, never replace it** — A bridge to people, not a substitute

---

## Architecture

A multi-agent system designed for emotional attunement, safety, and <3s response times.

```
                      USER MESSAGE
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│               (Pipeline Orchestrator + Zod)                 │
└─────────────────────────────────────────────────────────────┘
     │                    │                    │
     │ [PARALLEL]         │ [PARALLEL]         │ [PARALLEL]
     ▼                    ▼                    ▼
┌──────────┐        ┌──────────┐         ┌──────────┐
│   MOOD   │        │  MEMORY  │         │  SAFETY  │
│  SENSOR  │        │  AGENT   │         │ MONITOR  │
│          │        │          │         │          │
│ Detect   │        │ Retrieve │         │ Crisis   │
│ emotion  │        │ context  │         │ detection│
└──────────┘        └──────────┘         └──────────┘
     │                    │                    │
     └────────────────────┴────────────────────┘
                          │
                          ▼
                     ┌──────────┐
                     │ EMOTION  │
                     │ REASONER │
                     │          │
                     │ Compute  │
                     │ response │
                     └──────────┘
                          │
                          ▼
               ┌────────────────────┐
               │ RESPONSE GENERATOR │
               │                    │
               │ Personality-aware  │
               │ emotionally-attuned│
               └────────────────────┘
                          │
                          ▼
                      RESPONSE
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript |
| Framework | Next.js |
| LLM | Claude (Opus, Sonnet, Haiku) |
| Database | PostgreSQL |
| License | Hippocratic 3.0 |

---

## How We're Different

| What others optimize | What we optimize |
|---------------------|------------------|
| Time in app | Feeling better over time |
| Messages sent | Meaningful exchanges |
| Daily active users | People who needed us less |
| Engagement | Outcomes |
| Stickiness | Growth toward independence |

---

## What This Is Not

- **Not a therapist** — We don't diagnose, treat, or replace professional care
- **Not an engagement machine** — No streaks, badges, or guilt-driven notifications
- **Not entertainment** — This isn't roleplay or a character to befriend for fun
- **Not pretending to be human** — Always transparent about being AI

Privacy isn't a setting. It's the architecture.

---

## The Name

*Mollei* — from the Latin *mollis*, meaning soft, gentle, sensitive.

Technology that approaches human emotion with care, not carelessness.

---

## Documentation

- **[Emotional AI Methodology](docs/EMOTIONAL_AI_METHODOLOGY.md)** — Our approach to building AI that understands human emotion
- **[Documentation Index](docs/INDEX.md)** — Full documentation structure and hierarchy

---

## Join Us

This is an open exploration. We don't have all the answers — but we believe the questions matter.

- **[GitHub](https://github.com/agenisea/mollei)** — Follow the work, contribute, discuss
- **[Discord](https://discord.gg/dp4t5jG2)** — Join the conversation

---

## License

[Hippocratic License 3.0](https://firstdonoharm.dev/) — open source with ethical guardrails.

Mollei is free to self-host with your own LLM API keys. No pricing tiers, no paywalls.

Free to use, study, and build upon, as long as the use preserves human dignity, agency, and emotional well-being. Systems designed for manipulation, surveillance, or exploitation are explicitly excluded.

**Open — but not careless.**

---

*Built with care by [Agenisea™](https://agenisea.ai) and the Mollei community.*

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
