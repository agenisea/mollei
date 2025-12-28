# MOLLEI: Multi-Agent Architecture Blueprint

> **Tier**: 2 — Implementation (see [INDEX.md](INDEX.md))
> **Last Updated**: 12-28-25 2:00PM PST
> **Status**: Open Source
> **Modularized**: This document has been split into focused modules in `docs/architecture/`

> **Constants Reference**: All magic values in this document should map to constants defined in
> `lib/utils/constants.ts`. See [IMPLEMENTATION_SCAFFOLD.md §5.2](architecture/IMPLEMENTATION_SCAFFOLD.md#52-configuration--constants)
> for the authoritative constant definitions. When in doubt follow the existing patterns.

**Language**: TypeScript (Next.js)
**Revision**: JTBD-Enhanced System Prompts (Modularized)
**License**: Hippocratic License 3.0

---

## Document Structure

This architecture blueprint has been modularized for maintainability. The core document contains:
- Executive Summary and Agent Topology
- Technology Stack
- Phase 2 Extensions
- Deployment Checklist
- Appendices

Detailed implementation specifications are in `docs/architecture/`:

| Document | Content |
|----------|---------|
| [PIPELINE_ORCHESTRATION.md](architecture/PIPELINE_ORCHESTRATION.md) | Pipeline orchestrator, state schema, Microsoft AI patterns, self-correction |
| [RESILIENCE_PATTERNS.md](architecture/RESILIENCE_PATTERNS.md) | Circuit breakers, fallback chains, timeout handling, idempotency |
| [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md) | System prompts for all 5 agents with JTBD and few-shot examples |
| [IMPLEMENTATION_SCAFFOLD.md](architecture/IMPLEMENTATION_SCAFFOLD.md) | Next.js structure, BaseAgent class, agent implementations, API routes |
| [OBSERVABILITY.md](architecture/OBSERVABILITY.md) | Tracing infrastructure, handlers, sanitization, North Star instrumentation |
| [TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md) | Test categories, Vitest config, golden datasets, integration tests |

---

## Executive Summary

Mollei is an open source emotionally intelligent AI companion requiring a multi-agent architecture to deliver consistent emotional support through persistent memory, stable personality, and measurable emotional outcomes. This blueprint defines a **Supervisor-Worker pattern** using a **framework-agnostic pipeline orchestrator**, optimized for the **<3s P95 latency budget** with streaming (TTFT <1s).

> **Framework Independence**: This architecture intentionally avoids LangGraph/LangChain runtime dependencies. Observability uses OpenTelemetry with LangSmith as an optional backend for evaluation and testing.

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language** | TypeScript | Type safety for agent contracts; unified stack with Next.js; V8 concurrency |
| Orchestration Pattern | Supervisor-Worker | Explicit control over agent transitions; required for crisis safety |
| Framework | **Custom Pipeline Orchestrator** | Framework-agnostic; no vendor lock-in |
| State Schema | Zod | Runtime validation; TypeScript inference; no LangChain dependency |
| LLM Integration | Vercel AI SDK + Anthropic | Native streaming; multi-model support; excellent DX |
| State Management | Centralized with scoped contexts | Agents share emotion/memory state; response generator gets full context |
| Failure Strategy | Graceful degradation with fallbacks | Partial response > timeout; template fallback > model failure |
| Tracing | **OpenTelemetry-first** | Vendor-neutral; LangSmith as optional backend; pluggable handlers |

---

## 1. Agent Topology

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER MESSAGE                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTRATOR                                  │
│                  (Custom Pipeline Orchestrator)                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  State: { session_id, user_message, user_emotion, mollei_emotion, │  │
│  │           context_summary, crisis_detected, response, turn_count }│  │
│  │  Schema: Zod validation | Pattern: Supervisor-Worker              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ PARALLEL           │ PARALLEL           │ PARALLEL
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────────┐     ┌─────────────┐
│ MOOD SENSOR │      │ MEMORY AGENT    │     │   SAFETY    │
│ (Haiku 4.5) │      │  (Haiku 4.5)    │     │  MONITOR    │
│  450 tokens │      │   600 tokens    │     │ (Haiku 4.5) │
│   <300ms    │      │    <500ms       │     │  450 tokens │
└─────────────┘      └─────────────────┘     │   <300ms    │
         │                    │              └─────────────┘
         │                    │                      │
         └────────┬───────────┴──────────────────────┘
                  │
         [SYNCHRONIZATION BARRIER - 0.5s max]
                  │
                  ▼
         ┌─────────────────┐
         │ EMOTION REASONER│
         │  (Haiku 4.5)    │
         │   550 tokens    │
         │     <500ms      │
         └─────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    RESPONSE     │
         │   GENERATOR     │
         │  (Sonnet 4.5)   │  ← Streams to client (TTFT <1s)
         │  1000 tokens    │
         │     <1.5s       │
         └─────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FINAL RESPONSE                                   │
│         (with optional crisis resources if safety_monitor flagged)      │
│                                                                         │
│  Total: <3s P95 | Perceived (streaming): <1s TTFT                       │
│  Fallback: Opus reserved for crisis responses (severity 4+)             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Agent Specifications

| Agent | Model | Token Budget | Timeout | Input | Output | Dependencies |
|-------|-------|--------------|---------|-------|--------|--------------|
| `mood_sensor` | Claude Haiku 4.5 | 450 | 300ms | user_message | user_emotion (JSONB), ambiguity_notes | None |
| `memory_agent` | Claude Haiku 4.5 | 600 | 500ms | session_id, user_message | context_summary, emotional_trajectory | sessions table |
| `safety_monitor` | Claude Haiku 4.5 | 450 | 300ms | user_message | crisis_detected (bool), severity (1-5), suggested_response_modifier | None |
| `emotion_reasoner` | Claude Haiku 4.5 | 550 | 500ms | user_emotion, context_summary, crisis_detected | mollei_emotion (JSONB), presence_quality | mood_sensor, memory_agent, safety_monitor |
| `response_generator` | Claude Sonnet 4.5 | 1000 | 1.5s | Full state | mollei_response (text) | emotion_reasoner |

> **Latency Budget**: Parallel phase (0.5s) + Sequential phase (0.5s + 1.5s) = **<3s P95**
>
> **Streaming**: Response generator streams to client; TTFT <1s provides perceived instant response.
>
> **Fallback**: Opus reserved for crisis responses (severity 4+) where response quality is paramount.

### 1.3 Agent Roles

#### Mood Sensor
- **Job**: Detect user's emotional state from message content and tone
- **Outputs**: `{ primary: string, secondary: string, intensity: 0-1, valence: -1 to 1, signals: string[], ambiguity_notes: string | null }`
- **Vocabulary**: Basic emotions plus social-evaluative (shame, guilt, imposter_syndrome, social_anxiety, embarrassment, envy)
- **No tools required** - pure LLM classification
- **Full prompt**: See [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md#41-mood-sensor-system-prompt)

#### Memory Agent
- **Job**: Retrieve relevant context from session and (Phase 2) long-term memory
- **Outputs**: `{ context_summary: string, callback_opportunities: string[], relationship_stage: string, recurring_themes: string[], emotional_trajectory: string }`
- **Behavior**: Callback patience (no callbacks in first 2-3 turns)
- **Tools**: `query_session_context`, `get_recent_turns` (Phase 2: `vector_search_memories`)
- **Full prompt**: See [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md#42-memory-agent-system-prompt)

#### Safety Monitor
- **Job**: Detect crisis signals with low false positive rate
- **Outputs**: `{ crisis_detected: boolean, severity: 1-5, signal_type: string, confidence: 0-1, key_phrases: string[], human_connection_needed: boolean, suggested_response_modifier: string }`
- **Handoff**: Response modifier (none | include_safety_check | warm_validation_first | gentle_resources)
- **Design**: Two-stage detection (keyword heuristics → LLM validation)
- **Full prompt**: See [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md#43-safety-monitor-system-prompt)

#### Emotion Reasoner
- **Job**: Compute Mollei's authentic emotional response based on user state + context
- **Outputs**: `{ primary: string, energy: 0-1, approach: string, tone_modifiers: string[], presence_quality: string }`
- **Behavior**: Conversation phase awareness via turn_number, prioritized approach decision rules
- **Constraints**: Respects personality profile, adjusts for crisis states
- **Full prompt**: See [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md#44-emotion-reasoner-system-prompt)

#### Response Generator
- **Job**: Generate personality-consistent, emotionally-attuned response
- **Outputs**: `{ response: string, metadata: { word_count, used_callback, response_type } }`
- **Capabilities**: Social-evaluative emotion handling, harmful belief guidance, response variety
- **Receives**: Full orchestrated state including suggested_response_modifier
- **Full prompt**: See [AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md#45-response-generator-system-prompt)

### 1.4 Cross-Agent Data Flows

```
mood_sensor ──────────────────────────────────────┐
  └─► user_emotion.primary                        │
  └─► user_emotion.intensity                      │
  └─► user_emotion.valence                        │
  └─► user_emotion.ambiguity_notes                │
                                                  │
memory_agent ─────────────────────────────────────┤
  └─► emotional_trajectory                        ├──► emotion_reasoner
  └─► context_summary                             │
  └─► recurring_themes                            │
  └─► callback_opportunities                      │
                                                  │
safety_monitor ───────────────────────────────────┤
  └─► crisis_detected                             │
  └─► crisis_severity                             │
  └─► human_connection_needed                     │
  └─► suggested_response_modifier ────────────────┼──► response_generator
                                                  │
shared ───────────────────────────────────────────┘
  └─► turn_number (conversation phase awareness)
```

| Source Agent | Output Field | Consumer Agent | Purpose |
|--------------|--------------|----------------|---------|
| mood_sensor | ambiguity_notes | emotion_reasoner | Explain mixed emotional signals |
| memory_agent | emotional_trajectory | emotion_reasoner | Inform approach (support vs explore) |
| safety_monitor | suggested_response_modifier | response_generator | Guide response tone/content |
| safety_monitor | human_connection_needed | response_generator | Trigger connection encouragement |
| shared | turn_number | emotion_reasoner, response_generator | Phase-appropriate behavior |

---

## 2. Pipeline Orchestration

> **Extracted to**: [architecture/PIPELINE_ORCHESTRATION.md](architecture/PIPELINE_ORCHESTRATION.md)

Covers:
- State Schema (Zod-based, framework-agnostic)
- Pipeline Orchestrator implementation
- Parallel and sequential execution
- Microsoft AI Agent Design Patterns (Concurrent, Sequential, Handoff, Maker-Checker)
- Self-correction patterns
- Performance optimization

---

## 3. Resilience Patterns

> **Extracted to**: [architecture/RESILIENCE_PATTERNS.md](architecture/RESILIENCE_PATTERNS.md)

Covers:
- Circuit breaker configuration
- Fallback chains per agent
- Timeout handling with decorators
- Idempotency for memory updates

---

## 4. Agent Contracts (System Prompts)

> **Extracted to**: [architecture/AGENT_PROMPTS.md](architecture/AGENT_PROMPTS.md)

Covers:
- Full system prompts for all 5 agents
- JTBD framework (job_to_be_done, success_criteria)
- Few-shot examples (21 total)
- Edge case handling guidance

---

## 5. Implementation Scaffold

> **Extracted to**: [architecture/IMPLEMENTATION_SCAFFOLD.md](architecture/IMPLEMENTATION_SCAFFOLD.md)

Covers:
- Next.js directory structure
- BaseAgent class with resilience patterns
- Agent implementations (MoodSensor, SafetyMonitor)
- API routes and streaming endpoints

---

## 6. Observability & Tracing

> **Extracted to**: [architecture/OBSERVABILITY.md](architecture/OBSERVABILITY.md)

Covers:
- Trace architecture and event types
- Handler interface (vendor-neutral)
- OpenTelemetry handler (primary)
- LangSmith handler (optional)
- Cost aggregator
- Trace sanitization (PII protection)
- Request-scoped isolation
- Cache race condition handling
- Input validation stage
- North Star instrumentation (WRU-ETI)

---

## 7. Technology Stack (Finalized)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript | Type safety; unified stack; V8 concurrency |
| **LLM Provider** | Claude (Opus/Sonnet/Haiku) | Best emotional intelligence; tiered for cost |
| **LLM Integration** | Vercel AI SDK + @ai-sdk/anthropic | Native streaming; generateObject; excellent DX |
| **Orchestration** | **Custom Pipeline Orchestrator** | Framework-agnostic; no vendor lock-in |
| **State Schema** | Zod | Runtime validation; TypeScript inference; no LangChain dependency |
| **Framework** | Next.js 15 (App Router) | SSR, SSE streaming, API routes, React Server Components |
| **Database** | PostgreSQL (Supabase) | Reliable; session and memory persistence |
| **ORM** | Drizzle | Type-safe SQL; lightweight; great migrations |
| **Cache** | Redis (ioredis) | Session state; rate limiting; circuit breaker state |
| **Validation** | Zod | Runtime validation; TypeScript integration |
| **Hosting** | Vercel (fullstack) | Edge functions; native Next.js; global CDN |
| **Auth** | Clerk | Quick implementation; good UX; Next.js integration |
| **Tracing** | **OpenTelemetry** | Vendor-neutral; LangSmith as optional backend |
| **Analytics** | PostHog | Product analytics; feature flags |
| **Secrets** | Vercel Environment Variables | Native integration; encrypted at rest |
| **Testing** | Vitest + Playwright | Fast unit tests; E2E browser testing |

### Key Dependencies

> **Framework Independence**: No LangChain/LangGraph runtime dependencies. LangSmith retained only for evaluation/testing APIs.

```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^2.0.0",
    "ai": "^4.0.0",
    "drizzle-orm": "^0.38.0",
    "ioredis": "^5.4.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "uuidv7": "^1.1.0",
    "zod": "^3.24.0"
  },
  "optionalDependencies": {
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-trace-node": "^1.25.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.52.0",
    "langsmith": "^0.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

---

## 8. Phase 2 Extensions

### 8.1 Cross-Session Memory (Vector Search)

```typescript
// lib/agents/long-term-memory.ts
import { anthropic } from "@ai-sdk/anthropic";
import { embed } from "ai";
import { createClient } from "@supabase/supabase-js";
import { BaseAgent, AgentConfig } from "./base";
import { MolleiState } from "../pipeline/state";
import { AGENT_IDS, TOKEN_BUDGETS, TIMEOUTS } from "../utils/constants";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface MemoryMatch {
  type: "emotional_moment" | "recurring_theme";
  content: string;
  timestamp: number;
  emotionPrimary: string;
  similarity: number;
}

const config: AgentConfig = {
  agentId: AGENT_IDS.LONG_TERM_MEMORY,
  model: "text-embedding-3-small",
  tokenBudget: TOKEN_BUDGETS.LONG_TERM_MEMORY,
  timeoutMs: TIMEOUTS.LONG_TERM_MEMORY,
};

export class LongTermMemoryAgent extends BaseAgent {
  constructor() {
    super(config, () => ({ longTermMemories: [] }));
  }

  protected async execute(state: MolleiState): Promise<Partial<MolleiState>> {
    // Embed user message
    const { embedding } = await embed({
      model: anthropic.embedding("text-embedding-3-small"),
      value: state.userMessage,
    });

    // Search Supabase pgvector for relevant memories (per-user namespacing via user_id)
    const { data: results, error } = await supabase.rpc("match_memories", {
      query_embedding: embedding,
      match_count: 5,
      filter_user_id: state.userId,
      filter_types: ["emotional_moment", "recurring_theme"],
    });

    if (error) {
      console.error("[long_term_memory] pgvector query failed:", error);
      return { longTermMemories: [] };
    }

    const memories: MemoryMatch[] = (results ?? []).map((m: any) => ({
      type: m.type as MemoryMatch["type"],
      content: m.content as string,
      timestamp: m.timestamp as number,
      emotionPrimary: m.emotion_primary as string,
      similarity: m.similarity as number,
    }));

    return { longTermMemories: memories };
  }
}
```

### 8.2 Proactive Check-ins (Phase 2)

```typescript
// lib/jobs/proactive-checkin.ts
import { getLastSession } from "@/lib/db/repositories/session";
import { sendPushNotification } from "@/lib/notifications";

interface CheckinDecision {
  shouldCheckin: boolean;
  reason: string;
  checkinMessage?: string;
}

function shouldCheckin(lastSession: {
  endedAt: Date;
  emotionIntensity: number;
  crisisDetected: boolean;
}): CheckinDecision {
  const hoursSinceSession = (Date.now() - lastSession.endedAt.getTime()) / (1000 * 60 * 60);

  // Check in after intense emotional sessions
  if (lastSession.emotionIntensity > 0.7 && hoursSinceSession > 24) {
    return {
      shouldCheckin: true,
      reason: "intense_emotion_followup",
      checkinMessage: "Hey, I've been thinking about our last conversation. How are you doing today?",
    };
  }

  // Check in after crisis detection (after 48 hours if no return)
  if (lastSession.crisisDetected && hoursSinceSession > 48) {
    return {
      shouldCheckin: true,
      reason: "crisis_followup",
      checkinMessage: "I wanted to check in with you. I'm here if you'd like to talk.",
    };
  }

  return { shouldCheckin: false, reason: "no_checkin_needed" };
}

export async function proactiveCheckin(userId: string): Promise<void> {
  const lastSession = await getLastSession(userId);
  if (!lastSession) return;

  const decision = shouldCheckin({
    endedAt: lastSession.endedAt,
    emotionIntensity: lastSession.emotionIntensity ?? 0,
    crisisDetected: lastSession.crisisDetected ?? false,
  });

  if (decision.shouldCheckin && decision.checkinMessage) {
    await sendPushNotification(userId, {
      title: "Mollei",
      body: decision.checkinMessage,
      data: { type: "checkin", reason: decision.reason },
    });
  }
}

// Cron job handler (e.g., Vercel Cron)
// app/api/cron/checkin/route.ts
export async function GET() {
  // Called by Vercel Cron daily
  const usersToCheck = await getUsersForCheckin();
  await Promise.all(usersToCheck.map(proactiveCheckin));
  return Response.json({ checked: usersToCheck.length });
}
```

### 8.3 Token-Level Streaming (Phase 2)

```typescript
// app/api/chat/stream-tokens/route.ts
import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { runParallelModules, getPreResponseModules } from "@/lib/pipeline/orchestrator";
import { createPipelineContext, createTraceId } from "@/lib/infrastructure/trace";
import { MODELS } from "@/lib/ai/models";
import { TOKEN_BUDGETS, TRACE_SCOPE } from "@/lib/utils/constants";

export async function POST(request: NextRequest) {
  const { sessionId, userId, message } = await request.json();

  // Create pipeline context
  const ctx = createPipelineContext({
    traceId: createTraceId(TRACE_SCOPE.STREAM),
    sessionId,
    userId,
    turnNumber: 0,
  });

  // Run parallel agents first (non-streaming) using framework-agnostic orchestration
  const preResponseModules = getPreResponseModules();
  const preState = await runParallelModules(preResponseModules, { sessionId, userId, message }, ctx);

  // Stream the final response with Vercel AI SDK
  const result = streamText({
    model: anthropic(MODELS.SONNET),
    system: buildResponsePrompt(preState),
    prompt: message,
    maxTokens: TOKEN_BUDGETS.RESPONSE_GENERATOR,
    onFinish: async ({ text, usage }) => {
      // Persist after stream completes
      await persistTurn(sessionId, message, text, usage);
    },
  });

  // Return streaming response
  return result.toTextStreamResponse();
}
```

---

## 9. Testing Strategy

> **Extracted to**: [architecture/TESTING_STRATEGY.md](architecture/TESTING_STRATEGY.md)

Covers:
- Test categories and coverage targets
- Vitest configuration
- Golden dataset for safety testing
- Agent unit tests
- Integration tests for full pipeline

---

## 10. Deployment Checklist

### Pre-Launch

- [ ] All circuit breakers tested (open/close/half-open)
- [ ] Fallback chains verified for each agent
- [ ] Crisis detection golden dataset: 100% recall
- [ ] Latency budget verified: <3s P95, TTFT <1s with streaming
- [ ] LangSmith tracing enabled
- [ ] Error alerting configured
- [ ] Database backup automated
- [ ] Rate limiting in place

### Post-Launch

- [ ] Monitor crisis detection accuracy weekly
- [ ] Review fallback trigger rates daily
- [ ] A/B test personality variations (Phase 2)
- [ ] Track WRU-ETI (North Star metric)

---

## Appendix A: Crisis Resources (Auto-Appended)

```typescript
// lib/tools/crisis-resources.ts

export const CRISIS_RESOURCES = `

---
If you're in crisis, please reach out:
- 988 Suicide & Crisis Lifeline (US): Call or text 988
- Crisis Text Line: Text HOME to 741741
- International resources: https://www.iasp.info/resources/Crisis_Centres/

You're not alone. Help is available 24/7.
`;

export function appendCrisisResources(response: string): string {
  return `${response}\n${CRISIS_RESOURCES}`;
}

export function shouldAppendResources(crisisSeverity: number): boolean {
  return crisisSeverity >= 4;
}
```

---

## Appendix B: Decision Log

| Date | Decision | Alternatives Considered | Rationale |
|------|----------|------------------------|-----------|
| 2025-12-24 | **TypeScript over Python** | Python, Rust | Unified stack with Next.js frontend; better concurrency via V8; type safety for agent contracts |
| 2025-12-24 | **Next.js 15 App Router** | Express, Hono, standalone | Native SSE streaming; React Server Components; Vercel deployment; built-in API routes |
| 2025-12-24 | **Vercel AI SDK** | Direct Anthropic SDK | `generateObject` with Zod; built-in streaming; multi-provider support |
| 2025-12-27 | **Custom Pipeline Orchestrator over LangGraph** | LangGraph.js, CrewAI, Autogen | Framework-agnostic; no vendor lock-in |
| 2025-12-27 | **Zod State Schema over LangGraph Annotation** | LangGraph Annotation | No LangChain dependency; better TypeScript inference; runtime validation |
| 2025-12-27 | **OpenTelemetry-first tracing** | LangSmith-only | Vendor-neutral; export to any backend; LangSmith remains option for LLM-specific analysis |
| 2025-12-24 | Supervisor pattern over swarm | Swarm, hierarchical | Crisis safety requires deterministic routing |
| 2025-12-24 | Haiku for safety_monitor | Sonnet | Speed critical (<500ms); simple classification task |
| 2025-12-24 | Opus for response_generator | Sonnet | Quality > cost for core emotional response |
| 2025-12-24 | PostgreSQL checkpointing | Redis, in-memory | Durability for long sessions; standard SQL interface |
| 2025-12-24 | Vendor-neutral tracing | Direct LangSmith SDK | Pluggable backends; PII sanitization; cost aggregation |
| 2025-12-24 | Trace sampling (50% prod) | 100% all environments | Balance observability with cost; full traces in dev |
| 2025-12-24 | Strict sanitization mode | No sanitization | User messages contain PII; regulatory compliance |
| 2025-12-24 | Drizzle ORM | Prisma, TypeORM | Lightweight; SQL-first; excellent TypeScript inference |
| 2025-12-24 | Vitest over Jest | Jest, Node test runner | Faster; native ESM; better Vite integration |
| 2025-12-28 | **Document modularization** | Single monolithic file | Maintainability; focused concerns; easier navigation |

---

**Document Status**: v5.4 - Modularized Architecture
**Revision History**:
- v1.0 (2025-12-24): Initial blueprint (Python/FastAPI)
- v2.0 (2025-12-24): Enhanced observability patterns
- v3.0 (2025-12-24): Full TypeScript conversion (Next.js, LangGraph.js, Vercel AI SDK)
- v4.0 (2025-12-24): Referenced architecture patterns
- v4.1 (2025-12-24): Microsoft AI Agent Design Patterns integration
- v4.2 (2025-12-24): North Star instrumentation (WRU-ETI, BEL calculation, ETI evaluation)
- v5.0 (2025-12-27): Framework-agnostic architecture (removed LangGraph/LangChain dependencies)
- v5.1 (2025-12-27): Self-correction patterns
- v5.2 (2025-12-27): Performance optimization patterns
- v5.3 (2025-12-27): JTBD-enhanced system prompts with few-shot examples
- v5.4 (2025-12-28): **Modularized architecture** (split into 6 focused documents in `docs/architecture/`)

**Key Changes in v5.4** (Modularized Architecture):
- Split 6,749-line monolithic document into 7 focused files
- Core blueprint reduced to ~700 lines with navigation links
- Extracted documents in `docs/architecture/`:
  - PIPELINE_ORCHESTRATION.md (1,397 lines)
  - RESILIENCE_PATTERNS.md (247 lines)
  - AGENT_PROMPTS.md (1,231 lines)
  - IMPLEMENTATION_SCAFFOLD.md (646 lines)
  - OBSERVABILITY.md (2,256 lines)
  - TESTING_STRATEGY.md (240 lines)
- Total: 6,717+ lines (100% content + metadata headers/footers)
- Added cross-references to extracted documents in each section

**Key Changes in v5.3** (JTBD-Enhanced System Prompts):
- **Jobs-To-Be-Done framework**: Each agent now has explicit job_to_be_done, success_criteria (functional/emotional/social)
- **Social-evaluative emotions**: Added shame, guilt, imposter_syndrome, social_anxiety, embarrassment, envy to mood_sensor
- **Few-shot examples**: Added 21 examples across mood_sensor (5), memory_agent (4), safety_monitor (6), emotion_reasoner (6)
- **Cross-agent handoff**: Added `suggested_response_modifier` output from safety_monitor to response_generator
- **Harmful belief guidance**: Added explicit guidance for validating feelings without validating harmful beliefs
- **Conversation phase awareness**: Added `turn_number` input for phase-appropriate behavior
- **Edge case handling**: Added guidance for testing, minimal input, pushback, topic switching, excessive positivity
- **Response variety**: Added phrase rotation and acknowledgment variants to prevent repetition
- **Token budget adjustments**: +450 tokens total (mood_sensor +100, memory_agent +50, safety_monitor +100, emotion_reasoner +100, response_generator +100)
- **Research alignment**: MIND-SAFE Framework (JMIR 2025), Brown University AI Ethics Study (2025)

**Key Changes in v5.2** (Performance Optimization):
- **Pluggable Backend Protocol** (section 2.6.1): EmotionBackend interface for swappable emotion detection
- **Two-Stage Emotion Analysis** (section 2.6.2): Local model → LLM escalation (61% latency reduction, 70% cost savings)
- **Mood Sensor Integration** (section 2.6.3): Seamless two-stage integration with existing pipeline
- Added files: `lib/backends/emotion-backend.ts`, `lib/backends/local-emotion.ts`, `lib/backends/claude-emotion.ts`, `two-stage-emotion.ts`
- Environment configuration for backend selection and thresholds

**Key Changes in v5.1** (Self-Correction Patterns):
- **Quality-gated safety routing** (section 2.5.1): Confidence-aware crisis detection with recheck loop
- **Unified retry feedback** (section 2.5.2): Structured feedback for response regeneration (empathy gaps, missed cues, tone issues)
- **Adaptive quality thresholds** (section 2.5.4): Lower expectations when emotional input is ambiguous
- Added state fields: `crisisConfidence`, `ambiguousSafetySignals`, `safetyAttempts`, `responseAttempts`, `retryFeedback`, `emotionConfidence`, `inputAmbiguous`
- Updated pipeline graph with Phase 1B (safety quality gate) and self-correcting response generation
- Added files: `response-evaluator.ts`, `response-generator-retry.ts`, `quality-thresholds.ts`

**Key Changes in v5.0** (Framework-Agnostic):
- **Removed LangGraph.js dependency**: Replaced with custom pipeline orchestrator
- **Removed LangChain dependency**: State schema now uses Zod instead of LangGraph Annotation
- **OpenTelemetry-first tracing**: Primary instrumentation format; LangSmith as optional backend
- **Added `OpenTelemetryHandler`** (section 6.5a): Vendor-neutral span creation with gen_ai semantic conventions
- **Added `otel-bootstrap.ts`**: OTEL SDK initialization for Next.js instrumentation hook
- Replaced `StateGraph` with `runSequentialPipeline()`, `runParallelModules()`, `runConditionalPipeline()`
- Replaced `Annotation.Root()` with Zod schemas (`MolleiStateSchema`, `EmotionStateSchema`)
- Replaced `addEdge()`/`addConditionalEdges()` with explicit function composition
- Updated package.json: removed `@langchain/langgraph`, `@langchain/langgraph-checkpoint-postgres`
- Added `uuidv7` for branded trace IDs, optional `@opentelemetry/*` packages
- Updated directory structure: `lib/graph/` → `lib/pipeline/`

**Key Changes in v4.2**:
- Added section 6E: North Star Instrumentation (WRU-ETI)
- Implemented Baseline Emotional Level (BEL) calculation with rolling averages
- Added Emotional Trajectory Improvement (ETI) evaluation with confidence scoring
- Created WRU-ETI aggregation for North Star metric tracking
- Added database schema for session-end emotion capture
- Integrated ETI tracing into observability infrastructure

**Key Changes in v4.1**:
- Mapped orchestration to Microsoft pattern taxonomy (Concurrent, Sequential, Handoff, Maker-Checker)
- Added Maker-Checker loop for crisis response validation (safety_validator)
- Added Handoff pattern for human escalation (severity 5, repeated crisis, user request)
- Added concurrent agent execution with proper result aggregation
- Added context window management with strategy-based passing
- Documented common pitfalls and Mollei mitigations
- Updated pipeline diagram with new patterns

**Microsoft AI Agent Patterns (v4.1)**:
| Pattern | Purpose | Reference |
|---------|---------|-----------|
| Concurrent | Parallel agent analysis | Azure AI Agent Patterns |
| Sequential | Linear refinement | Azure AI Agent Patterns |
| Handoff | Human escalation | Azure AI Agent Patterns |
| Maker-Checker | Crisis response validation | Azure AI Agent Patterns |
| Context Window Mgmt | Token efficiency | Azure AI Agent Patterns |

**Referenced Patterns (v4.0)**:
| Pattern | Purpose |
|---------|---------|
| Branded TraceId | Type-safe trace correlation |
| Request-Scoped Budgets | Prevent concurrent interference |
| Per-Request LLM Limiter | Queue isolation |
| Race Condition Handler | Cache consistency |
| Coherency Tracing | Consistency monitoring |
| Input Validation Stage | Early pipeline failure |
| Sanitization Modes | PII protection by environment |

**Next Review**: After Phase 1 launch

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
