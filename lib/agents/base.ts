import type { MolleiState } from '../pipeline/state'
import type { PipelineContext, PipelineModule } from '../pipeline/orchestrator'
import { CircuitBreaker, type ICircuitBreaker } from '../resilience/circuit-breaker'
import { traceAgentStart, traceAgentEnd, traceError } from '../infrastructure/trace'

export interface AgentConfig {
  agentId: string
  model: string
  timeoutMs: number
}

export type FallbackFn = (state: MolleiState) => Partial<MolleiState>

export interface AgentOptions {
  circuitBreaker?: ICircuitBreaker
}

export abstract class BaseAgent implements PipelineModule {
  protected circuitBreaker: ICircuitBreaker

  constructor(
    protected config: AgentConfig,
    protected fallbackFn: FallbackFn,
    options?: AgentOptions
  ) {
    this.circuitBreaker = options?.circuitBreaker ?? new CircuitBreaker(config.agentId)
  }

  get agentId(): string {
    return this.config.agentId
  }

  protected abstract run(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>>

  async execute(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const start = performance.now()
    const span = ctx.tracer?.startSpan(`agent.${this.config.agentId}`, {
      'agent.id': this.config.agentId,
      'agent.model': this.config.model,
    })

    traceAgentStart(ctx.traceId, this.config.agentId)

    if (!this.circuitBreaker.allowRequest()) {
      console.log(`[${this.config.agentId}] Circuit open, using fallback`)
      span?.addEvent('circuit_open')
      span?.setStatus('ok')
      span?.end()
      const durationMs = Math.round(performance.now() - start)
      traceAgentEnd(ctx.traceId, this.config.agentId, 'fallback', durationMs)
      return this.withLatency(this.fallbackFn(state), start)
    }

    try {
      const result = await Promise.race([this.run(state, ctx), this.timeout()])

      this.circuitBreaker.recordSuccess()
      span?.setStatus('ok')
      span?.end()
      const durationMs = Math.round(performance.now() - start)
      traceAgentEnd(ctx.traceId, this.config.agentId, 'complete', durationMs)
      return this.withLatency(result, start)
    } catch (error) {
      this.circuitBreaker.recordFailure()
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[${this.config.agentId}] Error:`, errorMsg)

      span?.setStatus('error', errorMsg)
      span?.end()

      const durationMs = Math.round(performance.now() - start)
      traceAgentEnd(ctx.traceId, this.config.agentId, 'failed', durationMs)
      traceError(ctx.traceId, this.config.agentId, errorMsg)

      return this.withLatency(
        {
          ...this.fallbackFn(state),
          agentErrors: [errorMsg],
        },
        start
      )
    }
  }

  private timeout(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
    )
  }

  private withLatency(result: Partial<MolleiState>, start: number): Partial<MolleiState> {
    return {
      ...result,
      latencyMs: { [this.config.agentId]: Math.round(performance.now() - start) },
    }
  }
}
