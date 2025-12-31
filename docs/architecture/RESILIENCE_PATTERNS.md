# Resilience Patterns

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-30-25 6:00PM PST

> **Constants Reference**: All magic values in this document should map to constants defined in
> `lib/utils/constants.ts`. See [IMPLEMENTATION_SCAFFOLD.md §5.2](IMPLEMENTATION_SCAFFOLD.md#52-configuration--constants)
> for the authoritative constant definitions. When in doubt follow the existing patterns.

---

## 3.1 Circuit Breaker Configuration

> **SOLID Compliance**: This module follows the Dependency Inversion Principle (DIP) by defining an `ICircuitBreaker` interface that high-level modules depend on, rather than concrete implementations.

### 3.1.1 Circuit Breaker Interface (DIP)

```typescript
// lib/resilience/circuit-breaker.ts
import { AGENT_IDS, CIRCUIT_BREAKER } from "../utils/constants";

type CircuitState = "closed" | "open" | "half_open";

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenRequests: number;
}

/**
 * Circuit breaker interface for dependency injection.
 * Enables swapping implementations for testing and alternative backends.
 *
 * @example
 * // Production: Redis-backed circuit breaker
 * const breaker: ICircuitBreaker = new CircuitBreaker("mood_sensor");
 *
 * // Testing: In-memory circuit breaker
 * const breaker: ICircuitBreaker = new InMemoryCircuitBreaker();
 */
export interface ICircuitBreaker {
  allowRequest(): boolean;
  recordSuccess(): void;
  recordFailure(): void;
  getState(): CircuitState;
}

/**
 * Factory function for creating circuit breakers.
 * Abstracts instantiation for dependency injection.
 */
export type CircuitBreakerFactory = (agentId: string) => ICircuitBreaker;

/**
 * Default factory using the standard CircuitBreaker implementation.
 */
export const defaultCircuitBreakerFactory: CircuitBreakerFactory = (agentId) =>
  new CircuitBreaker(agentId);
```

### 3.1.2 Default Implementation

```typescript
// lib/resilience/circuit-breaker.ts (continued)
import { CIRCUIT_BREAKER_OVERRIDES } from "../utils/constants";

/**
 * Build circuit breaker configs by merging defaults with per-agent overrides.
 * Overrides are defined in lib/utils/constants.ts (CIRCUIT_BREAKER_OVERRIDES).
 */
function buildCircuitBreakerConfigs(): Record<string, CircuitBreakerConfig> {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
    recoveryTimeoutMs: CIRCUIT_BREAKER.RESET_TIMEOUT_MS,
    halfOpenRequests: CIRCUIT_BREAKER.HALF_OPEN_MAX_REQUESTS,
  };

  const configs: Record<string, CircuitBreakerConfig> = {};
  for (const agentId of Object.values(AGENT_IDS)) {
    const override = CIRCUIT_BREAKER_OVERRIDES[agentId];
    configs[agentId] = {
      ...defaultConfig,
      ...(override ?? {}),
    };
  }
  return configs;
}

const CIRCUIT_BREAKER_CONFIGS = buildCircuitBreakerConfigs();

/**
 * Production circuit breaker with per-agent configuration.
 * Implements the standard circuit breaker pattern with closed/open/half-open states.
 */
export class CircuitBreaker implements ICircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(private agentId: string) {
    this.config = CIRCUIT_BREAKER_CONFIGS[agentId] ?? {
      failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      recoveryTimeoutMs: CIRCUIT_BREAKER.RESET_TIMEOUT_MS,
      halfOpenRequests: CIRCUIT_BREAKER.HALF_OPEN_MAX_REQUESTS,
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

### 3.1.3 Test Implementation

```typescript
// lib/resilience/circuit-breaker-test.ts

import type { ICircuitBreaker } from "./circuit-breaker";

type CircuitState = "closed" | "open" | "half_open";

/**
 * In-memory circuit breaker for unit testing.
 * Allows explicit state manipulation for test scenarios.
 */
export class InMemoryCircuitBreaker implements ICircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;

  constructor(
    private failureThreshold: number = 3,
    initialState: CircuitState = "closed"
  ) {
    this.state = initialState;
  }

  allowRequest(): boolean {
    return this.state !== "open";
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  // Test helpers
  forceOpen(): void {
    this.state = "open";
  }

  forceClosed(): void {
    this.state = "closed";
    this.failureCount = 0;
  }

  forceHalfOpen(): void {
    this.state = "half_open";
  }
}

/**
 * Always-open circuit breaker for failure testing.
 */
export class AlwaysOpenCircuitBreaker implements ICircuitBreaker {
  allowRequest(): boolean {
    return false;
  }
  recordSuccess(): void {}
  recordFailure(): void {}
  getState(): CircuitState {
    return "open";
  }
}

/**
 * Always-closed circuit breaker for success path testing.
 */
export class AlwaysClosedCircuitBreaker implements ICircuitBreaker {
  allowRequest(): boolean {
    return true;
  }
  recordSuccess(): void {}
  recordFailure(): void {}
  getState(): CircuitState {
    return "closed";
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
import { AGENT_MODELS } from "../ai/models";
import { AGENT_IDS, TOKEN_BUDGETS, TIMEOUTS } from "../utils/constants";

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
      model: anthropic(AGENT_MODELS.RESPONSE_GENERATOR),
      system: systemPrompt,
      prompt: state.userMessage,
      maxTokens: TOKEN_BUDGETS.RESPONSE_GENERATOR,
      abortSignal: AbortSignal.timeout(TIMEOUTS.RESPONSE_GENERATOR),
    });
    return { response: text, modelUsed: AGENT_MODELS.RESPONSE_GENERATOR };
  } catch (error) {
    logFallback(state.traceId, AGENT_IDS.RESPONSE_GENERATOR, 1, String(error));
  }

  // Tier 2: Opus (crisis fallback - severity 4+)
  try {
    const { text } = await generateText({
      model: anthropic(AGENT_MODELS.CRISIS_ESCALATION),
      system: systemPrompt,
      prompt: state.userMessage,
      maxTokens: TOKEN_BUDGETS.CRISIS_RESPONSE,
      abortSignal: AbortSignal.timeout(TIMEOUTS.PIPELINE_TOTAL),
    });
    return { response: text, modelUsed: AGENT_MODELS.CRISIS_ESCALATION };
  } catch (error) {
    logFallback(state.traceId, AGENT_IDS.RESPONSE_GENERATOR, 2, String(error));
  }

  // Tier 3: Template response
  const template = generateTemplateResponse(state);
  logFallback(state.traceId, AGENT_IDS.RESPONSE_GENERATOR, 3, "all_models_failed");
  return { response: template, modelUsed: "template_fallback" };
}
```

---

## 3.4 Timeout Handling

```typescript
// lib/resilience/timeouts.ts
import { MolleiState } from "../pipeline/state";
import { logTimeout } from "../server/monitoring";
import { TIMEOUTS, FALLBACK_EMOTION } from "../utils/constants";

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
  userEmotion: FALLBACK_EMOTION,
});

export const moodSensorWithTimeout = withTimeout(TIMEOUTS.MOOD_SENSOR, neutralEmotionFallback);
```

---

## 3.5 Idempotency

```typescript
// lib/resilience/idempotency.ts
import { Redis } from "ioredis";
import { MolleiState } from "../pipeline/state";
import { updateSessionContext, insertConversationTurn } from "../db/repositories";
import { logError } from "../server/monitoring";
import { IDEMPOTENCY } from "../utils/constants";

const redis = new Redis(process.env.REDIS_URL!);

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
    await redis.setex(operationKey, IDEMPOTENCY.OPERATION_TTL_SECONDS, "1");
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
