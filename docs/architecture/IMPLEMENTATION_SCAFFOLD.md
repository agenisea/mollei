# Implementation Scaffold

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-30-25 6:00PM PST

---

## 5.1 Directory Structure (Next.js)

```
mollei/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── .env.local.example
├── docker-compose.yml
│
├── app/                                 # Next.js App Router
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Landing page
│   │
│   ├── api/                             # API Routes
│   │   ├── chat/
│   │   │   └── route.ts                 # POST /api/chat (SSE streaming)
│   │   └── session/
│   │       └── [sessionId]/
│   │           └── route.ts             # GET /api/session/:sessionId
│   │
│   ├── chat/
│   │   └── page.tsx                     # Main chat interface
│   │
│   └── settings/
│       └── page.tsx                     # User settings
│
├── lib/                                 # Core business logic
│   ├── pipeline/                        # Framework-agnostic orchestration
│   │   ├── index.ts                     # Exports
│   │   ├── state.ts                     # MolleiStateSchema (Zod-based)
│   │   ├── orchestrator.ts              # runSequentialPipeline, runParallelModules
│   │   ├── types.ts                     # PipelineModule, PipelineContext interfaces
│   │   ├── context.ts                   # createPipelineContext factory
│   │   ├── routing.ts                   # Quality-gated routing functions
│   │   ├── response-evaluator.ts        # Response quality evaluation + feedback
│   │   ├── response-generator-retry.ts  # Self-correcting response generation
│   │   ├── quality-thresholds.ts        # Adaptive threshold logic
│   │   ├── two-stage-emotion.ts         # Two-stage emotion analysis
│   │   └── stages/                      # Pipeline stages
│   │       ├── input-validation.ts      # Input validation stage
│   │       └── cache-check.ts           # Cache lookup with race handling
│   │
│   ├── backends/                        # Pluggable backend protocols
│   │   ├── index.ts                     # Exports
│   │   ├── emotion-backend.ts           # EmotionBackend interface + implementations
│   │   └── sentiment-model.ts           # Local sentiment model loader
│   │
│   ├── agents/
│   │   ├── index.ts                     # Agent exports
│   │   ├── base.ts                      # BaseAgent class with resilience
│   │   ├── mood-sensor.ts               # Emotion detection
│   │   ├── memory-agent.ts              # Context retrieval
│   │   ├── memory-extractor.ts          # Selective memory persistence
│   │   ├── safety-monitor.ts            # Crisis detection
│   │   ├── emotion-reasoner.ts          # Mollei's emotional response
│   │   └── response-generator.ts        # Final response generation
│   │
│   ├── infrastructure/                  # Tracing & observability
│   │   ├── index.ts
│   │   ├── trace.ts                     # Generic trace events, handler interface
│   │   ├── trace-id.ts                  # Branded TraceId type
│   │   ├── trace-coherency.ts           # Emotion/personality drift tracing
│   │   ├── trace-sanitizer.ts           # PII/secret redaction
│   │   ├── otel-handler.ts              # OpenTelemetry handler (PRIMARY)
│   │   ├── otel-bootstrap.ts            # OpenTelemetry SDK initialization
│   │   ├── langsmith-handler.ts         # LangSmith backend (optional)
│   │   ├── cost-aggregator.ts           # Per-turn cost tracking
│   │   ├── console-handler.ts           # Development console logging
│   │   ├── tracing-bootstrap.ts         # Server startup initialization
│   │   ├── token-budget.ts              # TokenBudgetTracker
│   │   ├── llm-limiter.ts               # Per-request LLM concurrency
│   │   ├── cache.ts                     # CacheStatus types
│   │   └── cache-race.ts                # Race condition handler
│   │
│   ├── prompts/
│   │   ├── index.ts                     # Prompt loader
│   │   ├── mood-sensor.ts
│   │   ├── memory-agent.ts
│   │   ├── safety-monitor.ts
│   │   ├── emotion-reasoner.ts
│   │   ├── response-generator.ts
│   │   └── personality/
│   │       └── infj-listener.ts         # Default personality
│   │
│   ├── tools/
│   │   ├── index.ts
│   │   ├── session-context.ts           # querySessionContext
│   │   ├── conversation-turns.ts        # getRecentTurns
│   │   └── crisis-resources.ts          # appendCrisisResources
│   │
│   ├── resilience/
│   │   ├── index.ts
│   │   ├── circuit-breaker.ts           # Circuit breaker implementation
│   │   ├── fallbacks.ts                 # Fallback chains
│   │   └── timeouts.ts                  # Timeout utilities
│   │
│   ├── server/
│   │   ├── index.ts
│   │   └── monitoring.ts                # Structured logging
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts                    # Drizzle ORM schema
│   │   ├── client.ts                    # Database client
│   │   └── repositories/
│   │       ├── session.ts               # Session CRUD
│   │       └── turn.ts                  # Conversation turn CRUD
│   │
│   ├── ai/
│   │   ├── index.ts
│   │   ├── client.ts                    # Anthropic client setup
│   │   └── models.ts                    # Model configurations
│   │
│   └── utils/
│       ├── constants.ts                 # App constants
│       └── helpers.ts                   # Utility functions
│
├── components/                          # React components
│   ├── ui/                              # shadcn/ui components
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   ├── message-bubble.tsx
│   │   └── typing-indicator.tsx
│   └── layout/
│       ├── header.tsx
│       └── sidebar.tsx
│
├── contracts/                           # Zod schemas for validation
│   ├── chat.ts                          # Chat request/response schemas
│   ├── session.ts                       # Session schemas
│   └── emotion.ts                       # Emotion state schemas
│
├── __tests__/                           # Test files
│   ├── setup.ts                         # Test setup
│   ├── agents/                          # Unit tests per agent
│   ├── graph/                           # Integration tests
│   ├── resilience/                      # Failure mode tests
│   └── infrastructure/                  # Tracing and sanitization tests
│
├── scripts/
│   ├── dev.sh
│   ├── test.sh
│   └── migrate.ts
│
└── infrastructure/
    ├── terraform/                       # (Optional) IaC
    └── k8s/                            # (Optional) Kubernetes manifests
```

---

## 5.2 Configuration & Constants

### `lib/ai/models.ts` — Model Configuration

Centralized model identifiers and pricing. **Never use model strings directly** — always import from this module.

```typescript
// lib/ai/models.ts

/**
 * Anthropic model identifiers.
 * Single source of truth for all model references.
 */
export const MODELS = {
  HAIKU: "claude-haiku-4-5",
  SONNET: "claude-sonnet-4-5",
  OPUS: "claude-opus-4-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Model pricing per 1M tokens (USD).
 * Used by cost-aggregator for spend tracking.
 */
export const MODEL_PRICING: Record<ModelId, { input: number; output: number }> = {
  [MODELS.OPUS]: { input: 5.0, output: 25.0 },
  [MODELS.SONNET]: { input: 3.0, output: 15.0 },
  [MODELS.HAIKU]: { input: 1.0, output: 5.0 },
};

/**
 * Default model assignments per agent.
 * Override via environment variables for A/B testing.
 */
export const AGENT_MODELS = {
  MOOD_SENSOR: MODELS.HAIKU,
  MEMORY_AGENT: MODELS.HAIKU,
  SAFETY_MONITOR: MODELS.HAIKU,
  EMOTION_REASONER: MODELS.HAIKU,
  RESPONSE_GENERATOR: MODELS.SONNET,
  CRISIS_ESCALATION: MODELS.OPUS,
} as const;
```

**Usage in agents:**
```typescript
import { AGENT_MODELS } from "@/lib/ai/models";
import { anthropic } from "@ai-sdk/anthropic";

const config: AgentConfig = {
  agentId: "mood_sensor",
  model: AGENT_MODELS.MOOD_SENSOR,  // ✓ Correct
  // model: "claude-haiku-4-5",      // ✗ Never use magic strings
};

// When calling the model
const { object } = await generateObject({
  model: anthropic(AGENT_MODELS.MOOD_SENSOR),
  // ...
});
```

---

### `lib/utils/constants.ts` — Application Constants

Centralized constants for timeouts, budgets, and business rules.

```typescript
// lib/utils/constants.ts

/**
 * Agent timeout budgets (milliseconds).
 * Phase 1 agents run in parallel with strict timeouts.
 */
export const TIMEOUTS = {
  // Phase 1 agents
  MOOD_SENSOR: 500,
  MEMORY_AGENT: 500,
  SAFETY_MONITOR: 500,
  EMOTION_REASONER: 800,
  RESPONSE_GENERATOR: 3000,
  PIPELINE_TOTAL: 5000,
  // Phase 2 extensions
  LONG_TERM_MEMORY: 1500,
} as const;

/**
 * Token budgets per agent.
 * Prevents runaway costs and ensures fast responses.
 */
export const TOKEN_BUDGETS = {
  // Phase 1 agents
  MOOD_SENSOR: 300,
  MEMORY_AGENT: 500,
  SAFETY_MONITOR: 300,
  EMOTION_REASONER: 400,
  RESPONSE_GENERATOR: 1000,
  // Phase 2 extensions
  LONG_TERM_MEMORY: 500,
  // Crisis handling (extended budget)
  CRISIS_RESPONSE: 2000,
} as const;

/**
 * Crisis severity thresholds.
 */
export const CRISIS_SEVERITY = {
  PROCEED: 1,
  WARM_VALIDATE: 2,
  SUGGEST_HUMAN: 3,
  CRISIS_SUPPORT: 4,
  IMMEDIATE_DANGER: 5,
} as const;

export type CrisisSeverity = (typeof CRISIS_SEVERITY)[keyof typeof CRISIS_SEVERITY];

/**
 * Cache status values for response headers and metadata.
 */
export const CACHE_STATUS = {
  HIT: "hit",
  MISS: "miss",
  RACE: "race",
  BYPASS: "bypass",
} as const;

export type CacheStatus = (typeof CACHE_STATUS)[keyof typeof CACHE_STATUS];

/**
 * Circuit breaker configuration.
 */
export const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 3,
  RESET_TIMEOUT_MS: 30000,
  HALF_OPEN_MAX_REQUESTS: 2,
} as const;

/**
 * Agent identifiers.
 * Single source of truth for agent naming across pipeline, tracing, and resilience.
 */
export const AGENT_IDS = {
  // Phase 1 agents
  MOOD_SENSOR: "mood_sensor",
  MEMORY_AGENT: "memory_agent",
  SAFETY_MONITOR: "safety_monitor",
  EMOTION_REASONER: "emotion_reasoner",
  RESPONSE_GENERATOR: "response_generator",
  // Phase 2 extensions
  LONG_TERM_MEMORY: "long_term_memory",
} as const;

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS];

/**
 * Security gateways (pre-pipeline validation stages).
 * These are NOT LLM agents - they're validation checkpoints.
 */
export const GATEWAY_IDS = {
  INPUT_PARSER: "input_parser",
  PRIVACY_SENTINEL: "privacy_sentinel",  // Phase 2+
} as const;

export type GatewayId = (typeof GATEWAY_IDS)[keyof typeof GATEWAY_IDS];

/** Union type for all pipeline node identifiers */
export type PipelineNodeId = AgentId | GatewayId;

/**
 * Safety signal types detected by safety_monitor.
 */
export const SIGNAL_TYPES = {
  SUICIDAL: "suicidal",
  SELF_HARM: "self_harm",
  ABUSE: "abuse",
  SAFETY: "safety",
  DISTRESS: "distress",
  NONE: "none",
} as const;

export type SignalType = (typeof SIGNAL_TYPES)[keyof typeof SIGNAL_TYPES];

/**
 * Response modifiers from safety_monitor to response_generator.
 * Controls how response_generator adjusts tone/content based on safety signals.
 */
export const RESPONSE_MODIFIERS = {
  NONE: "none",
  INCLUDE_SAFETY_CHECK: "include_safety_check",
  WARM_VALIDATION_FIRST: "warm_validation_first",
  GENTLE_RESOURCES: "gentle_resources",
} as const;

export type ResponseModifier = (typeof RESPONSE_MODIFIERS)[keyof typeof RESPONSE_MODIFIERS];

/**
 * Emotional approach strategies for emotion_reasoner.
 * Determines Mollei's response posture based on user emotional state.
 */
export const APPROACH_TYPES = {
  VALIDATE: "validate",
  SUPPORT: "support",
  EXPLORE: "explore",
  CRISIS_SUPPORT: "crisis_support",
} as const;

export type ApproachType = (typeof APPROACH_TYPES)[keyof typeof APPROACH_TYPES];

/**
 * Default fallback emotion when mood_sensor fails or times out.
 * Neutral baseline that doesn't bias downstream processing.
 */
export const FALLBACK_EMOTION = {
  primary: "neutral",
  secondary: null,
  intensity: 0.5,
  valence: 0,
  signals: [],
} as const;

/**
 * Relationship stages for conversation phase awareness.
 */
export const RELATIONSHIP_STAGES = {
  NEW: "new",
  BUILDING: "building",
  ESTABLISHED: "established",
} as const;

export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[keyof typeof RELATIONSHIP_STAGES];

/**
 * Emotional trajectory directions from memory_agent.
 */
export const EMOTIONAL_TRAJECTORY = {
  IMPROVING: "improving",
  STABLE: "stable",
  DECLINING: "declining",
} as const;

export type EmotionalTrajectory = (typeof EMOTIONAL_TRAJECTORY)[keyof typeof EMOTIONAL_TRAJECTORY];

/**
 * Trace scopes for observability events.
 * Used to categorize trace events by domain.
 */
export const TRACE_SCOPE = {
  TURN: "TURN",
  AGENT: "AGENT",
  LLM: "LLM",
  SAFETY: "SAFETY",
  MEMORY: "MEMORY",
  EMOTION: "EMOTION",
  TEST: "TEST",
  STREAM: "STREAM",
} as const;

export type TraceScope = (typeof TRACE_SCOPE)[keyof typeof TRACE_SCOPE];

/**
 * Trace event types for observability.
 * Categorizes what happened during pipeline execution.
 */
export const TRACE_EVENT_TYPE = {
  // Pipeline lifecycle
  RUN_START: "run_start",
  RUN_END: "run_end",
  STAGE: "stage",
  RETRY: "retry",
  ERROR: "error",
  METRIC: "metric",
  // LLM-specific
  LLM_CALL: "llm_call",
  // Domain-specific
  CRISIS_DETECTED: "crisis_detected",
  EMOTION_SHIFT: "emotion_shift",
  MEMORY_CALLBACK: "memory_callback",
  COHERENCY: "coherency",
  // Metrics
  ETI_CALCULATION: "eti_calculation",
  WRU_ETI_WEEKLY: "wru_eti_weekly",
} as const;

export type TraceEventType = (typeof TRACE_EVENT_TYPE)[keyof typeof TRACE_EVENT_TYPE];

// ─────────────────────────────────────────────────────────────
// Security Constants (see SECURITY_ARCHITECTURE.md)
// ─────────────────────────────────────────────────────────────

/**
 * Authentication expiry times (milliseconds).
 */
export const AUTH_EXPIRY = {
  AGENT_TICKET_MS: 300_000,    // 5 minutes - inter-agent auth tickets
  SESSION_TOKEN_MS: 3600_000,  // 1 hour - user session tokens
  REFRESH_TOKEN_MS: 604800_000, // 7 days - refresh tokens
} as const;

/**
 * Rate limiting thresholds.
 */
export const RATE_LIMITS = {
  TOKENS_PER_DAY: 100_000,     // Default daily token budget per user
  REQUESTS_PER_MINUTE: 60,    // API requests per minute
  MESSAGES_PER_HOUR: 100,     // Chat messages per hour
} as const;

/**
 * Anomaly detection baselines.
 */
export const ANOMALY_BASELINE = {
  LATENCY_MS: 1000,           // Expected mean latency
  LATENCY_STDEV_MS: 500,      // Expected latency standard deviation
  BASELINE_WINDOW: 100,       // Number of samples for baseline calculation
} as const;

/**
 * Content sanitization limits.
 */
export const SANITIZATION = {
  MAX_CONTENT_LENGTH: 1000,   // Max characters before truncation
  CONTEXT_PREVIEW_LENGTH: 500, // Max characters for logging context
  TRUNCATION_SUFFIX: "...",
} as const;

// ─────────────────────────────────────────────────────────────
// Self-Correction & Quality Gates
// ─────────────────────────────────────────────────────────────

/**
 * Retry limits for self-correction loops.
 * Prevents infinite loops while allowing quality improvement.
 */
export const RETRY_LIMITS = {
  RESPONSE_ATTEMPTS: 2,           // Max response generation retries
  SAFETY_ATTEMPTS: 2,             // Max safety recheck iterations
  MAKER_CHECKER_ITERATIONS: 3,    // Max maker-checker validation loops
} as const;

/**
 * Quality thresholds for routing and evaluation.
 * Used by routing functions and response evaluators.
 */
export const QUALITY_THRESHOLDS = {
  // Crisis confidence gates
  CRISIS_CONFIDENCE_HIGH: 0.8,    // High confidence → immediate crisis response
  CRISIS_CONFIDENCE_RECHECK: 0.7, // Below this → recheck with more context

  // Response quality thresholds
  RESPONSE_NORMAL: 0.75,          // Normal quality bar
  RESPONSE_LOW: 0.6,              // Lowered bar for ambiguous input
  RESPONSE_FLOOR: 0.5,            // Absolute minimum threshold

  // Evaluation minimums
  EMPATHY_MIN: 0.7,               // Minimum empathy score
  TONE_ALIGNMENT_MIN: 0.7,        // Minimum tone alignment score
  GROUNDEDNESS_MIN: 0.8,          // Minimum groundedness score

  // Adaptive adjustments (subtracted from threshold)
  LOW_CONFIDENCE_PENALTY: 0.15,   // When emotionConfidence < 0.6
  AMBIGUOUS_INPUT_PENALTY: 0.10,  // When inputAmbiguous = true
  MIXED_EMOTION_PENALTY: 0.05,    // When secondary emotion with high intensity
} as const;

/**
 * Two-stage emotion analysis thresholds.
 * Stage 1: Fast local sentiment. Stage 2: LLM (only if needed).
 */
export const TWO_STAGE = {
  CONFIDENCE_THRESHOLD: 0.8,      // Skip LLM if local confidence >= this
  SEVERITY_THRESHOLD: 3,          // Always use LLM if severity >= this
} as const;

/**
 * Idempotency configuration for memory updates.
 */
export const IDEMPOTENCY = {
  OPERATION_TTL_SECONDS: 3600,    // 1 hour - Redis key expiry
} as const;

/**
 * Per-agent circuit breaker overrides.
 * Safety-critical agents get higher thresholds (more tolerance).
 * Response generator gets lower threshold (critical path, fail fast).
 */
export const CIRCUIT_BREAKER_OVERRIDES: Partial<Record<AgentId, { failureThreshold: number }>> = {
  [AGENT_IDS.MOOD_SENSOR]: { failureThreshold: 5 },
  [AGENT_IDS.SAFETY_MONITOR]: { failureThreshold: 5 },
  [AGENT_IDS.RESPONSE_GENERATOR]: { failureThreshold: 2 },
} as const;
```

---

### Environment Variables

All secrets and configuration are loaded from environment variables. **Never commit secrets to the repository.**

```bash
# .env.local.example

# =============================================================================
# REQUIRED: LLM Provider
# =============================================================================
ANTHROPIC_API_KEY=sk-ant-...           # Anthropic API key (required)

# =============================================================================
# REQUIRED: Database
# =============================================================================
DATABASE_URL=postgresql://...           # Supabase/Postgres connection string
SUPABASE_URL=https://xxx.supabase.co   # Supabase project URL
SUPABASE_ANON_KEY=eyJh...              # Supabase anonymous key (public)
SUPABASE_SERVICE_KEY=eyJh...           # Supabase service role key (server-only)

# =============================================================================
# OPTIONAL: Caching (Phase 1+)
# =============================================================================
REDIS_URL=redis://localhost:6379       # Redis for idempotency keys + circuit breaker state

# =============================================================================
# OPTIONAL: Observability
# =============================================================================
TRACE_ENABLED=true                      # Enable/disable tracing (default: true)
TRACE_API_KEY=lsv2_sk_...              # LangSmith API key (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=...        # OpenTelemetry collector endpoint

# =============================================================================
# OPTIONAL: Development
# =============================================================================
SHOW_DEBUG_LOGS=false                   # Verbose logging (default: false)
NODE_ENV=development                    # development | production | test
```

**Server-side access:**
```typescript
// lib/ai/client.ts
import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropicClient = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**Security rules:**
- `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_KEY`, `TRACE_API_KEY` are **server-only**
- Never expose in client bundles or API responses
- Use Next.js server components or API routes for LLM calls
- PII sanitizer redacts leaked keys: `[/sk-[a-zA-Z0-9]{32,}/g, "[API_KEY]"]`

---

## 5.3 Key Module Implementations

### `lib/agents/base.ts`

> **SOLID Compliance**: `BaseAgent` follows the Dependency Inversion Principle (DIP) by depending on the `ICircuitBreaker` interface rather than the concrete `CircuitBreaker` class. This enables test doubles and alternative implementations.

```typescript
// lib/agents/base.ts
import { MolleiState } from "../pipeline/state";
import {
  ICircuitBreaker,
  CircuitBreaker,
  CircuitBreakerFactory,
  defaultCircuitBreakerFactory,
} from "../resilience/circuit-breaker";
import { traceAgentStage, traceLlmCall } from "../infrastructure/trace";
import { logFallback } from "../server/monitoring";

export interface AgentConfig {
  agentId: string;
  model: string;
  tokenBudget: number;
  timeoutMs: number;
}

export type FallbackFn = (state: MolleiState) => Partial<MolleiState>;

/**
 * Options for BaseAgent construction.
 * Supports dependency injection for testing and alternative implementations.
 */
export interface AgentOptions {
  circuitBreaker?: ICircuitBreaker;
  circuitBreakerFactory?: CircuitBreakerFactory;
}

/**
 * Abstract base class for all Mollei agents.
 *
 * Provides:
 * - Circuit breaker resilience (injectable via ICircuitBreaker)
 * - Timeout handling with fallback
 * - Latency tracking
 * - Error logging
 *
 * @example
 * // Production usage (default circuit breaker)
 * class MoodSensor extends BaseAgent {
 *   constructor() {
 *     super(config, fallbackFn);
 *   }
 * }
 *
 * @example
 * // Testing with injected circuit breaker
 * class MoodSensor extends BaseAgent {
 *   constructor(options?: AgentOptions) {
 *     super(config, fallbackFn, options);
 *   }
 * }
 * const agent = new MoodSensor({ circuitBreaker: new AlwaysClosedCircuitBreaker() });
 */
export abstract class BaseAgent {
  protected circuitBreaker: ICircuitBreaker;

  constructor(
    protected config: AgentConfig,
    protected fallbackFn: FallbackFn,
    options?: AgentOptions
  ) {
    // DIP: Accept interface, default to concrete implementation
    this.circuitBreaker =
      options?.circuitBreaker ??
      (options?.circuitBreakerFactory ?? defaultCircuitBreakerFactory)(config.agentId);
  }

  protected abstract execute(state: MolleiState): Promise<Partial<MolleiState>>;

  async invoke(state: MolleiState): Promise<Partial<MolleiState>> {
    const start = performance.now();

    if (!this.circuitBreaker.allowRequest()) {
      logFallback(state.traceId, this.config.agentId, 0, "circuit_open");
      return this.withLatency(this.fallbackFn(state), start);
    }

    try {
      const result = await Promise.race([
        this.execute(state),
        this.timeoutPromise(),
      ]);

      this.circuitBreaker.recordSuccess();
      traceAgentStage(state.traceId, this.config.agentId, "success", performance.now() - start);
      return this.withLatency(result, start);
    } catch (error) {
      this.circuitBreaker.recordFailure();
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg === "Timeout") {
        logFallback(state.traceId, this.config.agentId, 1, "timeout");
      } else {
        logFallback(state.traceId, this.config.agentId, 1, errorMsg);
      }

      return this.withLatency(
        { ...this.fallbackFn(state), agentErrors: [errorMsg] },
        start
      );
    }
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), this.config.timeoutMs)
    );
  }

  private withLatency(result: Partial<MolleiState>, start: number): Partial<MolleiState> {
    const elapsedMs = Math.round(performance.now() - start);
    return {
      ...result,
      latencyMs: { ...result.latencyMs, [this.config.agentId]: elapsedMs },
    };
  }
}
```

**Usage in Tests:**

```typescript
// __tests__/agents/mood-sensor.test.ts
import { MoodSensor } from "@/lib/agents/mood-sensor";
import { AlwaysClosedCircuitBreaker, AlwaysOpenCircuitBreaker } from "@/lib/resilience/circuit-breaker-test";

describe("MoodSensor", () => {
  it("should return fallback when circuit is open", async () => {
    const agent = new MoodSensor({
      circuitBreaker: new AlwaysOpenCircuitBreaker(),
    });

    const result = await agent.invoke(mockState);

    expect(result.userEmotion).toEqual(FALLBACK_EMOTION);
  });

  it("should execute normally when circuit is closed", async () => {
    const agent = new MoodSensor({
      circuitBreaker: new AlwaysClosedCircuitBreaker(),
    });

    const result = await agent.invoke(mockState);

    expect(result.userEmotion?.primary).toBeDefined();
  });
});
```

---

### `lib/agents/mood-sensor.ts`

```typescript
// lib/agents/mood-sensor.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { BaseAgent, AgentConfig } from "./base";
import { MolleiState } from "../pipeline/state";
import { MOOD_SENSOR_PROMPT } from "../prompts/mood-sensor";
import { traceLlmCall } from "../infrastructure/trace";
import { calculateCost } from "../infrastructure/cost-aggregator";
import { AGENT_MODELS } from "../ai/models";
import { AGENT_IDS, TOKEN_BUDGETS, TIMEOUTS, FALLBACK_EMOTION } from "../utils/constants";

const EmotionSchema = z.object({
  primary: z.string(),
  secondary: z.string().nullable(),
  intensity: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  signals: z.array(z.string()),
});

const config: AgentConfig = {
  agentId: AGENT_IDS.MOOD_SENSOR,
  model: AGENT_MODELS.MOOD_SENSOR,
  tokenBudget: TOKEN_BUDGETS.MOOD_SENSOR,
  timeoutMs: TIMEOUTS.MOOD_SENSOR,
};

const fallback = (state: MolleiState) => ({
  userEmotion: FALLBACK_EMOTION,
});

export class MoodSensor extends BaseAgent {
  constructor() {
    super(config, fallback);
  }

  protected async execute(state: MolleiState): Promise<Partial<MolleiState>> {
    const start = performance.now();

    const { object, usage } = await generateObject({
      model: anthropic(this.config.model),
      schema: EmotionSchema,
      system: MOOD_SENSOR_PROMPT,
      prompt: state.userMessage,
      maxTokens: this.config.tokenBudget,
    });

    // Trace LLM call
    const durationMs = performance.now() - start;
    const cost = calculateCost(this.config.model, usage.promptTokens, usage.completionTokens);
    traceLlmCall(
      state.traceId,
      this.config.agentId,
      this.config.model,
      usage.promptTokens,
      usage.completionTokens,
      durationMs,
      cost
    );

    return { userEmotion: object };
  }
}

// Pipeline module wrapper (implements PipelineModule interface)
export class MoodSensorModule implements PipelineModule<MolleiState, Partial<MolleiState>> {
  async execute(state: MolleiState, context: PipelineContext): Promise<Partial<MolleiState>> {
    const agent = new MoodSensor();
    return agent.invoke(state);
  }
}
```

---

### `lib/agents/safety-monitor.ts`

```typescript
// lib/agents/safety-monitor.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { BaseAgent, AgentConfig } from "./base";
import { MolleiState } from "../pipeline/state";
import { SAFETY_MONITOR_PROMPT } from "../prompts/safety-monitor";
import { traceCrisisDetected } from "../infrastructure/trace";
import { AGENT_MODELS } from "../ai/models";
import { AGENT_IDS, TOKEN_BUDGETS, TIMEOUTS, SIGNAL_TYPES, CRISIS_SEVERITY } from "../utils/constants";

const SafetySchema = z.object({
  crisisDetected: z.boolean(),
  severity: z.number().min(1).max(5),
  signalType: z.enum([
    SIGNAL_TYPES.SUICIDAL,
    SIGNAL_TYPES.SELF_HARM,
    SIGNAL_TYPES.ABUSE,
    SIGNAL_TYPES.SAFETY,
    SIGNAL_TYPES.DISTRESS,
    SIGNAL_TYPES.NONE,
  ]),
  confidence: z.number().min(0).max(1),
  keyPhrases: z.array(z.string()),
});

const config: AgentConfig = {
  agentId: AGENT_IDS.SAFETY_MONITOR,
  model: AGENT_MODELS.SAFETY_MONITOR,
  tokenBudget: TOKEN_BUDGETS.SAFETY_MONITOR,
  timeoutMs: TIMEOUTS.SAFETY_MONITOR,
};

const fallback = (state: MolleiState) => ({
  crisisDetected: false,
  crisisSeverity: CRISIS_SEVERITY.PROCEED,
  crisisSignalType: SIGNAL_TYPES.NONE,
});

export class SafetyMonitor extends BaseAgent {
  constructor() {
    super(config, fallback);
  }

  protected async execute(state: MolleiState): Promise<Partial<MolleiState>> {
    const { object } = await generateObject({
      model: anthropic(this.config.model),
      schema: SafetySchema,
      system: SAFETY_MONITOR_PROMPT,
      prompt: state.userMessage,
      maxTokens: this.config.tokenBudget,
    });

    // Trace if crisis detected
    if (object.crisisDetected) {
      traceCrisisDetected(
        state.traceId,
        object.severity,
        object.signalType,
        object.confidence
      );
    }

    return {
      crisisDetected: object.crisisDetected,
      crisisSeverity: object.severity,
      crisisSignalType: object.signalType,
    };
  }
}

export async function safetyMonitorNode(state: MolleiState): Promise<Partial<MolleiState>> {
  const agent = new SafetyMonitor();
  return agent.invoke(state);
}
```

---

## 5.4 API Integration (Next.js App Router)

### Main Chat Endpoint

```typescript
// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { runSequentialPipeline, getMolleiPipeline } from "@/lib/pipeline/orchestrator";
import { MolleiState, MolleiStateSchema } from "@/lib/pipeline/state";
import { createTraceId, createPipelineContext } from "@/lib/infrastructure/trace";
import { getTurnNumber } from "@/lib/db/repositories/session";
import { TRACE_SCOPE } from "@/lib/utils/constants";

// Request validation schema
const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().min(1),
  message: z.string().min(1).max(10000),
});

// Response type
interface ChatResponse {
  sessionId: string;
  response: string;
  turnNumber: number;
  latencyMs: number;
  crisisDetected?: boolean;
}

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, message, sessionId: requestSessionId } = parsed.data;
    const sessionId = requestSessionId ?? randomUUID();
    const turnNumber = await getTurnNumber(sessionId);
    const traceId = createTraceId(TRACE_SCOPE.TURN);

    // Create request-scoped pipeline context
    const ctx = createPipelineContext({
      traceId,
      sessionId,
      userId,
      turnNumber,
    });

    // Build initial state
    const initialInput: Partial<MolleiState> = {
      sessionId,
      userId,
      userMessage: message,
      turnNumber,
      traceId,
      latencyMs: {},
      agentErrors: [],
    };

    // Execute pipeline (framework-agnostic orchestration)
    const pipeline = getMolleiPipeline();
    const pipelineResult = await runSequentialPipeline(pipeline, initialInput, ctx);
    const result = pipelineResult.output as MolleiState;

    const totalLatency = Math.round(performance.now() - start);

    // End trace
    traceTurnEnd(traceId, {
      totalLatencyMs: totalLatency,
      crisisDetected: result.crisisDetected,
      modelUsed: result.modelUsed,
    });

    const response: ChatResponse = {
      sessionId,
      response: result.response,
      turnNumber,
      latencyMs: totalLatency,
      crisisDetected: result.crisisDetected,
    };

    return Response.json(response);
  } catch (error) {
    console.error("[api:chat] Error:", error);

    // Graceful fallback
    return Response.json({
      sessionId: randomUUID(),
      response: "I'm here with you. Something went wrong on my end, but please know I'm listening.",
      turnNumber: 0,
      latencyMs: Math.round(performance.now() - start),
    } satisfies ChatResponse);
  }
}
```

---

### Streaming Chat Endpoint (SSE)

> **Full SSE Documentation**: See [SSE_STREAMING.md](SSE_STREAMING.md) for complete implementation details, client integration, and resilience patterns.

Uses [`@agenisea/sse-kit`](https://github.com/agenisea/sse-kit) for SSE streaming with heartbeat, abort signals, and observability hooks.

```typescript
// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createStreamingResponse, createSSEResponse } from "@agenisea/sse-kit/server";
import type { StreamObserver } from "@agenisea/sse-kit/server";
import { runSequentialPipeline, getMolleiPipeline } from "@/lib/pipeline/orchestrator";
import { createPipelineContext } from "@/lib/pipeline/context";
import { createTraceId } from "@/lib/infrastructure/trace";
import { traceStreamEvent } from "@/lib/infrastructure/trace-stream";
import { createSSEProgressAdapter } from "@/lib/streaming/sse-progress-adapter";
import { getTurnNumber } from "@/lib/db/repositories/session";
import { TRACE_SCOPE } from "@/lib/utils/constants";
import type { MolleiSSEUpdate } from "@/lib/streaming/sse-events";

const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().min(1),
  message: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { userId, message, sessionId: requestSessionId } = parsed.data;
  const sessionId = requestSessionId ?? randomUUID();
  const turnNumber = await getTurnNumber(sessionId);
  const traceId = createTraceId(TRACE_SCOPE.STREAM);

  // Observability hooks for OpenTelemetry integration
  const observer: StreamObserver = {
    onStreamStart: () => {
      traceStreamEvent(traceId, "stream_start", { sessionId, turnNumber });
    },
    onStreamEnd: (durationMs, success, error) => {
      traceStreamEvent(traceId, "stream_end", { durationMs, success, error: error?.message });
    },
    onUpdateSent: (phase, bytesSent) => {
      traceStreamEvent(traceId, "update_sent", { phase, bytesSent });
    },
    onAbort: (reason) => {
      traceStreamEvent(traceId, "stream_abort", { reason });
    },
  };

  // Create streaming response with @agenisea/sse-kit
  const { stream, orchestrator } = createStreamingResponse<MolleiSSEUpdate>({
    signal: request.signal, // Auto-abort on client disconnect
    heartbeat: { intervalMs: 5000 },
    observer,
  });

  // Start heartbeat to keep connection alive
  orchestrator.startHeartbeat();

  // Create adapter that bridges SSE orchestrator to abstract interface (DIP)
  const progressReporter = createSSEProgressAdapter(orchestrator);

  // Execute pipeline in background (non-blocking)
  ;(async () => {
    try {
      // Create pipeline context with abstract progress reporter (not concrete orchestrator)
      const ctx = createPipelineContext({
        traceId,
        sessionId,
        userId,
        turnNumber,
        progressReporter,  // ✅ Interface injection, not concrete type
      });

      const initialInput = {
        sessionId,
        userId,
        userMessage: message,
        turnNumber,
        traceId,
        latencyMs: {},
        agentErrors: [],
      };

      // Execute pipeline with progress streaming (framework-agnostic)
      const pipeline = getMolleiPipeline();
      const result = await runSequentialPipeline(pipeline, initialInput, ctx);

      // Send final result
      if (!orchestrator.aborted) {
        await orchestrator.sendResult({
          sessionId,
          response: result.output.response,
          turnNumber,
          crisisDetected: result.output.crisisDetected,
        });
      }
    } catch (error) {
      if (orchestrator.aborted) return; // Client disconnected
      await orchestrator.sendError(error instanceof Error ? error.message : "Internal error");
    } finally {
      await orchestrator.close();
    }
  })();

  return createSSEResponse(stream);
}
```

---

### Session API

```typescript
// app/api/session/[sessionId]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, getSessionTurns } from "@/lib/db/repositories/session";

const ParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const parsed = ParamsSchema.safeParse({ sessionId });

  if (!parsed.success) {
    return Response.json({ error: "Invalid session ID" }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const turns = await getSessionTurns(sessionId);

  return Response.json({
    session,
    turns,
    turnCount: turns.length,
  });
}
```

---

## 5.5 SOLID Design Principles

This architecture adheres to SOLID principles throughout. This section documents how each principle is implemented.

### 5.5.1 Single Responsibility Principle (SRP)

> *A class should have only one reason to change.*

| Component | Single Responsibility | Changes When |
|-----------|----------------------|--------------|
| `MoodSensor` | Detect user emotional state | Emotion detection logic changes |
| `MemoryAgent` | Retrieve conversation context | Context retrieval strategy changes |
| `SafetyMonitor` | Detect crisis signals | Crisis detection rules change |
| `EmotionReasoner` | Compute Mollei's emotional response | Response emotion logic changes |
| `ResponseGenerator` | Generate text response | Response generation changes |
| `BaseAgent` | Agent lifecycle + resilience | Resilience patterns change |
| `CircuitBreaker` | Circuit state management | Circuit breaker logic changes |
| `PipelineOrchestrator` | Execution flow coordination | Pipeline structure changes |

**Key Pattern**: Each agent file contains exactly one agent class with one job.

### 5.5.2 Open/Closed Principle (OCP)

> *Software entities should be open for extension but closed for modification.*

**Implementation**:

```typescript
// PipelineModule interface enables extension without modification
export interface PipelineModule<TInput = unknown, TOutput = unknown> {
  execute(input: TInput, context: PipelineContext): Promise<TOutput>
}

// Add new agents by implementing interface, not modifying orchestrator
class NewCustomAgent implements PipelineModule<MolleiState, Partial<MolleiState>> {
  async execute(state: MolleiState, ctx: PipelineContext) {
    // New functionality without changing existing code
  }
}
```

**Extension Points**:
- `PipelineModule` — Add new pipeline stages
- `BaseAgent` — Extend for new agents with built-in resilience
- `EmotionBackend` — Swap emotion detection implementations
- `ICircuitBreaker` — Provide alternative circuit breaker strategies

### 5.5.3 Liskov Substitution Principle (LSP)

> *Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.*

**Implementation**:

All agents extend `BaseAgent` with consistent contracts:

```typescript
// All agents satisfy the same behavioral contract
abstract class BaseAgent {
  abstract execute(state: MolleiState): Promise<Partial<MolleiState>>;
  async invoke(state: MolleiState): Promise<Partial<MolleiState>> { /* ... */ }
}

// Substitutable agents
class MoodSensor extends BaseAgent { /* ... */ }
class SafetyMonitor extends BaseAgent { /* ... */ }
class EmotionReasoner extends BaseAgent { /* ... */ }
```

The orchestrator treats all agents uniformly through the `PipelineModule` interface:

```typescript
// Orchestrator doesn't care which agent it's running
const results = await runParallelModules([
  new MoodSensorModule(),
  new MemoryAgentModule(),
  new SafetyMonitorModule(),
], state, ctx);
```

### 5.5.4 Interface Segregation Principle (ISP)

> *Clients should not be forced to depend on interfaces they don't use.*

**Implementation**:

Small, focused interfaces:

| Interface | Methods | Purpose |
|-----------|---------|---------|
| `PipelineModule` | `execute()` | Pipeline stage contract |
| `ICircuitBreaker` | `allowRequest()`, `recordSuccess()`, `recordFailure()`, `getState()` | Circuit breaker contract |
| `AgentConfig` | 4 fields | Agent configuration |
| `PipelineContext` | 5 fields | Request-scoped context |
| `StreamObserver` | `onStreamStart()`, `onStreamEnd()`, `onUpdateSent()`, `onAbort()` | SSE observability |

**Anti-pattern avoided**: No "god interfaces" with 20+ methods that force implementers to stub unused methods.

### 5.5.5 Dependency Inversion Principle (DIP)

> *High-level modules should not depend on low-level modules. Both should depend on abstractions.*

**Implementation**:

```typescript
// HIGH-LEVEL: BaseAgent depends on abstraction
export abstract class BaseAgent {
  protected circuitBreaker: ICircuitBreaker;  // ← Interface, not concrete class

  constructor(config: AgentConfig, fallbackFn: FallbackFn, options?: AgentOptions) {
    this.circuitBreaker = options?.circuitBreaker ?? defaultCircuitBreakerFactory(config.agentId);
  }
}

// LOW-LEVEL: Concrete implementations
class CircuitBreaker implements ICircuitBreaker { /* ... */ }
class InMemoryCircuitBreaker implements ICircuitBreaker { /* ... */ }
```

**DIP in SSE Streaming**:

```typescript
// Pipeline context depends on abstraction
interface PipelineContext {
  progressReporter?: ProgressReporter;  // ← Interface, not SSEOrchestrator
}

// Adapter bridges concrete to abstract
const progressReporter = createSSEProgressAdapter(orchestrator);
```

### 5.5.6 SOLID Compliance Summary

| Principle | Status | Key Evidence |
|-----------|--------|--------------|
| **S** — Single Responsibility | ✅ | One agent = one job; `BaseAgent` handles only lifecycle |
| **O** — Open/Closed | ✅ | `PipelineModule` interface enables extension without modification |
| **L** — Liskov Substitution | ✅ | All agents extend `BaseAgent` with consistent contracts |
| **I** — Interface Segregation | ✅ | Small, focused interfaces (`PipelineModule`, `ICircuitBreaker`) |
| **D** — Dependency Inversion | ✅ | High-level modules depend on `ICircuitBreaker`, `ProgressReporter` abstractions |

### 5.5.7 Testing Benefits of SOLID

SOLID compliance enables:

1. **Unit Testing**: Inject test doubles via interfaces
   ```typescript
   const agent = new MoodSensor({ circuitBreaker: new AlwaysOpenCircuitBreaker() });
   ```

2. **Isolation**: Test agents independently without full pipeline
   ```typescript
   const result = await moodSensor.invoke(mockState);
   ```

3. **Mocking**: Replace external dependencies with test implementations
   ```typescript
   const mockEmotionBackend: EmotionBackend = { analyze: vi.fn() };
   ```

4. **Extension**: Add new agents without modifying existing tests
   ```typescript
   // New agent just implements PipelineModule — existing tests unchanged
   class CustomAgent implements PipelineModule { /* ... */ }
   ```

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
