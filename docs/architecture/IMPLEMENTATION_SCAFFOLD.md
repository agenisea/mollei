# Implementation Scaffold

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-28-25 10:38PM PST

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
│   │   ├── trace-id.ts                  # Branded TraceId type [v4.0]
│   │   ├── trace-coherency.ts           # Emotion/personality drift tracing [v4.0]
│   │   ├── trace-sanitizer.ts           # PII/secret redaction
│   │   ├── otel-handler.ts              # OpenTelemetry handler (PRIMARY) [v5.0]
│   │   ├── otel-bootstrap.ts            # OpenTelemetry SDK initialization [v5.0]
│   │   ├── langsmith-handler.ts         # LangSmith backend (optional)
│   │   ├── cost-aggregator.ts           # Per-turn cost tracking
│   │   ├── console-handler.ts           # Development console logging
│   │   ├── tracing-bootstrap.ts         # Server startup initialization
│   │   ├── token-budget.ts              # TokenBudgetTracker [v4.0]
│   │   ├── llm-limiter.ts               # Per-request LLM concurrency [v4.0]
│   │   ├── cache.ts                     # CacheStatus types [v4.0]
│   │   └── cache-race.ts                # Race condition handler [v4.0]
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

## 5.2 Key Module Implementations

### `lib/agents/base.ts`

```typescript
// lib/agents/base.ts
import { MolleiState } from "../pipeline/state";
import { CircuitBreaker } from "../resilience/circuit-breaker";
import { traceAgentStage, traceLlmCall } from "../infrastructure/trace";
import { logFallback } from "../server/monitoring";

export interface AgentConfig {
  agentId: string;
  model: string;
  tokenBudget: number;
  timeoutMs: number;
}

export type FallbackFn = (state: MolleiState) => Partial<MolleiState>;

export abstract class BaseAgent {
  protected circuitBreaker: CircuitBreaker;

  constructor(
    protected config: AgentConfig,
    protected fallbackFn: FallbackFn
  ) {
    this.circuitBreaker = new CircuitBreaker(config.agentId);
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

const EmotionSchema = z.object({
  primary: z.string(),
  secondary: z.string().nullable(),
  intensity: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  signals: z.array(z.string()),
});

const config: AgentConfig = {
  agentId: "mood_sensor",
  model: "claude-haiku-4-5",
  tokenBudget: 300,
  timeoutMs: 300,
};

const fallback = (state: MolleiState) => ({
  userEmotion: {
    primary: "neutral",
    secondary: null,
    intensity: 0.5,
    valence: 0,
    signals: [],
  },
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

const SafetySchema = z.object({
  crisisDetected: z.boolean(),
  severity: z.number().min(1).max(5),
  signalType: z.enum(["suicidal", "self_harm", "abuse", "safety", "distress", "none"]),
  confidence: z.number().min(0).max(1),
  keyPhrases: z.array(z.string()),
});

const config: AgentConfig = {
  agentId: "safety_monitor",
  model: "claude-haiku-4-5",
  tokenBudget: 300,
  timeoutMs: 500,
};

const fallback = (state: MolleiState) => ({
  crisisDetected: false,
  crisisSeverity: 1,
  crisisSignalType: "none",
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

## 5.3 API Integration (Next.js App Router)

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
    const traceId = createTraceId("TURN");

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

```typescript
// app/api/chat/stream/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { runSequentialPipeline, getMolleiPipeline } from "@/lib/pipeline/orchestrator";
import { createTraceId, createPipelineContext } from "@/lib/infrastructure/trace";
import { getTurnNumber } from "@/lib/db/repositories/session";

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
  const traceId = createTraceId("TURN");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create pipeline context with progress callback for streaming
        const ctx = createPipelineContext({
          traceId,
          sessionId,
          userId,
          turnNumber,
          // Stream progress events to client
          onProgress: (phase, data) => {
            const event = {
              type: "agent_complete",
              agent: phase,
              data: phase === "response_generator" ? data : undefined,
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          },
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
        await runSequentialPipeline(pipeline, initialInput, ctx);

        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Internal error" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
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

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
