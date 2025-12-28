# Resilience Patterns

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-28-25 10:38PM PST

---

## 3.1 Circuit Breaker Configuration

```typescript
// lib/resilience/circuit-breaker.ts

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenRequests: number;
}

const CIRCUIT_BREAKER_CONFIGS: Record<string, CircuitBreakerConfig> = {
  mood_sensor: { failureThreshold: 5, recoveryTimeoutMs: 30000, halfOpenRequests: 1 },
  memory_agent: { failureThreshold: 3, recoveryTimeoutMs: 30000, halfOpenRequests: 1 },
  safety_monitor: { failureThreshold: 5, recoveryTimeoutMs: 30000, halfOpenRequests: 1 },
  emotion_reasoner: { failureThreshold: 3, recoveryTimeoutMs: 30000, halfOpenRequests: 1 },
  response_generator: { failureThreshold: 2, recoveryTimeoutMs: 30000, halfOpenRequests: 1 },
};

type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(private agentId: string) {
    this.config = CIRCUIT_BREAKER_CONFIGS[agentId] ?? {
      failureThreshold: 3,
      recoveryTimeoutMs: 30000,
      halfOpenRequests: 1,
    };
  }

  allowRequest(): boolean {
    if (this.state === "closed") return true;

    if (this.state === "open") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.recoveryTimeoutMs) {
        this.state = "half_open";
        return true;
      }
      return false;
    }

    // half_open: allow limited requests
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

---

## 3.2 Fallback Chains

| Agent | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|------------|------------|------------|
| `mood_sensor` | Heuristic keywords | Neutral emotion `{primary: "neutral", intensity: 0.5}` | - |
| `memory_agent` | Last 3 turns from DB | Empty context | - |
| `safety_monitor` | Keyword regex check | Assume safe (log for review) | - |
| `emotion_reasoner` | Rule-based emotion mapping | Mollei's default warmth state | - |
| `response_generator` | Sonnet (smaller model) | Template response | Apologetic fallback |

---

## 3.3 Fallback Implementation

```typescript
// lib/resilience/fallbacks.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { MolleiState } from "../pipeline/state";
import { logFallback } from "../server/monitoring";

const TEMPLATE_RESPONSES = [
  "I can sense you're going through something right now. I'm here with you.",
  "It sounds like a lot is on your mind. Take your time—I'm listening.",
  "I want to make sure I understand what you're feeling. Can you tell me more?",
];

function generateTemplateResponse(state: MolleiState): string {
  const randomIndex = Math.floor(Math.random() * TEMPLATE_RESPONSES.length);
  return TEMPLATE_RESPONSES[randomIndex];
}

export async function responseGeneratorWithFallback(
  state: MolleiState,
  systemPrompt: string
): Promise<{ response: string; modelUsed: string }> {
  // Tier 1: Sonnet (primary response generation)
  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-5"),
      system: systemPrompt,
      prompt: state.userMessage,
      maxTokens: 800,
      abortSignal: AbortSignal.timeout(1500),
    });
    return { response: text, modelUsed: "sonnet" };
  } catch (error) {
    logFallback(state.traceId, "response_generator", 1, String(error));
  }

  // Tier 2: Opus (crisis fallback - severity 4+)
  try {
    const { text } = await generateText({
      model: anthropic("claude-opus-4-5"),
      system: systemPrompt,
      prompt: state.userMessage,
      maxTokens: 2000,
      abortSignal: AbortSignal.timeout(3000),
    });
    return { response: text, modelUsed: "opus_fallback" };
  } catch (error) {
    logFallback(state.traceId, "response_generator", 2, String(error));
  }

  // Tier 3: Template response
  const template = generateTemplateResponse(state);
  logFallback(state.traceId, "response_generator", 3, "all_models_failed");
  return { response: template, modelUsed: "template_fallback" };
}
```

---

## 3.4 Timeout Handling

```typescript
// lib/resilience/timeouts.ts
import { MolleiState } from "../pipeline/state";
import { logTimeout } from "../server/monitoring";

type AgentFunction<T> = (state: MolleiState) => Promise<T>;
type FallbackFunction<T> = (state: MolleiState) => T;

export function withTimeout<T>(
  timeoutMs: number,
  fallbackFn: FallbackFunction<T>
) {
  return function decorator(fn: AgentFunction<T>): AgentFunction<T> {
    return async (state: MolleiState): Promise<T> => {
      try {
        const result = await Promise.race([
          fn(state),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeoutMs)
          ),
        ]);
        return result;
      } catch (error) {
        if (error instanceof Error && error.message === "Timeout") {
          logTimeout(state.traceId, fn.name, timeoutMs);
          return fallbackFn(state);
        }
        throw error;
      }
    };
  };
}

// Usage example
const neutralEmotionFallback = (state: MolleiState) => ({
  userEmotion: { primary: "neutral", intensity: 0.5, valence: 0, signals: [] },
});

export const moodSensorWithTimeout = withTimeout(1000, neutralEmotionFallback);
```

---

## 3.5 Idempotency

```typescript
// lib/resilience/idempotency.ts
import { Redis } from "ioredis";
import { MolleiState } from "../pipeline/state";
import { updateSessionContext, insertConversationTurn } from "../db/repositories";
import { logError } from "../server/monitoring";

const redis = new Redis(process.env.REDIS_URL!);
const OPERATION_TTL_SECONDS = 3600; // 1 hour

export async function memoryUpdateNode(state: MolleiState): Promise<Partial<MolleiState>> {
  const operationKey = `mollei:op:${state.sessionId}:${state.turnNumber}`;

  // Check if already processed
  const exists = await redis.exists(operationKey);
  if (exists) {
    return {}; // Already processed, skip
  }

  // Process and mark as complete
  try {
    await Promise.all([
      updateSessionContext(state),
      insertConversationTurn(state),
    ]);
    await redis.setex(operationKey, OPERATION_TTL_SECONDS, "1");
  } catch (error) {
    logError(state.traceId, "memory_update", error);
    // Don't throw - memory update shouldn't block response
  }

  return {};
}
```

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
