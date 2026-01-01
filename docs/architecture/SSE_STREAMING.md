# SSE Streaming Architecture

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-29-25 1:55PM PST
> **Library**: [`@agenisea/sse-kit`](https://github.com/agenisea/sse-kit)

---

## Executive Summary

Mollei uses Server-Sent Events (SSE) for real-time streaming of multi-agent pipeline responses. This document specifies the SSE integration using `@agenisea/sse-kit`, a framework-agnostic TypeScript library providing:

- **Server-side orchestration** with heartbeat, abort signals, and observability hooks
- **Client-side parsing** with exponential backoff reconnection
- **Circuit breaker** pattern for resilience
- **Generic React hook** for state management

### Why SSE for Multi-Agent Streaming

| Requirement | SSE Solution |
|-------------|--------------|
| Token-by-token streaming | Native HTTP, simpler than WebSocket |
| Connection keep-alive | Built-in heartbeat prevents proxy timeouts |
| Client disconnect detection | `request.signal` auto-abort |
| Observability | Observer hooks integrate with OpenTelemetry |
| Reconnection | Exponential backoff with jitter |
| Browser compatibility | Native `EventSource` + Fetch API fallback |

---

## 1. Agent Topology: SSE Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER MESSAGE                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API ROUTE (Next.js)                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  createStreamingResponse({ signal: request.signal, observer })    │  │
│  │  orchestrator.startHeartbeat()                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ PARALLEL           │ PARALLEL           │ PARALLEL
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────────┐     ┌─────────────┐
│ MOOD SENSOR │      │ MEMORY AGENT    │     │   SAFETY    │
│─────────────│      │─────────────────│     │  MONITOR    │
│ sendProgress│      │  sendProgress   │     │─────────────│
│ ("mood_     │      │  ("memory_      │     │ sendProgress│
│  sensor")   │      │   agent")       │     │ ("safety_   │
└─────────────┘      └─────────────────┘     │  monitor")  │
         │                    │              └─────────────┘
         │                    │                      │
         └────────┬───────────┴──────────────────────┘
                  │
         [SYNCHRONIZATION BARRIER]
                  │
                  ▼
         ┌─────────────────┐
         │ EMOTION REASONER│
         │─────────────────│
         │  sendProgress   │
         │ ("emotion_      │
         │  reasoner")     │
         └─────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    RESPONSE     │
         │   GENERATOR     │
         │─────────────────│
         │ Token streaming │  ← sendProgress("response_generator", { delta })
         │ via SSE delta   │
         └─────────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  sendResult()   │  ← Final response + crisis metadata
         │  orchestrator   │
         │    .close()     │
         └─────────────────┘
```

---

## 2. Server-Side Implementation

### 2.1 Dependencies

```json
{
  "dependencies": {
    "@agenisea/sse-kit": "^0.1.0"
  }
}
```

### 2.2 SSE Event Types

```typescript
// lib/streaming/sse-events.ts
import type { SSEUpdate } from "@agenisea/sse-kit/types";

export interface MolleiSSEUpdate extends SSEUpdate {
  phase: MolleiStreamPhase;
  message?: string;
  result?: MolleiStreamResult;
  error?: string;
  metadata?: MolleiStreamMetadata;
}

export type MolleiStreamPhase =
  | "idle"
  | "mood_sensor"
  | "memory_agent"
  | "safety_monitor"
  | "emotion_reasoner"
  | "response_generator"
  | "complete"
  | "error";

export interface MolleiStreamResult {
  sessionId: string;
  response: string;
  turnNumber: number;
  crisisDetected?: boolean;
}

export interface MolleiStreamMetadata {
  agentId: string;
  latencyMs: number;
  tokensUsed?: number;
}
```

### 2.3 Streaming Chat Endpoint

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
      traceStreamEvent(traceId, "stream_end", {
        durationMs,
        success,
        error: error?.message,
      });
    },
    onUpdateSent: (phase, bytesSent) => {
      traceStreamEvent(traceId, "update_sent", { phase, bytesSent });
    },
    onHeartbeat: () => {
      traceStreamEvent(traceId, "heartbeat", {});
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

      // Execute pipeline with progress streaming
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
      await orchestrator.sendError(
        error instanceof Error ? error.message : "Internal error"
      );
    } finally {
      await orchestrator.close();
    }
  })();

  return createSSEResponse(stream);
}
```

### 2.4 Token-Level Streaming (Response Generator)

For streaming individual tokens from the response generator:

```typescript
// lib/agents/response-generator-stream.ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { StreamOrchestrator } from "@agenisea/sse-kit/server";
import { AGENT_MODELS } from "@/lib/ai/models";
import { TOKEN_BUDGETS } from "@/lib/utils/constants";
import type { MolleiSSEUpdate } from "@/lib/streaming/sse-events";

export async function streamResponseGenerator(
  orchestrator: StreamOrchestrator<MolleiSSEUpdate>,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  let fullResponse = "";

  const result = await streamText({
    model: anthropic(AGENT_MODELS.RESPONSE_GENERATOR),
    system: systemPrompt,
    prompt: userMessage,
    maxTokens: TOKEN_BUDGETS.RESPONSE_GENERATOR,
  });

  // Stream token-by-token via SSE
  for await (const chunk of result.textStream) {
    if (orchestrator.aborted) break;

    fullResponse += chunk;
    await orchestrator.sendEvent("delta", { content: chunk });
  }

  return fullResponse;
}
```

---

## 3. Client-Side Implementation

### 3.1 React Hook Integration

```typescript
// hooks/use-mollei-stream.ts
import { useSSEStream } from "@agenisea/sse-kit/client";
import type { MolleiSSEUpdate, MolleiStreamResult, MolleiStreamPhase } from "@/lib/streaming/sse-events";

export interface ChatInput {
  sessionId?: string;
  userId: string;
  message: string;
}

export function useMolleiStream() {
  return useSSEStream<ChatInput, MolleiStreamResult, MolleiSSEUpdate, MolleiStreamPhase>({
    endpoint: "/api/chat",
    method: "POST",

    // Phase lifecycle
    initialPhase: "idle",
    completePhase: "complete",
    errorPhase: "error",

    // Resilience
    retry: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      jitter: true,
    },

    // Callbacks
    onUpdate: (update) => {
      console.log(`[${update.phase}]`, update.message);
    },
    onComplete: (result) => {
      console.log("Response:", result.response);
    },
    onError: (error) => {
      console.error("Stream error:", error);
    },

    // Browser UX
    warnOnUnload: true,
  });
}
```

### 3.2 Chat Component

```typescript
// components/chat/chat-interface.tsx
"use client";

import { useState } from "react";
import { useMolleiStream } from "@/hooks/use-mollei-stream";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const { state, start, cancel, reset } = useMolleiStream();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    const result = await start({
      userId,
      message: userMessage,
    });

    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
            } max-w-[80%]`}
          >
            {msg.content}
          </div>
        ))}

        {/* Streaming indicator */}
        {state.isStreaming && (
          <div className="text-sm text-gray-500">
            {state.phase !== "idle" && (
              <span className="animate-pulse">
                {getPhaseLabel(state.phase)}...
              </span>
            )}
          </div>
        )}

        {/* Error display */}
        {state.error && (
          <div className="text-red-500 text-sm">
            {state.error}
            <button onClick={reset} className="ml-2 underline">
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How are you feeling?"
            disabled={state.isStreaming}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          {state.isStreaming ? (
            <button
              type="button"
              onClick={cancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    mood_sensor: "Understanding your feelings",
    memory_agent: "Recalling our conversation",
    safety_monitor: "Ensuring your safety",
    emotion_reasoner: "Preparing my response",
    response_generator: "Responding",
  };
  return labels[phase] || phase;
}
```

---

## 4. Pipeline Orchestration: SSE Events

### 4.1 Progress Reporter Interface (DIP Compliance)

The pipeline module depends on an abstract interface, not the concrete `StreamOrchestrator`.
This enables substitution of different transports (SSE, WebSocket, polling, testing mocks).

```typescript
// lib/pipeline/types.ts
/**
 * Abstract interface for progress reporting.
 * Follows Dependency Inversion Principle - high-level pipeline module
 * depends on this abstraction, not concrete SSE implementation.
 */
export interface ProgressReporter {
  /** Report progress for an agent */
  sendProgress(agentId: string, data?: unknown): Promise<void>;

  /** Check if the stream/connection was aborted */
  readonly aborted: boolean;
}

/**
 * No-op reporter for non-streaming contexts (testing, batch processing).
 */
export const nullProgressReporter: ProgressReporter = {
  sendProgress: async () => {},
  get aborted() { return false; },
};
```

### 4.2 Pipeline Context with Interface Injection

```typescript
// lib/pipeline/context.ts
import type { ProgressReporter } from "./types";

export interface PipelineContext {
  traceId: string;
  sessionId: string;
  userId: string;
  turnNumber: number;
  onProgress?: (agentId: string, data?: unknown) => Promise<void>;
}

/**
 * Creates pipeline context with optional progress reporter.
 *
 * @param progressReporter - Abstract reporter interface (not concrete StreamOrchestrator)
 */
export function createPipelineContext(options: {
  traceId: string;
  sessionId: string;
  userId: string;
  turnNumber: number;
  progressReporter?: ProgressReporter;  // ✅ Interface, not concrete type
}): PipelineContext {
  const { progressReporter, ...rest } = options;

  return {
    ...rest,
    onProgress: progressReporter
      ? async (agentId, data) => {
          if (!progressReporter.aborted) {
            await progressReporter.sendProgress(agentId, data);
          }
        }
      : undefined,
  };
}
```

### 4.3 SSE Adapter (Bridges Orchestrator to Interface)

```typescript
// lib/streaming/sse-progress-adapter.ts
import { StreamOrchestrator } from "@agenisea/sse-kit/server";
import type { ProgressReporter } from "@/lib/pipeline/types";
import type { MolleiSSEUpdate, MolleiStreamPhase } from "./sse-events";

/**
 * Adapter that bridges StreamOrchestrator to ProgressReporter interface.
 * Follows Adapter Pattern - converts SSE-specific API to generic interface.
 */
export function createSSEProgressAdapter(
  orchestrator: StreamOrchestrator<MolleiSSEUpdate>
): ProgressReporter {
  return {
    sendProgress: async (agentId: string, data?: unknown) => {
      const phase = agentId as MolleiStreamPhase;
      const message = data ? JSON.stringify(data) : undefined;
      await orchestrator.sendProgress(phase, message);
    },
    get aborted() {
      return orchestrator.aborted;
    },
  };
}
```

### 4.4 Agent Wrapper with Progress Reporting

```typescript
// lib/agents/base.ts (extended)
export abstract class BaseAgent {
  async invoke(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const start = performance.now();

    // Report progress at start
    await ctx.onProgress?.(this.config.agentId);

    try {
      const result = await Promise.race([
        this.execute(state),
        this.timeoutPromise(),
      ]);

      // Report completion with latency
      const latencyMs = Math.round(performance.now() - start);
      await ctx.onProgress?.(this.config.agentId, { latencyMs, status: "complete" });

      return this.withLatency(result, start);
    } catch (error) {
      // Report error
      await ctx.onProgress?.(this.config.agentId, {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return this.withLatency(this.fallbackFn(state), start);
    }
  }
}
```

---

## 5. Resilience Patterns

### 5.1 Circuit Breaker (Client-Side)

```typescript
// lib/client/stream-client.ts
import { createCircuitBreaker } from "@agenisea/sse-kit/client";

const circuitBreaker = createCircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  successThreshold: 1,
});

export async function streamChat(input: ChatInput): Promise<Response> {
  return circuitBreaker.execute(async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  });
}
```

### 5.2 Timeout Configuration

```typescript
// lib/utils/constants.ts (additions)
export const SSE_TIMEOUTS = {
  REQUEST_MS: 60000,     // Max time for initial connection
  IDLE_MS: 30000,        // Max time between events
  HEARTBEAT_MS: 5000,    // Heartbeat interval
  PIPELINE_TOTAL: 5000,  // Max pipeline duration
} as const;
```

### 5.3 Graceful Degradation

```typescript
// app/api/chat/route.ts (error handling)
async function handlePipelineWithFallback(
  orchestrator: StreamOrchestrator<MolleiSSEUpdate>,
  input: MolleiState,
  ctx: PipelineContext
): Promise<MolleiState> {
  try {
    return await runSequentialPipeline(getMolleiPipeline(), input, ctx);
  } catch (error) {
    // Template fallback on complete failure
    const fallbackResponse = "I'm here with you. Something went wrong on my end, but please know I'm listening.";

    await orchestrator.sendResult({
      sessionId: input.sessionId,
      response: fallbackResponse,
      turnNumber: input.turnNumber,
    });

    return {
      ...input,
      response: fallbackResponse,
    };
  }
}
```

---

## 6. Observability Integration

### 6.1 Trace Events

```typescript
// lib/infrastructure/trace-stream.ts
import { trace } from "@opentelemetry/api";
import { TRACE_EVENT_TYPE, TRACE_SCOPE } from "@/lib/utils/constants";

const tracer = trace.getTracer("mollei-sse");

export function traceStreamEvent(
  traceId: string,
  eventType: string,
  attributes: Record<string, unknown>
): void {
  const span = tracer.startSpan(`sse.${eventType}`, {
    attributes: {
      "sse.trace_id": traceId,
      "sse.event_type": eventType,
      ...flattenAttributes(attributes),
    },
  });
  span.end();
}

function flattenAttributes(obj: Record<string, unknown>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[`sse.${key}`] = typeof value === "object" ? JSON.stringify(value) : value as string | number | boolean;
    }
  }
  return result;
}
```

### 6.2 Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `sse.stream.duration_ms` | Histogram | Total stream duration |
| `sse.stream.bytes_sent` | Counter | Bytes sent per stream |
| `sse.stream.heartbeats` | Counter | Heartbeats sent |
| `sse.stream.aborts` | Counter | Client disconnects |
| `sse.stream.errors` | Counter | Stream errors |
| `sse.reconnect.attempts` | Histogram | Client reconnection attempts |

---

## 7. SSE Message Protocol

### 7.1 Event Format

```
event: <event_type>
data: <json_payload>

```

### 7.2 Event Types

| Event Type | Description | Payload |
|------------|-------------|---------|
| `(none)` | Progress update | `{ phase, message? }` |
| `delta` | Token chunk | `{ content }` |
| `complete` | Final result | `{ sessionId, response, turnNumber, crisisDetected? }` |
| `error` | Error | `{ error, code? }` |
| `: [heartbeat]` | Keep-alive comment | (no data) |

### 7.3 Example Stream

```
: [heartbeat]

data: {"phase":"mood_sensor","message":"Analyzing emotions"}

: [heartbeat]

data: {"phase":"memory_agent","message":"Retrieving context"}

data: {"phase":"safety_monitor"}

data: {"phase":"emotion_reasoner","message":"Computing response"}

data: {"phase":"response_generator"}

event: delta
data: {"content":"I "}

event: delta
data: {"content":"hear "}

event: delta
data: {"content":"you..."}

data: {"phase":"complete","result":{"sessionId":"abc-123","response":"I hear you...","turnNumber":1}}

```

---

## 8. Security Considerations

### 8.1 Input Validation

- All requests validated with Zod schemas
- Message length limited to 10,000 characters (hard limit)
- Session IDs must be valid UUIDs

**Soft Limit UX for Message Length**:

For emotional support contexts, most messages are 50-500 characters. A soft limit provides gentle UX guidance without blocking therapeutic writing exercises:

```typescript
// lib/utils/constants.ts
export const MESSAGE_LIMITS = {
  SOFT_LIMIT: 2000,   // Show supportive nudge in UI
  HARD_LIMIT: 10000,  // Zod validation rejection
} as const;

// UI hint when approaching soft limit:
// "That's a lot to share — take your time. I'm here to listen."
```

### 8.2 Abort Signal

- `request.signal` passed to orchestrator
- Automatic cleanup on client disconnect
- Prevents resource leaks from abandoned streams

### 8.3 Rate Limiting

SSE connections should be rate-limited per user:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerSession } from "next-auth";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1m"), // 10 streams per minute
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/chat")) {
    // IMPORTANT: In production, extract userId from authenticated session/JWT
    // Never trust client-provided headers for rate limiting identity
    const session = await getServerSession();
    const userId = session?.user?.id;

    if (userId) {
      const { success } = await ratelimit.limit(userId);
      if (!success) {
        return Response.json({ error: "Rate limited" }, { status: 429 });
      }
    }
  }
}
```

> **Security Note**: Always derive `userId` from server-side session or verified JWT. Client-provided headers like `x-user-id` can be spoofed to bypass rate limits.

---

## 9. Testing

### 9.1 Server-Side Tests

```typescript
// __tests__/api/chat-stream.test.ts
import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  it("returns SSE response with correct headers", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        userId: "test-user",
        message: "Hello",
      }),
    });

    const response = await POST(request as any);

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("Connection")).toBe("keep-alive");
  });

  it("handles abort signal", async () => {
    const controller = new AbortController();
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        userId: "test-user",
        message: "Hello",
      }),
      signal: controller.signal,
    });

    const response = await POST(request as any);
    controller.abort();

    // Stream should close gracefully
    const reader = response.body?.getReader();
    // ... assert stream closes
  });
});
```

### 9.2 Client-Side Tests

```typescript
// __tests__/hooks/use-mollei-stream.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useMolleiStream } from "@/hooks/use-mollei-stream";

describe("useMolleiStream", () => {
  it("starts in idle phase", () => {
    const { result } = renderHook(() => useMolleiStream());
    expect(result.current.state.phase).toBe("idle");
    expect(result.current.state.isStreaming).toBe(false);
  });

  it("transitions through phases during stream", async () => {
    // Mock fetch with SSE response...
  });
});
```

---

## 10. Migration Guide

### From Raw ReadableStream to @agenisea/sse-kit

**Before** (manual SSE):
```typescript
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    controller.close();
  },
});
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream", ... },
});
```

**After** (@agenisea/sse-kit):
```typescript
const { stream, orchestrator } = createStreamingResponse({
  signal: request.signal,
  observer: { onAbort: (reason) => console.log("Aborted:", reason) },
});
orchestrator.startHeartbeat();
await orchestrator.sendProgress("processing");
await orchestrator.sendResult({ data: "complete" });
await orchestrator.close();
return createSSEResponse(stream);
```

---

## Appendix A: @agenisea/sse-kit API Reference

### Server (`@agenisea/sse-kit/server`)

| Export | Description |
|--------|-------------|
| `createStreamingResponse(config?)` | Create stream + orchestrator |
| `createSSEResponse(stream, headers?)` | Create Response with SSE headers |
| `StreamOrchestrator` | Class for managing SSE stream |
| `SSE_HEADERS` | Standard SSE headers object |

### Client (`@agenisea/sse-kit/client`)

| Export | Description |
|--------|-------------|
| `useSSEStream(options)` | React hook for SSE streams |
| `createCircuitBreaker(config)` | Circuit breaker for resilience |
| `fetchWithTimeout(fetchFn, config)` | Timeout-wrapped fetch |
| `withRetry(operation, options)` | Retry wrapper with backoff |

### Types (`@agenisea/sse-kit/types`)

| Type | Description |
|------|-------------|
| `SSEUpdate` | Base streaming update shape |
| `RetryConfig` | Retry configuration |
| `TimeoutConfig` | Timeout configuration |
| `HeartbeatConfig` | Heartbeat configuration |
| `CircuitBreakerConfig` | Circuit breaker options |

---

## Appendix B: Default Configuration

```typescript
// Retry (client-side reconnection)
{
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true
}

// Timeout
{
  requestMs: 120000,  // 2 minutes
  idleMs: 30000       // 30 seconds
}

// Heartbeat (server-side)
{
  intervalMs: 5000,
  enabled: true,
  message: "heartbeat"
}

// Circuit Breaker
{
  failureThreshold: 3,
  resetTimeoutMs: 30000,
  successThreshold: 1
}
```

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
