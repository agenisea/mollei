import type { MolleiState } from './state'
import type { StreamOrchestrator } from '@agenisea/sse-kit'
import type { Tracer } from '../infrastructure/trace'
import { tracePipelineStart, tracePipelineEnd } from '../infrastructure/trace'
import { PIPELINE_PHASE, PIPELINE_PHASE_MESSAGES } from '../utils/constants'

export interface PipelineContext {
  traceId: string
  sessionId: string
  userId: string
  turnNumber: number
  orchestrator?: StreamOrchestrator
  tracer?: Tracer
}

export interface PipelineModule {
  readonly agentId?: string
  execute(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>>
}

export async function runParallelModules(
  modules: PipelineModule[],
  state: MolleiState,
  ctx: PipelineContext
): Promise<Partial<MolleiState>[]> {
  const results = await Promise.allSettled(modules.map((m) => m.execute(state, ctx)))

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const agentId = modules[i]?.agentId ?? `module_${i}`
    console.error(`[orchestrator] ${agentId} failed:`, r.reason)
    return {}
  })
}

export function mergeResults(base: MolleiState, results: Partial<MolleiState>[]): MolleiState {
  return results.reduce<MolleiState>(
    (acc, result) => ({
      ...acc,
      ...result,
      latencyMs: { ...acc.latencyMs, ...(result.latencyMs ?? {}) },
      agentErrors: [...acc.agentErrors, ...(result.agentErrors ?? [])],
    }),
    base
  )
}

export async function runSequentialModules(
  modules: PipelineModule[],
  state: MolleiState,
  ctx: PipelineContext
): Promise<MolleiState> {
  let currentState = state

  for (const agent of modules) {
    const result = await agent.execute(currentState, ctx)
    currentState = { ...currentState, ...result }
  }

  return currentState
}

export async function runMolleiPipeline(
  state: MolleiState,
  ctx: PipelineContext,
  modules: {
    parallel: PipelineModule[]
    sequential: PipelineModule[]
  }
): Promise<MolleiState> {
  const start = performance.now()

  tracePipelineStart(ctx.traceId, {
    sessionId: ctx.sessionId,
    userId: ctx.userId,
    turnNumber: ctx.turnNumber,
  })

  if (ctx.orchestrator) {
    await ctx.orchestrator.sendProgress(PIPELINE_PHASE.SENSING, PIPELINE_PHASE_MESSAGES.sensing)
  }

  const parallelResults = await runParallelModules(modules.parallel, state, ctx)
  let currentState = mergeResults(state, parallelResults)

  if (ctx.orchestrator && !ctx.orchestrator.aborted) {
    await ctx.orchestrator.sendProgress(
      PIPELINE_PHASE.REASONING,
      PIPELINE_PHASE_MESSAGES.reasoning
    )
  }

  for (const agent of modules.sequential) {
    if (ctx.orchestrator?.aborted) break

    const result = await agent.execute(currentState, ctx)
    currentState = { ...currentState, ...result }
  }

  const totalLatency = Math.round(performance.now() - start)

  tracePipelineEnd(ctx.traceId, {
    durationMs: totalLatency,
    success: currentState.agentErrors.length === 0,
    crisisDetected: currentState.crisisDetected,
  })

  return {
    ...currentState,
    phase: PIPELINE_PHASE.COMPLETE,
    latencyMs: { ...currentState.latencyMs, total: totalLatency },
  }
}
