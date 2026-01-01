# Observability & Tracing Infrastructure

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-28-25 2:00PM PST

> **Constants Reference**: All magic values in this document should map to constants defined in
> `lib/utils/constants.ts`. See [IMPLEMENTATION_SCAFFOLD.md §5.2](IMPLEMENTATION_SCAFFOLD.md#52-configuration--constants)
> for the authoritative constant definitions. When in doubt follow the existing patterns.

---

> **Design Pattern**: Vendor-neutral tracing with pluggable backends.

## 6.1 Trace Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRACE INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐ │
│  │ Agent/Node   │────▶│   emitTrace()    │────▶│   TraceHandlers[]    │ │
│  │   Execution  │     │  (broadcast)     │     │                      │ │
│  └──────────────┘     └──────────────────┘     │  ┌────────────────┐  │ │
│                                                │  │ LangSmith      │  │ │
│  TraceId: mollei_turn_<uuid>                   │  │ Backend        │  │ │
│                                                │  └────────────────┘  │ │
│  Scopes: TURN, AGENT, LLM, SAFETY, MEMORY      │  ┌────────────────┐  │ │
│                                                │  │ Console        │  │ │
│  Events: run_start, stage, llm_call,           │  │ Handler        │  │ │
│          crisis, run_end, error, metric        │  └────────────────┘  │ │
│                                                │  ┌────────────────┐  │ │
│                                                │  │ Cost           │  │ │
│                                                │  │ Aggregator     │  │ │
│                                                │  └────────────────┘  │ │
│                                                └──────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     TRACE SANITIZER                               │  │
│  │  - PII redaction (emails, names, personal content)                │  │
│  │  - Secret masking (API keys, tokens, credentials)                 │  │
│  │  - ID hashing (user_id, session_id → SHA-256 prefix)              │  │
│  │  - Content redaction (user_message → length only in strict mode)  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Trace Event Types

```typescript
// src/mollei/infrastructure/trace-types.ts

type TraceScope =
  | 'TURN'      // Full conversation turn
  | 'AGENT'     // Individual agent execution
  | 'LLM'       // LLM API call
  | 'SAFETY'    // Crisis detection events
  | 'MEMORY'    // Memory retrieval/storage
  | 'EMOTION';  // Emotion detection/reasoning

type TraceEventType =
  // Pipeline lifecycle
  | 'run_start'       // Turn begins
  | 'run_end'         // Turn completes
  | 'stage'           // Agent stage (mood_sensor, etc.)
  | 'retry'           // Fallback triggered
  | 'error'           // Unhandled error
  | 'metric'          // Performance metric
  // LLM-specific
  | 'llm_call'        // Model invocation with tokens/cost
  // Domain-specific
  | 'crisis_detected' // Safety monitor alert
  | 'emotion_shift'   // User emotion changed
  | 'memory_callback' // Context callback used;

interface TraceEvent {
  traceId: string;           // mollei_turn_<uuid>
  scope: TraceScope;
  eventType: TraceEventType;
  agentId?: string;
  timestamp: number;
  durationMs?: number;
  metadata: Record<string, unknown>;
}
```

## 6.3 Trace Handler Interface (Vendor-Neutral)

```typescript
// lib/infrastructure/trace.ts
import { randomUUID } from "crypto";
import {
  AGENT_IDS,
  TRACE_SCOPE,
  TRACE_EVENT_TYPE,
  type TraceScope,
  type TraceEventType,
} from "../utils/constants";

// ─────────────────────────────────────────────────────────────
// Types (re-exported from constants for convenience)
// ─────────────────────────────────────────────────────────────

export { TRACE_SCOPE, TRACE_EVENT_TYPE, type TraceScope, type TraceEventType };

export interface TraceEvent {
  traceId: string;
  scope: TraceScope;
  eventType: TraceEventType;
  agentId: string | null;
  timestamp: number;
  durationMs: number | null;
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Handler Interface
// ─────────────────────────────────────────────────────────────

export interface TraceHandler {
  handle(event: TraceEvent): void;
}

// Global handler registry
const traceHandlers: TraceHandler[] = [];

export function registerTraceHandler(handler: TraceHandler): void {
  traceHandlers.push(handler);
}

export function emitTrace(event: TraceEvent): void {
  for (const handler of traceHandlers) {
    try {
      handler.handle(event);
    } catch (error) {
      // Never let tracing break the main flow
      console.error(`[trace:error] Handler failed:`, error);
    }
  }
}

export function createTraceId(scope: TraceScope = TRACE_SCOPE.TURN): string {
  return `mollei_${scope.toLowerCase()}_${randomUUID().slice(0, 12)}`;
}

// ─────────────────────────────────────────────────────────────
// Convenience Emitters
// ─────────────────────────────────────────────────────────────

export function traceTurnStart(
  traceId: string,
  sessionId: string,
  turnNumber: number
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.TURN,
    eventType: TRACE_EVENT_TYPE.RUN_START,
    agentId: null,
    timestamp: Date.now(),
    durationMs: null,
    metadata: { sessionId, turnNumber },
  });
}

export function traceTurnEnd(
  traceId: string,
  metadata: Record<string, unknown>
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.TURN,
    eventType: TRACE_EVENT_TYPE.RUN_END,
    agentId: null,
    timestamp: Date.now(),
    durationMs: null,
    metadata,
  });
}

export function traceAgentStage(
  traceId: string,
  agentId: string,
  status: string,
  durationMs: number,
  metadata: Record<string, unknown> = {}
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.AGENT,
    eventType: TRACE_EVENT_TYPE.STAGE,
    agentId,
    timestamp: Date.now(),
    durationMs,
    metadata: { status, ...metadata },
  });
}

export function traceLlmCall(
  traceId: string,
  agentId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  durationMs: number,
  costUsd: number
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.LLM,
    eventType: TRACE_EVENT_TYPE.LLM_CALL,
    agentId,
    timestamp: Date.now(),
    durationMs,
    metadata: {
      model,
      inputTokens,
      outputTokens,
      costUsd,
    },
  });
}

export function traceCrisisDetected(
  traceId: string,
  severity: number,
  signalType: string,
  confidence: number
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.SAFETY,
    eventType: TRACE_EVENT_TYPE.CRISIS_DETECTED,
    agentId: AGENT_IDS.SAFETY_MONITOR,
    timestamp: Date.now(),
    durationMs: null,
    metadata: {
      severity,
      signalType,
      confidence,
    },
  });
}

export function traceError(
  traceId: string,
  agentId: string,
  error: Error | string
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.AGENT,
    eventType: TRACE_EVENT_TYPE.ERROR,
    agentId,
    timestamp: Date.now(),
    durationMs: null,
    metadata: {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    },
  });
}
```

## 6.4 Trace Sanitizer (PII/Secret Protection)

```typescript
// lib/infrastructure/trace-sanitizer.ts
import { createHash } from "crypto";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type SanitizationMode = "strict" | "permissive";

// ─────────────────────────────────────────────────────────────
// Key Classifications
// ─────────────────────────────────────────────────────────────

// Keys to completely omit from traces
const OMIT_KEYS = new Set([
  "email", "password", "token", "jwt", "api_key", "credentials",
  "secret", "authorization", "cookie", "auth_token",
]);

// Keys to hash (preserve structure, hide values)
const HASH_KEYS = new Set([
  "user_id", "session_id", "org_id", "trace_id", "userid", "sessionid",
]);

// Keys to redact content (show length only in strict mode)
const REDACT_CONTENT_KEYS = new Set([
  "user_message", "response", "prompt", "context_summary",
  "callback_opportunities", "key_phrases", "signals", "usermessage",
]);

// Safe keys that pass through unchanged
const SAFE_KEYS = new Set([
  "stage", "status", "model", "agent_id", "event_type", "scope",
  "duration_ms", "timestamp", "input_tokens", "output_tokens",
  "cost_usd", "severity", "confidence", "primary", "secondary",
  "intensity", "valence", "energy", "approach", "turn_number",
  "crisis_detected", "relationship_stage", "agentid", "eventtype",
  "durationms", "inputtokens", "outputtokens", "costusd", "turnnumber",
  "crisisdetected", "relationshipstage",
]);

// Patterns for sensitive data
const SENSITIVE_PATTERNS: Array<[RegExp, string]> = [
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"],
  [/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[JWT]"],
  [/sk-[a-zA-Z0-9]{32,}/g, "[API_KEY]"],
  [/https?:\/\/[^\s]+/g, "[URL]"],
];

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function hashId(value: string): string {
  if (!value) return value;
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 8);
  return `hash_${hash}`;
}

function redactString(value: string, mode: SanitizationMode): string {
  if (mode === "strict") {
    return `[REDACTED:${value.length}chars]`;
  }
  // Permissive: just redact sensitive patterns
  let result = value;
  for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function sanitizeValue(
  key: string,
  value: unknown,
  mode: SanitizationMode,
  depth: number = 0,
  maxDepth: number = 10
): unknown {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return "[MAX_DEPTH]";
  }

  const keyLower = key.toLowerCase();

  // Omit completely
  if (OMIT_KEYS.has(keyLower)) {
    return "[OMITTED]";
  }

  // Hash IDs
  if (HASH_KEYS.has(keyLower) && typeof value === "string") {
    return hashId(value);
  }

  // Redact content
  if (REDACT_CONTENT_KEYS.has(keyLower)) {
    if (typeof value === "string") {
      return redactString(value, mode);
    }
    if (Array.isArray(value)) {
      return value.map((v) =>
        typeof v === "string" ? redactString(v, mode) : v
      );
    }
  }

  // Safe keys pass through
  if (SAFE_KEYS.has(keyLower)) {
    return value;
  }

  // Recurse into objects
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        sanitizeValue(k, v, mode, depth + 1, maxDepth),
      ])
    );
  }

  // Recurse into arrays
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(key, v, mode, depth + 1, maxDepth));
  }

  // Default: check string for sensitive patterns
  if (typeof value === "string") {
    let result = value;
    for (const [pattern, replacement] of SENSITIVE_PATTERNS) {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
      }
    }
    return result;
  }

  return value;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export function sanitizeTraceMetadata(
  metadata: Record<string, unknown>,
  mode: SanitizationMode = "strict"
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      sanitizeValue(key, value, mode),
    ])
  );
}

export function getSanitizationMode(): SanitizationMode {
  const mode = process.env.TRACE_SANITIZATION_MODE;
  return mode === "permissive" ? "permissive" : "strict";
}
```

## 6.5 LangSmith Backend Handler

```typescript
// lib/infrastructure/langsmith-handler.ts
import { Client, RunTree } from "langsmith";
import { TraceHandler, TraceEvent } from "./trace";
import { sanitizeTraceMetadata, getSanitizationMode, SanitizationMode } from "./trace-sanitizer";

export class LangSmithHandler implements TraceHandler {
  private enabled: boolean;
  private client: Client | null;
  private project: string;
  private sampleRate: number;
  private sanitizationMode: SanitizationMode;
  private activeRuns: Map<string, RunTree> = new Map();

  constructor() {
    this.enabled = process.env.TRACE_ENABLED !== "false";
    this.project = process.env.TRACE_PROJECT ?? "mollei";

    // Sampling: 50% production, 100% dev
    const env = process.env.ENVIRONMENT ?? "development";
    const defaultRate = env === "production" ? 0.5 : 1.0;
    this.sampleRate = parseFloat(process.env.TRACE_SAMPLE_RATE ?? String(defaultRate));

    this.sanitizationMode = getSanitizationMode();

    // Initialize client if enabled and API key present
    if (this.enabled && process.env.TRACE_API_KEY) {
      this.client = new Client({
        apiKey: process.env.TRACE_API_KEY,
        apiUrl: process.env.TRACE_ENDPOINT ?? "https://api.smith.langchain.com",
      });
    } else {
      this.client = null;
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  handle(event: TraceEvent): void {
    if (!this.enabled || !this.client) return;

    // Sanitize metadata before sending
    const safeMetadata = sanitizeTraceMetadata(event.metadata, this.sanitizationMode);

    switch (event.eventType) {
      case "run_start": {
        if (!this.shouldSample()) return;

        // Create root run
        const run = new RunTree({
          name: "mollei_turn",
          runType: "chain",
          projectName: this.project,
          inputs: safeMetadata,
          extra: { traceId: event.traceId },
        });
        run.postRun();
        this.activeRuns.set(event.traceId, run);
        break;
      }

      case "stage": {
        const parent = this.activeRuns.get(event.traceId);
        if (!parent) return;

        // Create child run for agent
        const child = parent.createChild({
          name: event.agentId ?? "unknown_agent",
          runType: "tool",
          inputs: safeMetadata,
        });
        child.end({ outputs: { status: safeMetadata.status ?? "complete" } });
        child.postRun();
        break;
      }

      case "llm_call": {
        const parent = this.activeRuns.get(event.traceId);
        if (!parent) return;

        // Create LLM child run with cost metadata
        const child = parent.createChild({
          name: `${event.agentId}_llm`,
          runType: "llm",
          inputs: { agent: event.agentId },
          extra: {
            model: safeMetadata.model,
            tokens: {
              input: safeMetadata.inputTokens,
              output: safeMetadata.outputTokens,
            },
            costUsd: safeMetadata.costUsd,
          },
        });
        child.end({ outputs: { durationMs: event.durationMs } });
        child.postRun();
        break;
      }

      case "crisis_detected": {
        const parent = this.activeRuns.get(event.traceId);
        if (!parent) return;

        // Log crisis as special child run
        const child = parent.createChild({
          name: "crisis_detection",
          runType: "tool",
          inputs: safeMetadata,
          extra: { severity: safeMetadata.severity },
        });
        child.end();
        child.postRun();
        break;
      }

      case "run_end": {
        const run = this.activeRuns.get(event.traceId);
        if (run) {
          run.end({ outputs: safeMetadata });
          run.patchRun();
          this.activeRuns.delete(event.traceId);
        }
        break;
      }

      case "error": {
        const run = this.activeRuns.get(event.traceId);
        if (run) {
          run.end({ error: String(safeMetadata.error ?? "Unknown error") });
          run.patchRun();
        }
        break;
      }
    }
  }
}
```

## 6.5a OpenTelemetry Handler (Primary/Vendor-Neutral)

> **Pattern**: OpenTelemetry as primary tracing format; enables export to any OTEL-compatible backend (Jaeger, Zipkin, Honeycomb, Datadog, etc.).

```typescript
// lib/infrastructure/otel-handler.ts
import { TraceHandler, TraceEvent } from "./trace";
import { sanitizeTraceMetadata, getSanitizationMode, SanitizationMode } from "./trace-sanitizer";

// Conditional import - OTEL is optional dependency
let trace: typeof import("@opentelemetry/api").trace | undefined;
let SpanStatusCode: typeof import("@opentelemetry/api").SpanStatusCode | undefined;

try {
  const otelApi = require("@opentelemetry/api");
  trace = otelApi.trace;
  SpanStatusCode = otelApi.SpanStatusCode;
} catch {
  // OTEL not installed - handler will be no-op
}

/**
 * OpenTelemetry Handler - Vendor-Neutral Tracing
 *
 * Maps Mollei trace events to OTEL spans:
 * - run_start → root span (kind: SERVER)
 * - stage → child span (kind: INTERNAL)
 * - llm_call → child span (kind: CLIENT) with LLM-specific attributes
 * - crisis_detected → span event
 * - run_end → end root span
 * - error → end span with ERROR status
 */
export class OpenTelemetryHandler implements TraceHandler {
  private enabled: boolean;
  private tracer: ReturnType<typeof trace.getTracer> | null = null;
  private sanitizationMode: SanitizationMode;
  private activeSpans: Map<string, any> = new Map(); // Span type from OTEL

  constructor() {
    this.enabled = !!trace && process.env.OTEL_ENABLED !== "false";
    this.sanitizationMode = getSanitizationMode();

    if (this.enabled && trace) {
      this.tracer = trace.getTracer("mollei", "1.0.0");
    }
  }

  handle(event: TraceEvent): void {
    if (!this.enabled || !this.tracer) return;

    const safeMetadata = sanitizeTraceMetadata(event.metadata, this.sanitizationMode);

    switch (event.eventType) {
      case "run_start": {
        const span = this.tracer.startSpan("mollei.turn", {
          kind: 1, // SpanKind.SERVER
          attributes: {
            "mollei.trace_id": event.traceId,
            "mollei.scope": event.scope,
            "mollei.session_id": String(safeMetadata.sessionId ?? ""),
            "mollei.turn_number": Number(safeMetadata.turnNumber ?? 0),
          },
        });
        this.activeSpans.set(event.traceId, span);
        break;
      }

      case "stage": {
        const parentSpan = this.activeSpans.get(event.traceId);
        if (!parentSpan || !this.tracer) return;

        const ctx = trace!.setSpan(trace!.context.active(), parentSpan);
        const childSpan = this.tracer.startSpan(
          `mollei.agent.${event.agentId ?? "unknown"}`,
          {
            kind: 0, // SpanKind.INTERNAL
            attributes: {
              "mollei.agent_id": event.agentId ?? "unknown",
              "mollei.status": String(safeMetadata.status ?? "complete"),
              "mollei.duration_ms": event.durationMs ?? 0,
            },
          },
          ctx
        );
        childSpan.end();
        break;
      }

      case "llm_call": {
        const parentSpan = this.activeSpans.get(event.traceId);
        if (!parentSpan || !this.tracer) return;

        const ctx = trace!.setSpan(trace!.context.active(), parentSpan);
        const llmSpan = this.tracer.startSpan(
          `mollei.llm.${event.agentId ?? "call"}`,
          {
            kind: 2, // SpanKind.CLIENT
            attributes: {
              // OpenTelemetry Semantic Conventions for LLM
              "gen_ai.system": "anthropic",
              "gen_ai.request.model": String(safeMetadata.model ?? "unknown"),
              "gen_ai.usage.input_tokens": Number(safeMetadata.inputTokens ?? 0),
              "gen_ai.usage.output_tokens": Number(safeMetadata.outputTokens ?? 0),
              "mollei.cost_usd": Number(safeMetadata.costUsd ?? 0),
              "mollei.agent_id": event.agentId ?? "unknown",
            },
          },
          ctx
        );
        llmSpan.end();
        break;
      }

      case "crisis_detected": {
        const span = this.activeSpans.get(event.traceId);
        if (!span) return;

        // Add event to span rather than creating child span
        span.addEvent("crisis_detected", {
          "mollei.severity": Number(safeMetadata.severity ?? 0),
          "mollei.signal_type": String(safeMetadata.signalType ?? "unknown"),
          "mollei.confidence": Number(safeMetadata.confidence ?? 0),
        });
        break;
      }

      case "run_end": {
        const span = this.activeSpans.get(event.traceId);
        if (span) {
          span.setAttribute("mollei.total_duration_ms", event.durationMs ?? 0);
          span.setAttribute("mollei.crisis_detected", Boolean(safeMetadata.crisisDetected));
          span.setStatus({ code: SpanStatusCode!.OK });
          span.end();
          this.activeSpans.delete(event.traceId);
        }
        break;
      }

      case "error": {
        const span = this.activeSpans.get(event.traceId);
        if (span) {
          span.recordException(new Error(String(safeMetadata.error ?? "Unknown error")));
          span.setStatus({
            code: SpanStatusCode!.ERROR,
            message: String(safeMetadata.error ?? "Unknown error"),
          });
          span.end();
          this.activeSpans.delete(event.traceId);
        }
        break;
      }
    }
  }
}
```

### OpenTelemetry Bootstrap Configuration

```typescript
// lib/infrastructure/otel-bootstrap.ts
// Call this BEFORE any other imports in instrumentation.ts (Next.js)

export function initializeOpenTelemetry(): void {
  if (process.env.OTEL_ENABLED !== "true") return;

  try {
    const { NodeSDK } = require("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
    const { Resource } = require("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require("@opentelemetry/semantic-conventions");

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318/v1/traces",
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
        ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
        : {},
    });

    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: "mollei",
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? "1.0.0",
      }),
      traceExporter: exporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable noisy instrumentations
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.log("[otel] OpenTelemetry initialized");

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk.shutdown().catch(console.error);
    });
  } catch (error) {
    console.warn("[otel] Failed to initialize OpenTelemetry:", error);
  }
}
```

### Environment Variables for OTEL

```bash
# .env.local.example (OTEL configuration)

# OpenTelemetry (Primary tracing)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
# For cloud providers (e.g., Honeycomb):
# OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io/v1/traces
# OTEL_EXPORTER_OTLP_HEADERS={"x-honeycomb-team":"your-api-key"}

# LangSmith (Optional, for LLM-specific analysis)
TRACE_ENABLED=true
TRACE_API_KEY=your-langsmith-api-key
TRACE_PROJECT=mollei
```

## 6.6 Cost Aggregator

```typescript
// lib/infrastructure/cost-aggregator.ts
import { TraceHandler, TraceEvent } from "./trace";
import { MODELS, MODEL_PRICING } from "../ai/models";

// ─────────────────────────────────────────────────────────────
// Claude Pricing (per million tokens, as of Dec 2025)
// Uses MODEL_PRICING from lib/ai/models.ts for consistency
// ─────────────────────────────────────────────────────────────

// MODEL_PRICING is imported from ../ai/models.ts:
// {
//   [MODELS.OPUS]: { input: 5.0, output: 25.0 },
//   [MODELS.SONNET]: { input: 3.0, output: 15.0 },
//   [MODELS.HAIKU]: { input: 1.0, output: 5.0 },
// }

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AgentCost {
  agentId: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  totalDurationMs: number;
}

interface TurnCostSummary {
  traceId: string;
  agents: Map<string, AgentCost>;
  totalCostUsd: number;
  totalTokens: number;
  totalDurationMs: number;
}

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────

export class CostAggregatorHandler implements TraceHandler {
  private activeTurns: Map<string, TurnCostSummary> = new Map();

  handle(event: TraceEvent): void {
    switch (event.eventType) {
      case "run_start": {
        this.activeTurns.set(event.traceId, {
          traceId: event.traceId,
          agents: new Map(),
          totalCostUsd: 0,
          totalTokens: 0,
          totalDurationMs: 0,
        });
        break;
      }

      case "llm_call": {
        const summary = this.activeTurns.get(event.traceId);
        if (!summary) return;

        const agentId = event.agentId ?? "unknown";
        let agentCost = summary.agents.get(agentId);

        if (!agentCost) {
          agentCost = {
            agentId,
            calls: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCostUsd: 0,
            totalDurationMs: 0,
          };
          summary.agents.set(agentId, agentCost);
        }

        const inputTokens = (event.metadata.inputTokens as number) ?? 0;
        const outputTokens = (event.metadata.outputTokens as number) ?? 0;
        const costUsd = (event.metadata.costUsd as number) ?? 0;
        const durationMs = event.durationMs ?? 0;

        agentCost.calls++;
        agentCost.inputTokens += inputTokens;
        agentCost.outputTokens += outputTokens;
        agentCost.totalCostUsd += costUsd;
        agentCost.totalDurationMs += durationMs;

        summary.totalCostUsd += costUsd;
        summary.totalTokens += inputTokens + outputTokens;
        summary.totalDurationMs += durationMs;
        break;
      }

      case "run_end": {
        const summary = this.activeTurns.get(event.traceId);
        if (summary) {
          this.logCostSummary(summary);
          this.activeTurns.delete(event.traceId);
        }
        break;
      }
    }
  }

  private logCostSummary(summary: TurnCostSummary): void {
    console.log(`\n[cost:summary] Turn ${summary.traceId}`);
    console.log(
      `  Total: $${summary.totalCostUsd.toFixed(6)} | ${summary.totalTokens} tokens | ${summary.totalDurationMs.toFixed(0)}ms`
    );
    console.log("  Breakdown by agent:");

    // Sort agents by cost (descending)
    const sortedAgents = [...summary.agents.values()].sort(
      (a, b) => b.totalCostUsd - a.totalCostUsd
    );

    for (const agent of sortedAgents) {
      const pct = summary.totalCostUsd > 0
        ? ((agent.totalCostUsd / summary.totalCostUsd) * 100).toFixed(1)
        : "0.0";
      console.log(
        `    ${agent.agentId}: $${agent.totalCostUsd.toFixed(6)} (${pct}%) | ${agent.calls} calls | ${agent.totalDurationMs.toFixed(0)}ms`
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Cost Calculation Utility
// ─────────────────────────────────────────────────────────────

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[MODELS.SONNET];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
```

## 6.7 Console Handler (Development)

```typescript
// lib/infrastructure/console-handler.ts
import { TraceHandler, TraceEvent } from "./trace";

export class ConsoleHandler implements TraceHandler {
  constructor(private verbose: boolean = true) {}

  handle(event: TraceEvent): void {
    if (!this.verbose) return;

    const prefix = `[trace:${event.scope.toLowerCase()}]`;

    switch (event.eventType) {
      case "run_start":
        console.log(`${prefix} Turn started: ${event.traceId}`);
        break;

      case "stage": {
        const status = event.metadata.status ?? "unknown";
        const duration = event.durationMs ?? 0;
        console.log(`${prefix} ${event.agentId}: ${status} (${duration.toFixed(0)}ms)`);
        break;
      }

      case "llm_call": {
        const model = event.metadata.model ?? "unknown";
        const inputTokens = (event.metadata.inputTokens as number) ?? 0;
        const outputTokens = (event.metadata.outputTokens as number) ?? 0;
        const tokens = inputTokens + outputTokens;
        const cost = (event.metadata.costUsd as number) ?? 0;
        console.log(
          `${prefix} LLM ${event.agentId}: ${model} | ${tokens} tokens | $${cost.toFixed(6)}`
        );
        break;
      }

      case "crisis_detected": {
        const severity = event.metadata.severity ?? 0;
        const signal = event.metadata.signalType ?? "unknown";
        console.log(`${prefix} ⚠️  CRISIS DETECTED: severity=${severity}, type=${signal}`);
        break;
      }

      case "error": {
        const error = event.metadata.error ?? "Unknown";
        console.log(`${prefix} ❌ ERROR: ${error}`);
        break;
      }

      case "run_end":
        console.log(`${prefix} Turn complete: ${event.traceId}`);
        break;
    }
  }
}
```

## 6.8 Tracing Bootstrap (Server Startup)

> **Pattern**: OpenTelemetry as primary (vendor-neutral), LangSmith as optional (LLM-specific analysis).

```typescript
// lib/infrastructure/tracing-bootstrap.ts
import { registerTraceHandler } from "./trace";
import { OpenTelemetryHandler } from "./otel-handler";
import { LangSmithHandler } from "./langsmith-handler";
import { CostAggregatorHandler } from "./cost-aggregator";
import { ConsoleHandler } from "./console-handler";

let initialized = false;

export function initializeTracing(): void {
  // Prevent double initialization
  if (initialized) return;
  initialized = true;

  // Check kill switch
  if (process.env.TRACE_DISABLED === "true") {
    console.log("[tracing] Tracing disabled via TRACE_DISABLED");
    return;
  }

  // Console handler (dev only)
  if (process.env.ENVIRONMENT !== "production") {
    registerTraceHandler(new ConsoleHandler(true));
    console.log("[tracing] Console handler registered");
  }

  // Cost aggregator (always enabled)
  registerTraceHandler(new CostAggregatorHandler());
  console.log("[tracing] Cost aggregator registered");

  // OpenTelemetry handler (PRIMARY - vendor-neutral)
  if (process.env.OTEL_ENABLED === "true") {
    registerTraceHandler(new OpenTelemetryHandler());
    console.log(
      `[tracing] OpenTelemetry handler registered (endpoint: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "default"})`
    );
  }

  // LangSmith handler (OPTIONAL - for LLM-specific analysis/evaluation)
  if (process.env.TRACE_ENABLED !== "false" && process.env.TRACE_API_KEY) {
    registerTraceHandler(new LangSmithHandler());
    console.log(
      `[tracing] LangSmith handler registered (project: ${process.env.TRACE_PROJECT ?? "mollei"})`
    );
  }

  console.log("[tracing] Initialization complete");
}

// Auto-initialize on module load in server context
if (typeof globalThis !== "undefined" && !("window" in globalThis)) {
  initializeTracing();
}
```

### Next.js Instrumentation Hook

```typescript
// instrumentation.ts (Next.js server instrumentation)
import { initializeOpenTelemetry } from "@/lib/infrastructure/otel-bootstrap";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // OTEL SDK must initialize before any other imports
    initializeOpenTelemetry();

    // Then register trace handlers
    const { initializeTracing } = await import("@/lib/infrastructure/tracing-bootstrap");
    initializeTracing();
  }
}
```

## 6.9 Structured Monitoring (Domain Events)

```typescript
// lib/server/monitoring.ts
/**
 * Structured logging for production monitoring.
 * Always active, independent of debug flags.
 */

function logMonitoring(category: string, data: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      type: `monitoring:${category}`,
      timestamp: Date.now(),
      ...data,
    })
  );
}

export function logTurnAnalysis(params: {
  traceId: string;
  sessionId: string;
  turnNumber: number;
  totalTokens: number;
  totalCostUsd: number;
  latencyMs: number;
  crisisDetected?: boolean;
}): void {
  logMonitoring("analysis", {
    traceId: params.traceId,
    sessionId: params.sessionId.slice(0, 8) + "...", // Truncate for privacy
    turnNumber: params.turnNumber,
    tokens: params.totalTokens,
    costUsd: params.totalCostUsd,
    latencyMs: params.latencyMs,
    crisis: params.crisisDetected ?? false,
  });
}

export function logSlowTurn(
  traceId: string,
  latencyMs: number,
  thresholdMs: number = 5000
): void {
  if (latencyMs > thresholdMs) {
    logMonitoring("slow-turn", {
      traceId,
      latencyMs,
      thresholdMs,
      exceededByMs: latencyMs - thresholdMs,
    });
  }
}

export function logFallback(
  traceId: string,
  agentId: string,
  fallbackTier: number,
  reason: string
): void {
  logMonitoring("fallback", {
    traceId,
    agentId,
    fallbackTier,
    reason,
  });
}

export function logCrisisEvent(params: {
  traceId: string;
  sessionId: string;
  severity: number;
  signalType: string;
  resourcesShown: boolean;
}): void {
  logMonitoring("crisis", {
    traceId: params.traceId,
    sessionId: params.sessionId.slice(0, 8) + "...",
    severity: params.severity,
    signalType: params.signalType,
    resourcesShown: params.resourcesShown,
  });
}

export function logCircuitBreaker(
  agentId: string,
  state: string,
  failureCount: number
): void {
  logMonitoring("circuit-breaker", {
    agentId,
    state,
    failureCount,
  });
}

export function logRateLimit(
  agentId: string,
  model: string,
  retryAfterMs: number
): void {
  logMonitoring("rate-limit", {
    agentId,
    model,
    retryAfterMs,
  });
}

export function logTimeout(
  traceId: string,
  agentId: string,
  timeoutMs: number
): void {
  logMonitoring("timeout", {
    traceId,
    agentId,
    timeoutMs,
  });
}

export function logError(
  traceId: string,
  agentId: string,
  error: unknown
): void {
  logMonitoring("error", {
    traceId,
    agentId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
```

## 6.10 Environment Configuration

```bash
# .env.example - Tracing Configuration

# ─────────────────────────────────────────────────────────────
# TRACING
# ─────────────────────────────────────────────────────────────

# Master enable/disable
TRACE_ENABLED=true
TRACE_DISABLED=false  # Emergency kill switch

# LangSmith backend
TRACE_API_KEY=lsv2_sk_...
TRACE_PROJECT=mollei-production
TRACE_ENDPOINT=https://api.smith.langchain.com

# Sampling (0.0 - 1.0)
# Production: 0.5 (50%), Development: 1.0 (100%)
TRACE_SAMPLE_RATE=0.5

# Sanitization mode
# strict: Maximum PII redaction (production)
# permissive: Minimal redaction (development/debugging)
TRACE_SANITIZATION_MODE=strict

# ─────────────────────────────────────────────────────────────
# ENVIRONMENT
# ─────────────────────────────────────────────────────────────
ENVIRONMENT=production  # development | staging | production
```

## 6.11 Metrics Summary

| Metric | Type | Alert Threshold | Source |
|--------|------|-----------------|--------|
| `mollei.turn.latency_p95` | Histogram | >5s | monitoring:analysis |
| `mollei.turn.latency_p50` | Histogram | >2s | monitoring:analysis |
| `mollei.turn.cost_usd` | Counter | Budget tracking | cost_aggregator |
| `mollei.agent.{name}.latency` | Histogram | Per-agent | trace:stage |
| `mollei.agent.{name}.fallback_rate` | Counter | >5% | monitoring:fallback |
| `mollei.agent.{name}.error_rate` | Counter | >1% | trace:error |
| `mollei.crisis.detected` | Counter | - | trace:crisis_detected |
| `mollei.crisis.severity_4_plus` | Counter | >5/hour | monitoring:crisis |
| `mollei.circuit_breaker.open` | Gauge | Any open | monitoring:circuit-breaker |
| `mollei.model.tokens_used` | Counter | Cost tracking | trace:llm_call |
| `mollei.trace.sample_rate` | Gauge | - | Configuration |

## 6.12 Branded Trace IDs

```typescript
// lib/infrastructure/trace-id.ts

/**
 * Branded TraceId type prevents string confusion
 * Format: `mollei_<scope>_<uuid12>`
 */
export type TraceId = string & { readonly __brand: "TraceId" };

export const TRACE_ID_PREFIX = {
  TURN: "mollei_turn",
  AGENT: "mollei_agent",
  LLM: "mollei_llm",
  CRISIS: "mollei_crisis",
  SESSION: "mollei_session",
} as const;

export type TraceScope = keyof typeof TRACE_ID_PREFIX;

export function createTraceId(scope: TraceScope = "TURN"): TraceId {
  const prefix = TRACE_ID_PREFIX[scope];
  const uuid = crypto.randomUUID().slice(0, 12);
  return `${prefix}_${uuid}` as TraceId;
}

export function parseTraceId(traceId: TraceId): {
  scope: TraceScope;
  uuid: string;
} | null {
  const match = traceId.match(/^mollei_(\w+)_([a-f0-9]{12})$/);
  if (!match) return null;

  const scopeKey = match[1].toUpperCase() as TraceScope;
  if (!(scopeKey in TRACE_ID_PREFIX)) return null;

  return { scope: scopeKey, uuid: match[2] };
}

export function isValidTraceId(value: string): value is TraceId {
  return /^mollei_\w+_[a-f0-9]{12}$/.test(value);
}
```

## 6.13 Coherency Tracing (Emotional Consistency)

```typescript
// lib/infrastructure/trace-coherency.ts
import { TraceId, emitTrace } from "./trace";
import { AGENT_IDS } from "../utils/constants";

export type CoherencyDimension =
  | "emotion"        // Emotional consistency
  | "personality"    // Mollei's personality drift
  | "memory"         // Context coherence
  | "safety";        // Crisis detection consistency

export interface EmotionDriftEvent {
  dimension: "emotion";
  previousEmotion: string;
  currentEmotion: string;
  driftScore: number;       // 0 = consistent, 1 = major shift
  turnsSinceShift: number;
  passed: boolean;
}

export interface PersonalityDriftEvent {
  dimension: "personality";
  trait: string;
  expectedRange: [number, number];
  actualValue: number;
  passed: boolean;
}

export function traceEmotionCoherency(
  traceId: TraceId,
  event: EmotionDriftEvent
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.EMOTION,
    eventType: TRACE_EVENT_TYPE.COHERENCY,
    agentId: AGENT_IDS.EMOTION_REASONER,
    timestamp: Date.now(),
    durationMs: null,
    metadata: {
      coherencyType: "emotion_drift",
      ...event,
    },
  });
}

export function tracePersonalityCoherency(
  traceId: TraceId,
  event: PersonalityDriftEvent
): void {
  emitTrace({
    traceId,
    scope: TRACE_SCOPE.AGENT,
    eventType: TRACE_EVENT_TYPE.COHERENCY,
    agentId: AGENT_IDS.RESPONSE_GENERATOR,
    timestamp: Date.now(),
    durationMs: null,
    metadata: {
      coherencyType: "personality_drift",
      ...event,
    },
  });
}

/**
 * Check emotional consistency between turns
 * High drift may indicate context loss or model instability
 */
export function calculateEmotionDrift(
  previous: { primary: string; intensity: number; valence: number },
  current: { primary: string; intensity: number; valence: number }
): number {
  // Same primary emotion = low drift
  if (previous.primary === current.primary) {
    const intensityDiff = Math.abs(previous.intensity - current.intensity);
    const valenceDiff = Math.abs(previous.valence - current.valence);
    return (intensityDiff + valenceDiff) / 2;
  }

  // Different emotion = higher base drift
  const intensityDiff = Math.abs(previous.intensity - current.intensity);
  const valenceDiff = Math.abs(previous.valence - current.valence);
  return 0.5 + (intensityDiff + valenceDiff) / 4;
}
```

---

## 6A. Request-Scoped Isolation

> **Critical Pattern**: Prevent concurrent requests from interfering with each other's token budgets and rate limits.

### 6A.1 Token Budget Tracker

```typescript
// lib/infrastructure/token-budget.ts

export class TokenBudgetTracker {
  private usedTokens = 0;
  private readonly softLimitRatio = 0.7; // 70% triggers degradation
  private degraded = false;

  constructor(
    private readonly budget: number = 100_000,
    private readonly onBudgetWarning?: (used: number, budget: number) => void
  ) {}

  get used(): number {
    return this.usedTokens;
  }

  get remaining(): number {
    return Math.max(0, this.budget - this.usedTokens);
  }

  get isDegraded(): boolean {
    return this.degraded;
  }

  record(tokens: number): void {
    this.usedTokens += tokens;

    if (this.isNearBudget() && !this.degraded) {
      this.degraded = true;
      this.onBudgetWarning?.(this.usedTokens, this.budget);
    }
  }

  isNearBudget(): boolean {
    return this.usedTokens >= this.budget * this.softLimitRatio;
  }

  isOverBudget(): boolean {
    return this.usedTokens >= this.budget;
  }

  checkBudget(): void {
    if (this.isOverBudget()) {
      throw new TokenBudgetExceededError(this.usedTokens, this.budget);
    }
  }

  getStatus(): "ok" | "near_limit" | "exceeded" | "degraded" {
    if (this.isOverBudget()) return "exceeded";
    if (this.degraded) return "degraded";
    if (this.isNearBudget()) return "near_limit";
    return "ok";
  }
}

export class TokenBudgetExceededError extends Error {
  constructor(
    public readonly used: number,
    public readonly budget: number
  ) {
    super(`Token budget exceeded: ${used}/${budget}`);
    this.name = "TokenBudgetExceededError";
  }
}
```

### 6A.2 Per-Request LLM Concurrency Limiter

```typescript
// lib/infrastructure/llm-limiter.ts
import pLimit, { LimitFunction } from "p-limit";

const DEFAULT_LLM_CONCURRENCY = 3;

/**
 * Create per-request LLM concurrency limiter
 *
 * ⚠️ CRITICAL: This must be per-request scoped, NOT global!
 *
 * Why NOT global:
 * - Request A starts, uses all 3 slots
 * - Request B arrives, gets queued behind A
 * - Request A completes slowly → B starves
 *
 * With per-request limiter:
 * - Request A gets its own 3 slots
 * - Request B gets its own 3 slots
 * - No cross-request interference
 */
export function createLLMLimiter(
  concurrency: number = DEFAULT_LLM_CONCURRENCY
): LimitFunction {
  return pLimit(concurrency);
}

export interface LLMLimiterContext {
  limiter: LimitFunction;
  activeCount: () => number;
  pendingCount: () => number;
}

export function createLLMLimiterContext(
  concurrency: number = DEFAULT_LLM_CONCURRENCY
): LLMLimiterContext {
  const limiter = pLimit(concurrency);

  return {
    limiter,
    activeCount: () => limiter.activeCount,
    pendingCount: () => limiter.pendingCount,
  };
}
```

### 6A.3 Request-Scoped Pipeline Context

```typescript
// lib/pipeline/context.ts
import { TraceId, createTraceId } from "../infrastructure/trace-id";
import { TokenBudgetTracker } from "../infrastructure/token-budget";
import { LLMLimiterContext, createLLMLimiterContext } from "../infrastructure/llm-limiter";
import { TRACE_SCOPE } from "../utils/constants";

/**
 * Per-request pipeline context
 *
 * ⚠️ NEVER store this in global state!
 * Each request gets a fresh context instance.
 */
export interface PipelineContext {
  // Identity
  traceId: TraceId;
  sessionId: string;
  userId: string;
  turnNumber: number;

  // Request-scoped resources (NOT shared across requests)
  budgetTracker: TokenBudgetTracker;
  llmLimiter: LLMLimiterContext;

  // Abort signal for request cancellation
  abortSignal?: AbortSignal;

  // Progress callback for streaming
  onProgress?: (phase: string, data?: unknown) => void;
}

export function createPipelineContext(params: {
  sessionId: string;
  userId: string;
  turnNumber: number;
  tokenBudget?: number;
  llmConcurrency?: number;
  abortSignal?: AbortSignal;
  onProgress?: (phase: string, data?: unknown) => void;
}): PipelineContext {
  return {
    traceId: createTraceId(TRACE_SCOPE.TURN),
    sessionId: params.sessionId,
    userId: params.userId,
    turnNumber: params.turnNumber,
    budgetTracker: new TokenBudgetTracker(params.tokenBudget ?? 100_000),
    llmLimiter: createLLMLimiterContext(params.llmConcurrency ?? 3),
    abortSignal: params.abortSignal,
    onProgress: params.onProgress,
  };
}
```

### 6A.4 Using Context in Agents

```typescript
// lib/agents/base.ts (updated)
import { PipelineContext } from "../pipeline/context";
import { MolleiState } from "../pipeline/state";

export abstract class BaseAgent {
  protected circuitBreaker: CircuitBreaker;

  constructor(
    protected config: AgentConfig,
    protected fallbackFn: FallbackFn
  ) {
    this.circuitBreaker = new CircuitBreaker(config.agentId);
  }

  protected abstract execute(
    state: MolleiState,
    ctx: PipelineContext
  ): Promise<Partial<MolleiState>>;

  async invoke(
    state: MolleiState,
    ctx: PipelineContext
  ): Promise<Partial<MolleiState>> {
    const start = performance.now();

    // Check budget before executing
    ctx.budgetTracker.checkBudget();

    // Check circuit breaker
    if (!this.circuitBreaker.allowRequest()) {
      logFallback(ctx.traceId, this.config.agentId, 0, "circuit_open");
      return this.withLatency(this.fallbackFn(state), start);
    }

    try {
      // Use per-request limiter to throttle concurrent LLM calls
      const result = await ctx.llmLimiter.limiter(async () => {
        return Promise.race([
          this.execute(state, ctx),
          this.timeoutPromise(ctx.abortSignal),
        ]);
      });

      this.circuitBreaker.recordSuccess();
      traceAgentStage(ctx.traceId, this.config.agentId, "success", performance.now() - start);
      return this.withLatency(result, start);
    } catch (error) {
      this.circuitBreaker.recordFailure();
      const errorMsg = error instanceof Error ? error.message : String(error);
      logFallback(ctx.traceId, this.config.agentId, 1, errorMsg);
      return this.withLatency(
        { ...this.fallbackFn(state), agentErrors: [errorMsg] },
        start
      );
    }
  }

  private timeoutPromise(abortSignal?: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Timeout")),
        this.config.timeoutMs
      );

      // Also abort if request is cancelled
      abortSignal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      });
    });
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

## 6B. Cache Race Condition Handling

### 6B.1 Cache Status Types

```typescript
// lib/infrastructure/cache.ts

export enum CacheStatus {
  HIT = "hit",
  MISS = "miss",
  RACE = "race",           // Race condition detected & resolved
  NEW_SESSION = "session",
  INVALIDATED = "invalidated",
}

export interface CacheResult<T> {
  data: T;
  status: CacheStatus;
  cachedAt?: number;
  fromFallback?: boolean;
}

export interface CacheLookupParams {
  sessionId: string;
  inputHash: string;
  turnNumber: number;
}
```

### 6B.2 Race Condition Handler

```typescript
// lib/infrastructure/cache-race.ts
import Redis from "ioredis";
import { CacheResult, CacheStatus, CacheLookupParams } from "./cache";
import { logMonitoring } from "../server/monitoring";

const RACE_DETECTION_TTL_MS = 5000; // 5 seconds
const RACE_RETRY_DELAY_MS = 100;
const RACE_MAX_RETRIES = 3;

export class RaceConditionHandler<T> {
  constructor(private redis: Redis) {}

  /**
   * Detect and handle cache race conditions
   *
   * When multiple concurrent requests have identical input:
   * 1. First request acquires a "processing" lock
   * 2. Other requests detect the lock and wait
   * 3. First request writes result and releases lock
   * 4. Other requests read the cached result
   */
  async handleLookup(
    key: string,
    params: CacheLookupParams,
    generateFn: () => Promise<T>
  ): Promise<CacheResult<T>> {
    const lockKey = `${key}:lock`;

    // Try to get cached result
    const cached = await this.redis.get(key);
    if (cached) {
      return {
        data: JSON.parse(cached),
        status: CacheStatus.HIT,
        cachedAt: Date.now(),
      };
    }

    // Try to acquire lock
    const acquired = await this.redis.set(
      lockKey,
      Date.now().toString(),
      "PX",
      RACE_DETECTION_TTL_MS,
      "NX"
    );

    if (acquired === "OK") {
      // We won the race - generate and cache
      try {
        const result = await generateFn();
        await this.redis.setex(key, 3600, JSON.stringify(result)); // 1 hour TTL
        return {
          data: result,
          status: CacheStatus.MISS,
        };
      } finally {
        await this.redis.del(lockKey);
      }
    }

    // Another request is generating - wait and retry
    return this.waitForResult(key, params);
  }

  private async waitForResult(
    key: string,
    params: CacheLookupParams,
    attempt: number = 0
  ): Promise<CacheResult<T>> {
    if (attempt >= RACE_MAX_RETRIES) {
      logMonitoring("cache-race-timeout", {
        key,
        sessionId: params.sessionId,
        attempts: attempt,
      });
      throw new Error("Cache race condition timeout");
    }

    await this.delay(RACE_RETRY_DELAY_MS * (attempt + 1));

    const cached = await this.redis.get(key);
    if (cached) {
      logMonitoring("cache-race-resolved", {
        key,
        sessionId: params.sessionId,
        attempts: attempt + 1,
      });
      return {
        data: JSON.parse(cached),
        status: CacheStatus.RACE,
        cachedAt: Date.now(),
      };
    }

    return this.waitForResult(key, params, attempt + 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

## 6C. Input Validation Stage

```typescript
// lib/pipeline/stages/input-validation.ts
import { z } from "zod";
import { MolleiState } from "../state";
import { PipelineContext } from "../context";
import { traceAgentStage } from "../../infrastructure/trace";

const UserMessageSchema = z.object({
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message too long (max 10,000 characters)"),
  sessionId: z.string().uuid("Invalid session ID"),
  userId: z.string().min(1, "User ID required"),
});

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  sanitizedInput?: {
    message: string;
    sessionId: string;
    userId: string;
  };
}

export async function stageInputValidation(
  state: MolleiState,
  ctx: PipelineContext
): Promise<{ state: MolleiState; validation: ValidationResult }> {
  const start = performance.now();

  const result = UserMessageSchema.safeParse({
    message: state.userMessage,
    sessionId: state.sessionId,
    userId: state.userId,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    }));

    traceAgentStage(ctx.traceId, "input_validation", "failed", performance.now() - start, {
      errorCount: errors.length,
    });

    return {
      state,
      validation: { valid: false, errors },
    };
  }

  // Sanitize input (trim, normalize unicode, etc.)
  const sanitized = {
    message: result.data.message.trim().normalize("NFC"),
    sessionId: result.data.sessionId,
    userId: result.data.userId,
  };

  traceAgentStage(ctx.traceId, "input_validation", "success", performance.now() - start);

  return {
    state: {
      ...state,
      userMessage: sanitized.message,
    },
    validation: {
      valid: true,
      errors: [],
      sanitizedInput: sanitized,
    },
  };
}
```

---

## 6E. North Star Instrumentation (WRU-ETI)

This section provides instrumentation to measure the North Star metric: **Weekly Returning Users with Emotional Trajectory Improvement (WRU-ETI)**.

### 6E.1 Emotional Trajectory Types

```typescript
// lib/metrics/emotional-trajectory.ts

/**
 * Baseline Emotional Level (BEL) - User's typical emotional state over time
 * Calculated as rolling average of session-end valence scores
 */
export interface BaselineEmotionalLevel {
  userId: string;
  baseline: number;           // Initial BEL at first measurement (-1 to 1)
  current: number;            // Current rolling BEL
  weeklySnapshots: number[];  // Last 4 weeks of weekly averages
  measurementCount: number;   // Total sessions contributing to BEL
  lastUpdated: Date;
}

/**
 * Emotional Trajectory Improvement (ETI)
 * True when current BEL > baseline BEL with statistical significance
 */
export interface EmotionalTrajectory {
  userId: string;
  hasImprovement: boolean;    // ETI positive?
  improvementDelta: number;   // current - baseline
  confidenceLevel: number;    // 0-1 statistical confidence
  trend: "improving" | "stable" | "declining";
  weeklyValences: WeeklyValence[];
}

interface WeeklyValence {
  weekStart: Date;
  averageValence: number;
  sessionCount: number;
  emotionDistribution: Record<string, number>;  // Primary emotions frequency
}
```

### 6E.2 BEL Calculation

```typescript
// lib/metrics/bel-calculator.ts
import { db } from "@/lib/db";
import { conversationTurns, sessions } from "@/lib/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const MIN_SESSIONS_FOR_BEL = 3;
const ROLLING_WINDOW_WEEKS = 4;

export async function calculateBEL(userId: string): Promise<BaselineEmotionalLevel | null> {
  // Get all session-end emotions for user
  const sessionEmotions = await db
    .select({
      sessionId: sessions.id,
      endValence: sessions.endEmotionValence,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));

  if (sessionEmotions.length < MIN_SESSIONS_FOR_BEL) {
    return null; // Not enough data for baseline
  }

  // Calculate initial baseline from first 3 sessions
  const initialSessions = sessionEmotions.slice(-MIN_SESSIONS_FOR_BEL);
  const baseline = initialSessions.reduce((sum, s) => sum + (s.endValence ?? 0), 0) / MIN_SESSIONS_FOR_BEL;

  // Calculate current rolling average (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentSessions = sessionEmotions.filter(s => s.createdAt >= fourWeeksAgo);
  const current = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.endValence ?? 0), 0) / recentSessions.length
    : baseline;

  // Calculate weekly snapshots
  const weeklySnapshots = calculateWeeklySnapshots(sessionEmotions, ROLLING_WINDOW_WEEKS);

  return {
    userId,
    baseline,
    current,
    weeklySnapshots,
    measurementCount: sessionEmotions.length,
    lastUpdated: new Date(),
  };
}

function calculateWeeklySnapshots(
  sessions: Array<{ endValence: number | null; createdAt: Date }>,
  weeks: number
): number[] {
  const snapshots: number[] = [];
  const now = new Date();

  for (let w = 0; w < weeks; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (w * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekSessions = sessions.filter(
      s => s.createdAt >= weekStart && s.createdAt < weekEnd
    );

    if (weekSessions.length > 0) {
      const avg = weekSessions.reduce((sum, s) => sum + (s.endValence ?? 0), 0) / weekSessions.length;
      snapshots.unshift(avg); // Oldest first
    }
  }

  return snapshots;
}
```

### 6E.3 ETI Evaluation

```typescript
// lib/metrics/eti-evaluator.ts

const IMPROVEMENT_THRESHOLD = 0.1;  // Minimum delta for "improvement"
const CONFIDENCE_THRESHOLD = 0.7;   // Minimum confidence for ETI positive

export function evaluateETI(bel: BaselineEmotionalLevel): EmotionalTrajectory {
  const improvementDelta = bel.current - bel.baseline;

  // Calculate confidence based on sample size and consistency
  const confidenceLevel = calculateConfidence(bel);

  // Determine trend from weekly snapshots
  const trend = determineTrend(bel.weeklySnapshots);

  // ETI is positive when improvement exceeds threshold with sufficient confidence
  const hasImprovement =
    improvementDelta >= IMPROVEMENT_THRESHOLD &&
    confidenceLevel >= CONFIDENCE_THRESHOLD;

  return {
    userId: bel.userId,
    hasImprovement,
    improvementDelta,
    confidenceLevel,
    trend,
    weeklyValences: [], // Populated by separate query
  };
}

function calculateConfidence(bel: BaselineEmotionalLevel): number {
  // Higher sample size = higher confidence
  const sampleConfidence = Math.min(bel.measurementCount / 20, 1);

  // Lower variance in weekly snapshots = higher confidence
  const variance = calculateVariance(bel.weeklySnapshots);
  const varianceConfidence = Math.max(0, 1 - variance);

  return (sampleConfidence + varianceConfidence) / 2;
}

function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function determineTrend(snapshots: number[]): "improving" | "stable" | "declining" {
  if (snapshots.length < 2) return "stable";

  // Simple linear regression slope
  const n = snapshots.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = snapshots.reduce((a, b) => a + b, 0);
  const xySum = snapshots.reduce((sum, y, x) => sum + x * y, 0);
  const xxSum = snapshots.reduce((sum, _, x) => sum + x * x, 0);

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);

  if (slope > 0.05) return "improving";
  if (slope < -0.05) return "declining";
  return "stable";
}
```

### 6E.4 WRU-ETI Aggregation

```typescript
// lib/metrics/wru-eti.ts
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq, gte, sql } from "drizzle-orm";
import { calculateBEL } from "./bel-calculator";
import { evaluateETI } from "./eti-evaluator";

export interface WRUETIMetrics {
  period: { start: Date; end: Date };
  totalActiveUsers: number;
  weeklyReturningUsers: number;      // 2+ sessions in week
  usersWithETI: number;              // ETI positive
  wruEtiCount: number;               // WRU AND ETI
  wruEtiRate: number;                // North Star %
  breakdown: {
    returnerRate: number;            // % of actives who return
    etiRateAmongReturners: number;   // % of returners with ETI
  };
}

export async function calculateWRUETI(): Promise<WRUETIMetrics> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get users with 2+ sessions this week (Weekly Returning Users)
  const weeklyReturners = await db
    .select({
      userId: sessions.userId,
      sessionCount: sql<number>`count(*)`,
    })
    .from(sessions)
    .where(gte(sessions.createdAt, weekAgo))
    .groupBy(sessions.userId)
    .having(sql`count(*) >= 2`);

  const weeklyReturnerIds = weeklyReturners.map(r => r.userId);

  // Calculate ETI for each weekly returner
  let usersWithETI = 0;
  let wruEtiCount = 0;

  for (const userId of weeklyReturnerIds) {
    const bel = await calculateBEL(userId);
    if (bel) {
      const eti = evaluateETI(bel);
      if (eti.hasImprovement) {
        usersWithETI++;
        wruEtiCount++; // They're already a weekly returner
      }
    }
  }

  // Get total active users this week
  const activeUsers = await db
    .selectDistinct({ userId: sessions.userId })
    .from(sessions)
    .where(gte(sessions.createdAt, weekAgo));

  const totalActiveUsers = activeUsers.length;
  const weeklyReturningUsers = weeklyReturnerIds.length;

  return {
    period: { start: weekAgo, end: now },
    totalActiveUsers,
    weeklyReturningUsers,
    usersWithETI,
    wruEtiCount,
    wruEtiRate: totalActiveUsers > 0 ? wruEtiCount / totalActiveUsers : 0,
    breakdown: {
      returnerRate: totalActiveUsers > 0 ? weeklyReturningUsers / totalActiveUsers : 0,
      etiRateAmongReturners: weeklyReturningUsers > 0 ? usersWithETI / weeklyReturningUsers : 0,
    },
  };
}
```

### 6E.5 Session End Emotion Capture

Add to the memory update node to capture session-end emotion for BEL calculation:

```typescript
// lib/agents/memory-update.ts (addition)
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function captureSessionEndEmotion(
  sessionId: string,
  userEmotion: EmotionState
): Promise<void> {
  await db
    .update(sessions)
    .set({
      endEmotionValence: userEmotion.valence,
      endEmotionPrimary: userEmotion.primary,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId));
}
```

### 6E.6 Database Schema Addition

```sql
-- Add to sessions table for BEL tracking
ALTER TABLE sessions ADD COLUMN end_emotion_valence DECIMAL(3,2);
ALTER TABLE sessions ADD COLUMN end_emotion_primary VARCHAR(50);

-- Materialized view for weekly metrics (optional, for performance)
CREATE MATERIALIZED VIEW weekly_emotional_metrics AS
SELECT
  user_id,
  date_trunc('week', created_at) as week_start,
  avg(end_emotion_valence) as avg_valence,
  count(*) as session_count,
  mode() WITHIN GROUP (ORDER BY end_emotion_primary) as dominant_emotion
FROM sessions
WHERE end_emotion_valence IS NOT NULL
GROUP BY user_id, date_trunc('week', created_at);

-- Index for efficient BEL queries
CREATE INDEX idx_sessions_user_valence ON sessions(user_id, created_at, end_emotion_valence);
```

### 6E.7 Tracing Integration

```typescript
// lib/tracing/north-star-events.ts
import { traceEvent } from "./handlers";
import { TRACE_EVENT_TYPE } from "../utils/constants";

export function traceETICalculation(
  traceId: string,
  userId: string,
  result: EmotionalTrajectory
): void {
  traceEvent({
    traceId,
    eventType: TRACE_EVENT_TYPE.ETI_CALCULATION,
    payload: {
      userId,
      hasImprovement: result.hasImprovement,
      improvementDelta: result.improvementDelta,
      trend: result.trend,
      confidenceLevel: result.confidenceLevel,
    },
    timestamp: new Date(),
  });
}

export function traceWRUETISnapshot(
  metrics: WRUETIMetrics
): void {
  traceEvent({
    traceId: `mollei_metrics_${Date.now()}`,
    eventType: TRACE_EVENT_TYPE.WRU_ETI_WEEKLY,
    payload: {
      wruEtiRate: metrics.wruEtiRate,
      totalActiveUsers: metrics.totalActiveUsers,
      weeklyReturningUsers: metrics.weeklyReturningUsers,
      usersWithETI: metrics.usersWithETI,
      period: metrics.period,
    },
    timestamp: new Date(),
  });
}
```

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
