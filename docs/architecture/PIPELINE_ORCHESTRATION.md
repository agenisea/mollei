# Pipeline Orchestration

> **Parent**: [ARCHITECTURE_BLUEPRINT.md](../ARCHITECTURE_BLUEPRINT.md)
> **Tier**: 2 — Implementation
> **Last Updated**: 12-30-25 7:00PM PST

> **Constants Reference**: All magic values in this document should map to constants defined in
> `lib/utils/constants.ts`. See [IMPLEMENTATION_SCAFFOLD.md §5.2](IMPLEMENTATION_SCAFFOLD.md#52-configuration--constants)
> for the authoritative constant definitions. When in doubt follow the existing patterns.

---

## 2.1 Pattern Taxonomy (Microsoft AI Agent Design Patterns)

Mollei uses a **hybrid multi-pattern orchestration** combining several Microsoft patterns:

| Microsoft Pattern | Mollei Usage | Agents |
|-------------------|-------------|--------|
| **Concurrent** | Parallel analysis | mood_sensor, memory_agent, safety_monitor |
| **Sequential** | Linear refinement | emotion_reasoner → response_generator |
| **Handoff** | Crisis escalation | safety_monitor → crisis_response → human |
| **Maker-Checker** | Safety validation | safety_monitor (checker) validates response |

## 2.2 Execution Pattern: Hybrid Sequential-Parallel

```
START
  │
  ├──────────────────┬──────────────────┐
  │  [CONCURRENT]    │  [CONCURRENT]    │  [CONCURRENT]
  ▼                  ▼                  ▼
mood_sensor    memory_agent      safety_monitor
  │                  │                  │
  └──────────────────┴──────────────────┘
                     │
            [SYNCHRONIZATION BARRIER]
                     │
                     ▼
             emotion_reasoner
                     │
                     ▼
            ┌────────────────────┐
            │ CONDITIONAL EDGE   │
            │ if crisis_detected │
            │   severity >= 4    │
            └────────────────────┘
                 │         │
            [True]     [False]
                 │         │
                 ▼         ▼
        crisis_response   response_generator
                 │         │
                 └────┬────┘
                      │
                      ▼
           [MAKER-CHECKER LOOP]
           safety_validator (if crisis)
                      │
                      ▼
              memory_update
                      │
                      ▼
            ┌───────────────────┐
            │ HANDOFF CHECK     │
            │ escalation_needed?│
            └───────────────────┘
                 │         │
            [True]     [False]
                 │         │
                 ▼         ▼
          human_escalation  END
```

## 2.3 State Schema (Zod-Based, Framework-Agnostic)

> **Pattern**: Uses Zod for runtime validation with full TypeScript inference. No LangChain/LangGraph dependency.

```typescript
// lib/pipeline/mollei-state.ts
import { z } from 'zod'

/**
 * Emotion state from mood_sensor
 */
export const EmotionStateSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  intensity: z.number().min(0).max(1),      // 0-1
  valence: z.number().min(-1).max(1),       // -1 to 1
  signals: z.array(z.string()),
  ambiguityNotes: z.string().nullable(),    // Explanation when signals are mixed/unclear
})

/**
 * Mollei's emotional response from emotion_reasoner
 */
export const MolleiEmotionSchema = z.object({
  primary: z.string(),
  energy: z.number().min(0).max(1),         // 0-1
  approach: z.enum(['validate', 'explore', 'support', 'gentle_redirect', 'crisis_support']),
  toneModifiers: z.array(z.string()),
  presenceQuality: z.enum(['grounding', 'warm', 'gentle', 'energizing', 'holding']),
})

/**
 * Complete pipeline state (Zod schema with TypeScript inference)
 * Passed between pipeline stages, accumulated through execution
 */
export const MolleiStateSchema = z.object({
  // Input
  sessionId: z.string(),
  userId: z.string(),
  userMessage: z.string(),
  turnNumber: z.number(),

  // Agent outputs (accumulated through pipeline)
  userEmotion: EmotionStateSchema.nullable(),
  contextSummary: z.string(),
  callbackOpportunities: z.array(z.string()),
  recurringThemes: z.array(z.string()),
  relationshipStage: z.enum(['new', 'building', 'established']),
  emotionalTrajectory: z.enum(['improving', 'stable', 'declining', 'unknown']),

  crisisDetected: z.boolean(),
  crisisSeverity: z.number().min(1).max(5),
  crisisSignalType: z.string(),
  crisisConfidence: z.number().min(0).max(1),         // Safety quality gate
  crisisKeyPhrases: z.array(z.string()),              // Phrases that triggered detection
  humanConnectionNeeded: z.boolean(),                 // Flag for human support recommendation
  suggestedResponseModifier: z.enum(['none', 'include_safety_check', 'warm_validation_first', 'gentle_resources']),
  ambiguousSafetySignals: z.array(z.string()),        // Unclear crisis indicators

  molleiEmotion: MolleiEmotionSchema.nullable(),

  // Final output
  response: z.string(),
  resourcesAppended: z.boolean(),

  // Self-correction state
  safetyAttempts: z.number(),                          // Retry counter for safety recheck
  responseAttempts: z.number(),                        // Retry counter for response generation
  retryFeedback: z.object({                            // Unified feedback for retry attempts
    empathyGaps: z.array(z.string()).optional(),       // "Response was too solution-focused"
    missedCues: z.array(z.string()).optional(),        // "Didn't acknowledge grief signal"
    toneIssues: z.array(z.string()).optional(),        // "Energy too high for exhausted user"
    groundednessIssues: z.array(z.string()).optional(),// "Made assumption not in context"
  }).nullable(),
  emotionConfidence: z.number().min(0).max(1),         // Input quality for adaptive threshold
  inputAmbiguous: z.boolean(),                         // Flag for unclear emotional signals

  // Observability
  latencyMs: z.record(z.number()),
  agentErrors: z.array(z.string()),
  modelUsed: z.string(),
})

// TypeScript types inferred from Zod schemas
export type MolleiState = z.infer<typeof MolleiStateSchema>
export type EmotionState = z.infer<typeof EmotionStateSchema>
export type MolleiEmotion = z.infer<typeof MolleiEmotionSchema>

/**
 * Create initial state for a new conversation turn
 */
export function createInitialState(
  sessionId: string,
  userId: string,
  userMessage: string,
  turnNumber: number
): MolleiState {
  return {
    sessionId,
    userId,
    userMessage,
    turnNumber,
    userEmotion: null,
    contextSummary: '',
    callbackOpportunities: [],
    recurringThemes: [],
    relationshipStage: 'new',
    emotionalTrajectory: 'unknown',
    crisisDetected: false,
    crisisSeverity: 1,
    crisisSignalType: 'none',
    crisisConfidence: 0,
    crisisKeyPhrases: [],
    humanConnectionNeeded: false,
    suggestedResponseModifier: 'none',
    ambiguousSafetySignals: [],
    molleiEmotion: null,
    response: '',
    resourcesAppended: false,
    // Self-correction state (reset each turn)
    safetyAttempts: 0,
    responseAttempts: 0,
    retryFeedback: null,
    emotionConfidence: 0,
    inputAmbiguous: false,
    latencyMs: {},
    agentErrors: [],
    modelUsed: '',
  }
}
```

## 2.4 Pipeline Orchestrator

> **Pattern**: Framework-agnostic orchestration supporting sequential, parallel, and conditional execution without LangGraph dependency.

### 2.4.1 Core Pipeline Types

```typescript
// lib/pipeline/pipeline-types.ts
import type { TraceId } from '@/lib/infrastructure/trace'

/**
 * Generic pipeline module interface
 * Each agent transforms input to output with access to shared context.
 */
export interface PipelineModule<TInput = unknown, TOutput = unknown> {
  execute(input: TInput, context: PipelineContext): Promise<TOutput>
}

/**
 * Request-scoped pipeline context
 *
 * ⚠️ NEVER store in global state - each request gets a fresh instance.
 * See OBSERVABILITY.md §6A.3 for authoritative definition.
 */
export interface PipelineContext {
  // Identity (required)
  traceId: TraceId
  sessionId: string
  userId: string
  turnNumber: number

  // Request-scoped resources (NOT shared across requests)
  budgetTracker: TokenBudgetTracker
  llmLimiter: LLMLimiterContext

  // Cancellation and streaming
  abortSignal?: AbortSignal
  onProgress?: (phase: string, data?: unknown) => void
}

/**
 * Factory for creating request-scoped pipeline context.
 * Creates fresh TraceId and initializes per-request resources.
 */
export function createPipelineContext(params: {
  sessionId: string
  userId: string
  turnNumber: number
  tokenBudget?: number
  llmConcurrency?: number
  abortSignal?: AbortSignal
  onProgress?: (phase: string, data?: unknown) => void
}): PipelineContext {
  return {
    traceId: createTraceId(TRACE_SCOPE.TURN),
    sessionId: params.sessionId,
    userId: params.userId,
    turnNumber: params.turnNumber,
    budgetTracker: new TokenBudgetTracker(params.tokenBudget ?? TOKEN_BUDGETS.REQUEST_TOTAL),
    llmLimiter: createLLMLimiterContext(params.llmConcurrency ?? LLM_CONCURRENCY_LIMIT),
    abortSignal: params.abortSignal,
    onProgress: params.onProgress,
  }
}

/**
 * Pipeline execution result with metadata
 */
export interface PipelineResult<TOutput = unknown> {
  output: TOutput
  meta: {
    traceId: TraceId
    durationMs: number
    stagesCompleted: string[]
    fromCache?: boolean
  }
}
```

### 2.4.2 Pipeline Orchestrator Functions

```typescript
// lib/pipeline/pipeline-orchestrator.ts
import type { PipelineModule, PipelineContext, PipelineResult } from './pipeline-types'

/**
 * Execute a sequential pipeline of modules
 * Each module receives the output of the previous module as input.
 */
export async function runSequentialPipeline<TInput, TOutput>(
  modules: PipelineModule[],
  initialInput: TInput,
  context: PipelineContext
): Promise<PipelineResult<TOutput>> {
  const startTime = Date.now()
  const stagesCompleted: string[] = []
  let currentInput: unknown = initialInput

  for (const [index, module] of modules.entries()) {
    if (context.abortSignal?.aborted) {
      throw new Error('Pipeline cancelled by abort signal')
    }

    const stageName = module.constructor.name || `Stage${index + 1}`
    const stageResult = await module.execute(currentInput, context)
    currentInput = stageResult
    stagesCompleted.push(stageName)
  }

  return {
    output: currentInput as TOutput,
    meta: {
      traceId: context.traceId,
      durationMs: Date.now() - startTime,
      stagesCompleted,
    },
  }
}

/**
 * Execute multiple modules in parallel with synchronization barrier
 * All modules receive the same input and execute concurrently.
 * Returns results in same order as input modules.
 */
export async function runParallelModules<TInput>(
  modules: PipelineModule<TInput>[],
  input: TInput,
  context: PipelineContext,
  timeoutMs: number = 500 // Mollei: 0.5s barrier for parallel phase
): Promise<unknown[]> {
  const promises = modules.map(async (module) => {
    return Promise.race([
      module.execute(input, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Parallel stage timeout')), timeoutMs)
      ),
    ])
  })

  // Use allSettled for graceful degradation
  return await Promise.allSettled(promises).then((results) =>
    results.map((r) => (r.status === 'fulfilled' ? r.value : null))
  )
}

/**
 * Execute modules with conditional routing
 * Runs condition functions to determine which module to execute.
 */
export async function runConditionalPipeline<TInput, TOutput>(
  input: TInput,
  context: PipelineContext,
  routes: Array<{
    condition: (input: TInput, context: PipelineContext) => boolean | Promise<boolean>
    module: PipelineModule<TInput, TOutput>
  }>
): Promise<TOutput> {
  for (const route of routes) {
    if (await route.condition(input, context)) {
      return await route.module.execute(input, context)
    }
  }
  throw new Error('No matching route found in conditional pipeline')
}
```

### 2.4.3 Mollei Pipeline Graph

```typescript
// lib/pipeline/mollei-graph.ts
import { runSequentialPipeline, runParallelModules, runConditionalPipeline } from './pipeline-orchestrator'
import type { PipelineContext, PipelineResult } from './pipeline-types'
import type { MolleiState } from './mollei-state'
import { createInitialState } from './mollei-state'
import { createTraceId, traceRunStart, traceRunEnd, traceStage } from '@/lib/infrastructure/trace'

// Agent modules (implement PipelineModule interface)
import { MoodSensorModule } from '@/lib/agents/mood-sensor'
import { MemoryAgentModule } from '@/lib/agents/memory-agent'
import { SafetyMonitorModule } from '@/lib/agents/safety-monitor'
import { EmotionReasonerModule } from '@/lib/agents/emotion-reasoner'
import { ResponseGeneratorModule } from '@/lib/agents/response-generator'
import { CrisisResponseModule } from '@/lib/agents/crisis-response'
import { MemoryUpdateModule } from '@/lib/agents/memory-update'

/**
 * Execute the complete Mollei conversation pipeline
 *
 * Pattern: Hybrid Sequential-Parallel (same topology as original design)
 *
 * Phase 1: Parallel analysis (mood_sensor, memory_agent, safety_monitor) - 0.5s barrier
 * Phase 2: Sequential reasoning (emotion_reasoner) - 0.5s
 * Phase 3: Conditional response (crisis_response OR response_generator) - 1.5s
 * Phase 4: Memory update (async, non-blocking)
 */
export async function runMolleiPipeline(
  sessionId: string,
  userId: string,
  userMessage: string,
  turnNumber: number,
  abortSignal?: AbortSignal
): Promise<PipelineResult<MolleiState>> {
  const traceId = createTraceId('ml_turn')
  const startTime = Date.now()
  const stagesCompleted: string[] = []

  const context: PipelineContext = {
    traceId,
    sessionId,
    userId,
    abortSignal,
  }

  let state = createInitialState(sessionId, userId, userMessage, turnNumber)

  traceRunStart(traceId, { sessionId, turnNumber })

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: PARALLEL ANALYSIS (0.5s synchronization barrier)
    // ═══════════════════════════════════════════════════════════════════════
    traceStage(traceId, 'parallel_analysis', 'start')

    const [moodResult, memoryResult, safetyResult] = await runParallelModules(
      [
        new MoodSensorModule(),
        new MemoryAgentModule(),
        new SafetyMonitorModule(),
      ],
      state,
      context,
      500 // 0.5s synchronization barrier
    )

    // Merge parallel results into state (graceful degradation if null)
    if (moodResult) state = { ...state, ...moodResult }
    if (memoryResult) state = { ...state, ...memoryResult }
    if (safetyResult) state = { ...state, ...safetyResult }

    stagesCompleted.push(AGENT_IDS.MOOD_SENSOR, AGENT_IDS.MEMORY_AGENT, AGENT_IDS.SAFETY_MONITOR)
    traceStage(traceId, 'parallel_analysis', 'complete', Date.now() - startTime)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1B: SAFETY QUALITY GATE (self-correction loop)
    // ═══════════════════════════════════════════════════════════════════════
    while (shouldRecheckSafety(state)) {
      traceStage(traceId, 'recheck_safety', 'start')
      const recheckResult = await recheckSafety(state, context)
      state = { ...state, ...recheckResult }
      stagesCompleted.push('recheck_safety')
      traceStage(traceId, 'recheck_safety', 'complete')
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: SEQUENTIAL REASONING
    // ═══════════════════════════════════════════════════════════════════════
    traceStage(traceId, AGENT_IDS.EMOTION_REASONER, 'start')

    const emotionResult = await new EmotionReasonerModule().execute(state, context)
    state = { ...state, ...emotionResult }
    stagesCompleted.push(AGENT_IDS.EMOTION_REASONER)

    traceStage(traceId, AGENT_IDS.EMOTION_REASONER, 'complete')

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: CONDITIONAL RESPONSE (quality-gated crisis routing)
    // ═══════════════════════════════════════════════════════════════════════
    const routeDecision = routeAfterSafetyMonitor(state)
    const isCrisis = routeDecision === 'crisis_response'

    traceStage(traceId, isCrisis ? 'crisis_response' : AGENT_IDS.RESPONSE_GENERATOR, 'start')

    if (isCrisis) {
      const crisisResult = await new CrisisResponseModule().execute(state, context)
      state = { ...state, ...crisisResult }
      stagesCompleted.push('crisis_response')
    } else {
      state = await generateResponseWithRetry(state, context)
      stagesCompleted.push(AGENT_IDS.RESPONSE_GENERATOR)
      if (state.responseAttempts > 0) {
        stagesCompleted.push(`response_retry_${state.responseAttempts}`)
      }
    }

    traceStage(traceId, isCrisis ? 'crisis_response' : AGENT_IDS.RESPONSE_GENERATOR, 'complete')

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: MEMORY UPDATE (async, non-blocking for response delivery)
    // ═══════════════════════════════════════════════════════════════════════
    new MemoryUpdateModule().execute(state, context).catch((err) => {
      console.error('[mollei] Memory update failed:', err)
    })

    const durationMs = Date.now() - startTime
    traceRunEnd(traceId, { durationMs, stagesCompleted, success: true })

    return {
      output: state,
      meta: {
        traceId,
        durationMs,
        stagesCompleted,
      },
    }
  } catch (error) {
    traceRunEnd(traceId, { success: false, error: String(error) })
    throw error
  }
}
```

## 2.5 Timing Budget

| Phase | Agents | Max Time | Notes |
|-------|--------|----------|-------|
| Phase 1 (Parallel) | mood_sensor, memory_agent, safety_monitor | 0.5s | Haiku 4.5, bounded by slowest |
| Phase 2 (Sequential) | emotion_reasoner | 0.5s | Haiku 4.5, waits for Phase 1 |
| Phase 3 (Sequential) | response_generator | 1.5s | Sonnet 4.5 with streaming (TTFT <1s) |
| Phase 4 (Sequential) | memory_update | 0.3s | Async, non-blocking for response |
| **Total** | | **<3s P95** | TTFT <1s with streaming |

## 2.6 Self-Correction Patterns

> **Pattern**: Quality-driven conditional routing with self-correction loops. Prevents confidently-wrong outputs from low-confidence analysis.

### 2.6.1 Quality-Gated Safety Routing

```typescript
// lib/pipeline/routing.ts
import {
  AGENT_IDS,
  CRISIS_SEVERITY,
  QUALITY_THRESHOLDS,
  RETRY_LIMITS,
} from "../utils/constants";

/**
 * Route after safety_monitor based on confidence and severity
 *
 * Key insight: Binary crisis/non-crisis ignores uncertainty.
 * Low-confidence elevated severity should trigger recheck with more context.
 */
export function routeAfterSafetyMonitor(state: MolleiState): string {
  const { crisisDetected, crisisConfidence, crisisSeverity, safetyAttempts } = state

  // High confidence crisis → immediate crisis response
  if (crisisDetected && crisisConfidence >= QUALITY_THRESHOLDS.CRISIS_CONFIDENCE_HIGH) {
    return 'crisis_response'
  }

  // Low confidence but elevated severity → recheck with conversation history
  if (
    crisisSeverity >= CRISIS_SEVERITY.SUGGEST_HUMAN &&
    crisisConfidence < QUALITY_THRESHOLDS.CRISIS_CONFIDENCE_RECHECK &&
    safetyAttempts < RETRY_LIMITS.SAFETY_ATTEMPTS
  ) {
    return 'recheck_safety'
  }

  // Ambiguous signals that need more context
  if (state.ambiguousSafetySignals.length > 0 && safetyAttempts < RETRY_LIMITS.SAFETY_ATTEMPTS - 1) {
    return 'recheck_safety'
  }

  // Clear non-crisis or max attempts reached
  return AGENT_IDS.EMOTION_REASONER
}

/**
 * Recheck safety with expanded context
 * Called when initial analysis had low confidence but concerning signals
 */
export async function recheckSafety(
  state: MolleiState,
  context: PipelineContext
): Promise<Partial<MolleiState>> {
  const expandedPrompt = buildSafetyPromptWithHistory(
    state.userMessage,
    state.contextSummary,
    state.ambiguousSafetySignals
  )

  const result = await new SafetyMonitorModule().executeWithContext(
    expandedPrompt,
    context
  )

  return {
    ...result,
    safetyAttempts: state.safetyAttempts + 1,
  }
}
```

### 2.6.2 Unified Retry Feedback for Response Generation

```typescript
// lib/pipeline/response-evaluator.ts
import { QUALITY_THRESHOLDS } from "../utils/constants";

interface RetryFeedback {
  empathyGaps?: string[]       // "User expressed grief, response was too solution-focused"
  missedCues?: string[]        // "Didn't acknowledge 'I feel so alone'"
  toneIssues?: string[]        // "Energy too high for user's exhausted state"
  groundednessIssues?: string[] // "Made assumption not in context"
}

/**
 * Evaluate response quality and generate structured feedback
 * Returns null if response is acceptable, feedback object if retry needed
 */
export async function evaluateResponseQuality(
  state: MolleiState,
  context: PipelineContext
): Promise<RetryFeedback | null> {
  const { userEmotion, molleiEmotion, response, emotionConfidence, inputAmbiguous } = state

  // Adaptive threshold: lower bar when input was unclear
  const qualityThreshold = (emotionConfidence < 0.6 || inputAmbiguous)
    ? QUALITY_THRESHOLDS.RESPONSE_LOW    // Lower bar - input was unclear
    : QUALITY_THRESHOLDS.RESPONSE_NORMAL // Normal bar - input was clear

  const evaluation = await evaluateWithLLM({
    userEmotion,
    molleiEmotion,
    response,
    userMessage: state.userMessage,
  })

  if (evaluation.qualityScore >= qualityThreshold) {
    return null // Response is good enough
  }

  // Build specific feedback for retry
  const feedback: RetryFeedback = {}

  if (evaluation.empathyScore < QUALITY_THRESHOLDS.EMPATHY_MIN) {
    feedback.empathyGaps = evaluation.empathyIssues
  }
  if (evaluation.missedEmotionalCues.length > 0) {
    feedback.missedCues = evaluation.missedEmotionalCues
  }
  if (evaluation.toneAlignment < QUALITY_THRESHOLDS.TONE_ALIGNMENT_MIN) {
    feedback.toneIssues = evaluation.toneProblems
  }
  if (evaluation.groundedness < QUALITY_THRESHOLDS.GROUNDEDNESS_MIN) {
    feedback.groundednessIssues = evaluation.unsupportedClaims
  }

  return feedback
}

/**
 * Build response prompt with retry feedback
 * Gives the model clear, actionable guidance vs. generic "try again"
 */
export function buildPromptWithFeedback(
  basePrompt: string,
  feedback: RetryFeedback | null
): string {
  if (!feedback) return basePrompt

  const feedbackLines: string[] = ['FEEDBACK ON PREVIOUS ATTEMPT:']

  if (feedback.empathyGaps?.length) {
    feedbackLines.push(`- Empathy gaps: ${feedback.empathyGaps.join('; ')}`)
  }
  if (feedback.missedCues?.length) {
    feedbackLines.push(`- Missed emotional cues: ${feedback.missedCues.join('; ')}`)
  }
  if (feedback.toneIssues?.length) {
    feedbackLines.push(`- Tone issues: ${feedback.toneIssues.join('; ')}`)
  }
  if (feedback.groundednessIssues?.length) {
    feedbackLines.push(`- Unsupported statements: ${feedback.groundednessIssues.join('; ')}`)
  }

  return `${basePrompt}\n\n${feedbackLines.join('\n')}`
}
```

### 2.6.3 Response Generation with Self-Correction Loop

```typescript
// lib/pipeline/response-generator-with-retry.ts
import { RETRY_LIMITS } from "../utils/constants";

/**
 * Generate response with self-correction loop
 */
export async function generateResponseWithRetry(
  state: MolleiState,
  context: PipelineContext
): Promise<MolleiState> {
  let currentState = state

  while (currentState.responseAttempts < RETRY_LIMITS.RESPONSE_ATTEMPTS) {
    const response = await new ResponseGeneratorModule().execute(
      currentState,
      context
    )
    currentState = { ...currentState, ...response }

    const feedback = await evaluateResponseQuality(currentState, context)

    if (!feedback) {
      return currentState
    }

    currentState = {
      ...currentState,
      retryFeedback: feedback,
      responseAttempts: currentState.responseAttempts + 1,
    }

    context.onProgress?.('response_retry', {
      attempt: currentState.responseAttempts,
      feedback,
    })
  }

  return currentState
}
```

### 2.6.4 Adaptive Quality Thresholds

```typescript
// lib/pipeline/quality-thresholds.ts
import { QUALITY_THRESHOLDS, RETRY_LIMITS, CRISIS_SEVERITY } from "../utils/constants";

/**
 * Adjust quality expectations based on input quality
 *
 * Key insight: Expecting perfect responses from ambiguous input causes
 * infinite retry loops. Lower the bar when input is unclear.
 */
export function getResponseQualityThreshold(state: MolleiState): number {
  const { emotionConfidence, inputAmbiguous, userEmotion } = state

  let threshold = QUALITY_THRESHOLDS.RESPONSE_NORMAL

  if (emotionConfidence < 0.6) {
    threshold -= QUALITY_THRESHOLDS.LOW_CONFIDENCE_PENALTY
  }

  if (inputAmbiguous) {
    threshold -= QUALITY_THRESHOLDS.AMBIGUOUS_INPUT_PENALTY
  }

  if (userEmotion?.secondary && userEmotion.intensity > 0.5) {
    threshold -= QUALITY_THRESHOLDS.MIXED_EMOTION_PENALTY
  }

  return Math.max(threshold, QUALITY_THRESHOLDS.RESPONSE_FLOOR)
}

/**
 * Determine if safety recheck is warranted
 */
export function shouldRecheckSafety(state: MolleiState): boolean {
  const { crisisConfidence, crisisSeverity, safetyAttempts, ambiguousSafetySignals } = state

  if (safetyAttempts >= RETRY_LIMITS.SAFETY_ATTEMPTS) return false
  if (crisisSeverity >= CRISIS_SEVERITY.SUGGEST_HUMAN && crisisConfidence < QUALITY_THRESHOLDS.CRISIS_CONFIDENCE_RECHECK) return true
  if (ambiguousSafetySignals.length > 0) return true

  return false
}
```

## 2.7 Performance Optimization Patterns

### 2.7.1 Pluggable Backend Protocol

```typescript
// lib/backends/emotion-backend.ts

/**
 * Pluggable Emotion Detection Backend
 *
 * Enables:
 * - Local model for development (faster, no API costs)
 * - Claude for production (higher quality)
 * - Easy A/B testing of different emotion models
 */
export interface EmotionBackend {
  analyze(text: string): Promise<EmotionResult>
  readonly name: string
}

export interface EmotionResult {
  primary: string
  secondary?: string
  intensity: number      // 0-1
  valence: number        // -1 to 1
  confidence: number     // 0-1
  signals: string[]
}

/**
 * Claude-based emotion detection (production)
 * Higher quality, ~500ms latency, API costs
 */
export class ClaudeEmotionBackend implements EmotionBackend {
  readonly name = 'claude'

  async analyze(text: string): Promise<EmotionResult> {
    const response = await generateObject({
      model: anthropic(AGENT_MODELS.MOOD_SENSOR),
      schema: EmotionResultSchema,
      prompt: buildEmotionPrompt(text),
    })
    return { ...response.object, confidence: 0.9 }
  }
}

/**
 * Local sentiment model (development)
 * Lower quality, <50ms latency, no API costs
 */
export class LocalEmotionBackend implements EmotionBackend {
  readonly name = 'local'
  private model: SentimentModel

  constructor() {
    // Use a lightweight sentiment model (e.g., transformers.js, onnx)
    this.model = loadLocalSentimentModel()
  }

  async analyze(text: string): Promise<EmotionResult> {
    const sentiment = await this.model.predict(text)

    return {
      primary: sentiment.label,
      intensity: Math.abs(sentiment.score),
      valence: sentiment.score,
      confidence: sentiment.confidence,
      signals: [],
    }
  }
}

/**
 * Factory function - select backend via environment variable
 */
export function createEmotionBackend(): EmotionBackend {
  const backend = process.env.EMOTION_BACKEND ?? 'claude'

  switch (backend) {
    case 'local':
      return new LocalEmotionBackend()
    case 'claude':
    default:
      return new ClaudeEmotionBackend()
  }
}
```

### 2.7.2 Two-Stage Emotion Analysis

```typescript
// lib/pipeline/two-stage-emotion.ts
import { TWO_STAGE } from "../utils/constants";

interface TwoStageConfig {
  confidenceThreshold: number
  severityThreshold: number
}

const DEFAULT_CONFIG: TwoStageConfig = {
  confidenceThreshold: TWO_STAGE.CONFIDENCE_THRESHOLD,
  severityThreshold: TWO_STAGE.SEVERITY_THRESHOLD,
}

/**
 * Two-Stage Emotion Analysis
 *
 * Stage 1: Fast local sentiment (< 50ms)
 * Stage 2: Deep LLM analysis (only if needed)
 *
 * Cost impact: Skip 70%+ of LLM emotion calls for clear-cut messages
 */
export async function analyzeEmotionTwoStage(
  text: string,
  context: PipelineContext,
  config: TwoStageConfig = DEFAULT_CONFIG
): Promise<EmotionResult & { stage: 'local' | 'llm' }> {
  const localBackend = new LocalEmotionBackend()
  const llmBackend = new ClaudeEmotionBackend()

  // Stage 1: Fast local analysis
  const quickResult = await localBackend.analyze(text)

  context.onProgress?.('emotion_stage1', {
    backend: 'local',
    confidence: quickResult.confidence,
    latencyMs: performance.now(),
  })

  const needsLLM =
    quickResult.confidence < config.confidenceThreshold ||
    quickResult.intensity > config.severityThreshold / 5 ||
    containsCrisisKeywords(text)

  if (!needsLLM) {
    return { ...quickResult, stage: 'local' }
  }

  // Stage 2: Deep LLM analysis
  const deepResult = await llmBackend.analyze(text)

  context.onProgress?.('emotion_stage2', {
    backend: 'llm',
    reason: quickResult.confidence < config.confidenceThreshold
      ? 'low_confidence'
      : 'high_severity',
  })

  return { ...deepResult, stage: 'llm' }
}

/**
 * Quick keyword check for crisis signals
 * Ensures LLM always handles potentially dangerous content
 */
function containsCrisisKeywords(text: string): boolean {
  const crisisPatterns = [
    /\b(suicide|suicidal|kill myself|end it all)\b/i,
    /\b(self.?harm|cutting|hurt myself)\b/i,
    /\b(don'?t want to (live|be here|exist))\b/i,
    /\b(no reason to live|better off dead)\b/i,
  ]
  return crisisPatterns.some(pattern => pattern.test(text))
}
```

### 2.7.3 Performance Impact

| Scenario | Without Two-Stage | With Two-Stage | Savings |
|----------|-------------------|----------------|---------|
| Clear positive ("I'm so happy today!") | ~500ms LLM | ~50ms local | 90% |
| Clear negative ("I'm frustrated") | ~500ms LLM | ~50ms local | 90% |
| Ambiguous ("I don't know how I feel") | ~500ms LLM | ~550ms (both) | -10% |
| Crisis signal ("I want to disappear") | ~500ms LLM | ~550ms (both) | Safety first |
| **Weighted Average** (70% clear, 20% ambiguous, 10% crisis) | 500ms | ~195ms | **61%** |

**Cost Projection** (assuming $0.25/1K tokens for Haiku):
- 10,000 daily conversations: ~$2.50/day → ~$0.75/day (70% savings)
- LLM reserved for cases that need it

---

## 6D. Microsoft AI Agent Design Patterns

> **Reference**: [Azure Architecture Center - AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

### 6D.1 Pattern Selection Matrix

| Scenario in Mollei | Selected Pattern | Rationale |
|-------------------|------------------|-----------|
| Parallel emotion/memory/safety analysis | **Concurrent** | Independent perspectives, no data handoff needed |
| emotion_reasoner → response_generator | **Sequential** | Clear dependency, progressive refinement |
| Crisis detection → human escalation | **Handoff** | Dynamic routing based on capability limits |
| Response validation in crisis | **Maker-Checker** | Quality gate before user sees message |
| Normal conversation flow | **Sequential + Concurrent** | Hybrid for latency optimization |

### 6D.2 Maker-Checker Pattern (Crisis Response Validation)

```typescript
// lib/agents/safety-validator.ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { MolleiState } from "../pipeline/state";
import { PipelineContext } from "../pipeline/context";
import { traceAgentStage } from "../infrastructure/trace";
import { MODELS } from "../ai/models";
import { TOKEN_BUDGETS, RETRY_LIMITS } from "../utils/constants";

const ValidationSchema = z.object({
  approved: z.boolean(),
  issues: z.array(z.object({
    category: z.enum([
      "missing_resources",
      "minimizing_feelings",
      "unsafe_advice",
      "tone_inappropriate",
      "false_promises",
    ]),
    severity: z.enum(["minor", "major", "critical"]),
    description: z.string(),
    suggestedFix: z.string(),
  })),
  revisedResponse: z.string().optional(),
});

const SAFETY_VALIDATOR_PROMPT = `You are a crisis response validator for an emotional AI companion.

Your job is to validate that crisis responses are:
1. Safe - No harmful advice or minimizing language
2. Supportive - Validates user's feelings, doesn't dismiss
3. Resourced - Includes crisis hotline information (988, etc.)
4. Appropriate - Tone matches crisis severity
5. Non-committal - No promises of outcomes ("everything will be okay")

Review the response and identify any issues. For critical issues, provide a revised response.`;

interface MakerCheckerResult {
  state: MolleiState;
  iterations: number;
  finalApproved: boolean;
}

/**
 * Run maker-checker validation loop for crisis responses
 * Validates and iteratively improves responses until approval or max iterations
 */
export async function runMakerCheckerLoop(
  state: MolleiState,
  ctx: PipelineContext
): Promise<MakerCheckerResult> {
  let currentState = state;
  let iteration = 0;
  let approved = false;

  while (!approved && iteration < RETRY_LIMITS.MAKER_CHECKER_ITERATIONS) {
    iteration++;
    const start = performance.now();

    const { object: validation, usage } = await generateObject({
      model: anthropic(AGENT_MODELS.SAFETY_MONITOR),
      schema: ValidationSchema,
      system: SAFETY_VALIDATOR_PROMPT,
      prompt: JSON.stringify({
        crisisSeverity: currentState.crisisSeverity,
        userMessage: currentState.userMessage,
        proposedResponse: currentState.response,
      }),
      maxTokens: TOKEN_BUDGETS.SAFETY_MONITOR,
    });

    ctx.budgetTracker.record(usage.totalTokens);

    traceAgentStage(ctx.traceId, "safety_validator", "check", performance.now() - start, {
      iteration,
      approved: validation.approved,
      issueCount: validation.issues.length,
      criticalIssues: validation.issues.filter(i => i.severity === "critical").length,
    });

    if (validation.approved) {
      approved = true;
    } else if (validation.revisedResponse) {
      currentState = {
        ...currentState,
        response: validation.revisedResponse,
      };
    } else if (validation.issues.length > 0) {
      currentState = await reviseResponse(currentState, validation.issues, ctx);
    }
  }

  return {
    state: currentState,
    iterations: iteration,
    finalApproved: approved,
  };
}

async function reviseResponse(
  state: MolleiState,
  issues: z.infer<typeof ValidationSchema>["issues"],
  ctx: PipelineContext
): Promise<MolleiState> {
  // Call response_generator with revision instructions
  const revisionPrompt = issues.map(i =>
    `- ${i.category}: ${i.description}. Fix: ${i.suggestedFix}`
  ).join("\n");

  // Re-invoke response generator with feedback
  // Implementation depends on response_generator structure
  return state; // Placeholder - actual implementation would call maker
}
```

### 6D.3 Handoff Pattern (Human Escalation)

```typescript
// lib/agents/handoff-manager.ts
import { MolleiState } from "../pipeline/state";
import { PipelineContext } from "../pipeline/context";
import { logMonitoring } from "../server/monitoring";

interface HandoffDecision {
  shouldHandoff: boolean;
  targetAgent: "human" | "specialist" | null;
  reason: HandoffReason;
  urgency: "immediate" | "standard" | "low";
  context: HandoffContext;
}

type HandoffReason =
  | "crisis_severity_5"
  | "repeated_crisis"
  | "user_requested"
  | "capability_limit"
  | "maker_checker_failed"
  | "none";

/**
 * Evaluate whether to hand off to human support
 * Returns handoff decision with target, reason, and urgency
 */
export function evaluateHandoff(
  state: MolleiState,
  ctx: PipelineContext
): HandoffDecision {
  // Immediate handoff: severity 5 (active danger)
  if (state.crisisSeverity === 5) {
    return {
      shouldHandoff: true,
      targetAgent: "human",
      reason: "crisis_severity_5",
      urgency: "immediate",
      context: buildHandoffContext(state),
    };
  }

  // Repeated crisis: 3+ in same session
  const crisisCount = state.crisisHistory?.filter(c => c.severity >= 4).length ?? 0;
  if (crisisCount >= 3) {
    return {
      shouldHandoff: true,
      targetAgent: "human",
      reason: "repeated_crisis",
      urgency: "standard",
      context: buildHandoffContext(state),
    };
  }

  // Maker-checker exhausted
  if (state.makerCheckerFailed) {
    return {
      shouldHandoff: true,
      targetAgent: "human",
      reason: "maker_checker_failed",
      urgency: "standard",
      context: buildHandoffContext(state),
    };
  }

  // User explicit request
  if (detectHumanRequest(state.userMessage)) {
    return {
      shouldHandoff: true,
      targetAgent: "human",
      reason: "user_requested",
      urgency: "low",
      context: buildHandoffContext(state),
    };
  }

  return {
    shouldHandoff: false,
    targetAgent: null,
    reason: "none",
    urgency: "low",
    context: buildHandoffContext(state),
  };
}

function detectHumanRequest(message: string): boolean {
  const patterns = [
    /\b(talk to|speak with|connect me to|transfer to)\s+(a\s+)?(human|person|someone|counselor|therapist)/i,
    /\b(real|actual)\s+(human|person)/i,
    /\bneed\s+(a\s+)?human/i,
    /\bwant\s+(a\s+)?person/i,
  ];
  return patterns.some(p => p.test(message));
}

function buildHandoffContext(state: MolleiState): HandoffContext {
  return {
    sessionSummary: state.contextSummary ?? "No summary available",
    crisisHistory: state.crisisHistory ?? [],
    userPreferences: {},
    suggestedActions: [
      "Review conversation history",
      "Assess immediate safety",
      "Connect to crisis resources if needed",
    ],
  };
}

export async function executeHandoff(
  decision: HandoffDecision,
  state: MolleiState,
  ctx: PipelineContext
): Promise<MolleiState> {
  logMonitoring("handoff", {
    traceId: ctx.traceId,
    sessionId: ctx.sessionId,
    reason: decision.reason,
    urgency: decision.urgency,
    targetAgent: decision.targetAgent,
  });

  // Generate handoff message
  const handoffMessage = generateHandoffMessage(decision);

  return {
    ...state,
    response: handoffMessage,
    handoffExecuted: true,
    handoffReason: decision.reason,
  };
}

function generateHandoffMessage(decision: HandoffDecision): string {
  if (decision.urgency === "immediate") {
    return `I'm connecting you with a crisis counselor right now. Please stay on the line.

While you wait:
- 988 Suicide & Crisis Lifeline: Call or text 988 (available 24/7)
- Crisis Text Line: Text HOME to 741741

A human counselor will be with you shortly. You're not alone.`;
  }

  return `I want to make sure you get the best support possible. I'm connecting you with a human counselor who can help.

While you wait, I'm here if you need anything. You can also reach:
- 988 Suicide & Crisis Lifeline: Call or text 988
- Crisis Text Line: Text HOME to 741741

Thank you for trusting me with your feelings.`;
}
```

### 6D.4 Concurrent Pattern Best Practices

Based on Microsoft guidelines, our concurrent agent execution:

```typescript
// lib/pipeline/concurrent-execution.ts
import { MolleiState } from "./state";
import { PipelineContext } from "./context";
import { moodSensorNode } from "../agents/mood-sensor";
import { memoryAgentNode } from "../agents/memory-agent";
import { safetyMonitorNode } from "../agents/safety-monitor";
import { AGENT_IDS } from "../utils/constants";

interface ConcurrentResult {
  results: Partial<MolleiState>[];
  errors: Array<{ agent: string; error: string }>;
  allSucceeded: boolean;
}

/**
 * Microsoft Concurrent Pattern Implementation
 *
 * Key principles:
 * 1. No data handoff between parallel agents
 * 2. Each agent gets independent copy of input
 * 3. Results aggregated after all complete
 * 4. Errors don't block other agents
 */
export async function runConcurrentAgents(
  state: MolleiState,
  ctx: PipelineContext
): Promise<ConcurrentResult> {
  const agents = [
    { name: AGENT_IDS.MOOD_SENSOR, fn: moodSensorNode },
    { name: AGENT_IDS.MEMORY_AGENT, fn: memoryAgentNode },
    { name: AGENT_IDS.SAFETY_MONITOR, fn: safetyMonitorNode },
  ];

  const results: Partial<MolleiState>[] = [];
  const errors: Array<{ agent: string; error: string }> = [];

  // Execute all agents concurrently (no dependencies)
  const settled = await Promise.allSettled(
    agents.map(async (agent) => {
      try {
        return await agent.fn(state, ctx);
      } catch (error) {
        errors.push({
          agent: agent.name,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    })
  );

  // Aggregate successful results
  for (const result of settled) {
    if (result.status === "fulfilled") {
      results.push(result.value);
    }
  }

  return {
    results,
    errors,
    allSucceeded: errors.length === 0,
  };
}

/**
 * Merge concurrent results into single state
 * Conflict resolution: safety_monitor takes precedence for crisis fields
 */
export function mergeConcurrentResults(
  baseState: MolleiState,
  results: Partial<MolleiState>[]
): MolleiState {
  let merged = { ...baseState };

  for (const result of results) {
    merged = {
      ...merged,
      ...result,
      latencyMs: {
        ...merged.latencyMs,
        ...result.latencyMs,
      },
      agentErrors: [
        ...(merged.agentErrors ?? []),
        ...(result.agentErrors ?? []),
      ],
    };
  }

  return merged;
}
```

### 6D.5 Context Window Management (Microsoft Guidance)

```typescript
// lib/pipeline/context-management.ts
import { AGENT_IDS, TOKEN_BUDGETS } from "../utils/constants";

/**
 * Context management following Microsoft guidelines:
 * - Minimize context passing when not essential
 * - Summarize vs. pass raw context
 * - Respect context window limits
 */

interface ContextPassingStrategy {
  agentId: string;
  strategy: "full" | "summary" | "minimal";
  maxTokens: number;
}

const CONTEXT_STRATEGIES: ContextPassingStrategy[] = [
  // mood_sensor only needs current message
  { agentId: AGENT_IDS.MOOD_SENSOR, strategy: "minimal", maxTokens: TOKEN_BUDGETS.MOOD_SENSOR },

  // memory_agent needs session context
  { agentId: AGENT_IDS.MEMORY_AGENT, strategy: "summary", maxTokens: TOKEN_BUDGETS.MEMORY_AGENT * 4 },

  // safety_monitor needs current message + recent turns
  { agentId: AGENT_IDS.SAFETY_MONITOR, strategy: "minimal", maxTokens: TOKEN_BUDGETS.SAFETY_MONITOR * 2 },

  // emotion_reasoner needs aggregated results
  { agentId: AGENT_IDS.EMOTION_REASONER, strategy: "summary", maxTokens: TOKEN_BUDGETS.EMOTION_REASONER * 3 },

  // response_generator needs full context
  { agentId: AGENT_IDS.RESPONSE_GENERATOR, strategy: "full", maxTokens: TOKEN_BUDGETS.RESPONSE_GENERATOR * 4 },
];

/**
 * Prepare context for agent based on its strategy
 * Minimal: just userMessage + turnNumber
 * Summary: add contextSummary, userEmotion, crisisDetected
 * Full: complete state for response_generator
 */
export function prepareAgentContext(
  state: MolleiState,
  agentId: string
): Record<string, unknown> {
  const strategy = CONTEXT_STRATEGIES.find(s => s.agentId === agentId);

  if (!strategy || strategy.strategy === "minimal") {
    return {
      userMessage: state.userMessage,
      turnNumber: state.turnNumber,
    };
  }

  if (strategy.strategy === "summary") {
    return {
      userMessage: state.userMessage,
      turnNumber: state.turnNumber,
      contextSummary: state.contextSummary,
      userEmotion: state.userEmotion,
      crisisDetected: state.crisisDetected,
    };
  }

  // Full context for response_generator
  return {
    userMessage: state.userMessage,
    turnNumber: state.turnNumber,
    contextSummary: state.contextSummary,
    memoryRefs: state.memoryRefs,
    userEmotion: state.userEmotion,
    molleiEmotion: state.molleiEmotion,
    crisisDetected: state.crisisDetected,
    crisisSeverity: state.crisisSeverity,
    callbackOpportunities: state.callbackOpportunities,
    relationshipStage: state.relationshipStage,
  };
}
```

### 6D.6 Common Pitfalls (Microsoft Guidance)

| Pitfall | Mollei Mitigation |
|---------|------------------|
| Creating unnecessary complexity | 5 agents only; each has distinct purpose |
| Adding agents without specialization | Each agent has unique model/budget/output |
| Overlooking latency | Concurrent pattern reduces sequential hops |
| Sharing mutable state | Request-scoped PipelineContext |
| Deterministic patterns for non-deterministic | Crisis routing uses conditional edges |
| Context window explosion | Strategy-based context passing per agent |
| Infinite loops | MAX_ITERATIONS in Maker-Checker |

---

© 2025 Patrick Peña / Agenisea™

All original text and documentation is © the author.
Documentation is licensed for use, sharing, and adaptation under the same terms as this repository, unless otherwise noted.
