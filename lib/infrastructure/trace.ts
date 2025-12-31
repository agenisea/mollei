export type TraceEventType =
  | 'pipeline_start'
  | 'pipeline_end'
  | 'agent_start'
  | 'agent_end'
  | 'llm_call'
  | 'error'
  | 'crisis_detected'

export type TraceCategory = 'pipeline' | 'agent' | 'llm' | 'safety'

export interface TraceEvent {
  type: TraceEventType
  traceId: string
  timestamp: number
  category?: TraceCategory
  data: Record<string, unknown>
}

export type TraceHandler = (event: TraceEvent) => void | Promise<void>

const traceHandlers: TraceHandler[] = []

export function registerTraceHandler(handler: TraceHandler): void {
  if (!traceHandlers.includes(handler)) {
    traceHandlers.push(handler)
  }
}

export function emitTrace(event: TraceEvent): void {
  for (const handler of traceHandlers) {
    try {
      void handler(event)
    } catch (error) {
      console.error('[trace] Handler error:', error)
    }
  }
}

export function tracePipelineStart(
  traceId: string,
  data: { sessionId: string; userId: string; turnNumber: number }
): void {
  emitTrace({
    type: 'pipeline_start',
    traceId,
    timestamp: Date.now(),
    category: 'pipeline',
    data,
  })
}

export function tracePipelineEnd(
  traceId: string,
  data: { durationMs: number; success: boolean; crisisDetected?: boolean }
): void {
  emitTrace({
    type: 'pipeline_end',
    traceId,
    timestamp: Date.now(),
    category: 'pipeline',
    data,
  })
}

export function traceAgentStart(traceId: string, agentId: string): void {
  emitTrace({
    type: 'agent_start',
    traceId,
    timestamp: Date.now(),
    category: 'agent',
    data: { agentId },
  })
}

export function traceAgentEnd(
  traceId: string,
  agentId: string,
  status: 'complete' | 'failed' | 'fallback',
  durationMs: number
): void {
  emitTrace({
    type: 'agent_end',
    traceId,
    timestamp: Date.now(),
    category: 'agent',
    data: { agentId, status, durationMs },
  })
}

export function traceLLMCall(
  traceId: string,
  data: {
    agentId: string
    model: string
    durationMs: number
    inputTokens: number
    outputTokens: number
    estimatedCost: number
    success: boolean
  }
): void {
  emitTrace({
    type: 'llm_call',
    traceId,
    timestamp: Date.now(),
    category: 'llm',
    data,
  })
}

export function traceCrisis(
  traceId: string,
  data: { severity: number; signalType: string; confidence: number; sessionId: string }
): void {
  emitTrace({
    type: 'crisis_detected',
    traceId,
    timestamp: Date.now(),
    category: 'safety',
    data,
  })
}

export function traceError(traceId: string, agentId: string, message: string): void {
  emitTrace({
    type: 'error',
    traceId,
    timestamp: Date.now(),
    category: 'agent',
    data: { agentId, message },
  })
}

const MOLLEI_TRACE_PREFIX = '[MOLLEI_TRACE]'

export const defaultTraceHandler: TraceHandler = (event: TraceEvent) => {
  if (process.env.TRACE_ENABLED !== 'true') return
  try {
    console.log(MOLLEI_TRACE_PREFIX, JSON.stringify(event))
  } catch {
    // Best-effort: never let telemetry crash the app
  }
}

let eventTracingInitialized = false

export function initializeEventTracing(): void {
  if (eventTracingInitialized) return
  eventTracingInitialized = true
  registerTraceHandler(defaultTraceHandler)
}

initializeEventTracing()

export interface SpanContext {
  traceId: string
  spanId: string
  parentSpanId?: string
}

export interface SpanAttributes {
  'agent.id'?: string
  'agent.model'?: string
  'pipeline.phase'?: string
  'crisis.detected'?: boolean
  'crisis.severity'?: number
  'latency.ms'?: number
  'error.message'?: string
  [key: string]: string | number | boolean | undefined
}

export interface Span {
  spanId: string
  name: string
  startTime: number
  endTime?: number
  attributes: SpanAttributes
  status: 'ok' | 'error' | 'unset'
  events: SpanEvent[]
  end(attributes?: SpanAttributes): void
  addEvent(name: string, attributes?: SpanAttributes): void
  setStatus(status: 'ok' | 'error', message?: string): void
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: SpanAttributes
}

export interface Tracer {
  startSpan(name: string, attributes?: SpanAttributes): Span
  currentSpan(): Span | undefined
}

const TRACE_ENABLED = process.env.TRACE_ENABLED === 'true'

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

class NoOpSpan implements Span {
  spanId = ''
  name = ''
  startTime = 0
  attributes: SpanAttributes = {}
  status: 'ok' | 'error' | 'unset' = 'unset'
  events: SpanEvent[] = []
  end(): void {}
  addEvent(): void {}
  setStatus(): void {}
}

class TracingSpan implements Span {
  spanId: string
  startTime: number
  endTime?: number
  attributes: SpanAttributes
  status: 'ok' | 'error' | 'unset' = 'unset'
  events: SpanEvent[] = []
  private statusMessage?: string

  constructor(
    public name: string,
    private context: SpanContext,
    initialAttributes?: SpanAttributes
  ) {
    this.spanId = context.spanId
    this.startTime = performance.now()
    this.attributes = initialAttributes ?? {}
  }

  end(attributes?: SpanAttributes): void {
    this.endTime = performance.now()
    if (attributes) {
      this.attributes = { ...this.attributes, ...attributes }
    }
    this.attributes['latency.ms'] = Math.round(this.endTime - this.startTime)
    this.emit()
  }

  addEvent(name: string, attributes?: SpanAttributes): void {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    })
  }

  setStatus(status: 'ok' | 'error', message?: string): void {
    this.status = status
    this.statusMessage = message
    if (message) {
      this.attributes['error.message'] = message
    }
  }

  private emit(): void {
    const log = {
      traceId: this.context.traceId,
      spanId: this.spanId,
      parentSpanId: this.context.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.attributes['latency.ms'],
      status: this.status,
      statusMessage: this.statusMessage,
      attributes: this.attributes,
      events: this.events,
    }

    console.log(`[trace] ${JSON.stringify(log)}`)
  }
}

class RequestTracer implements Tracer {
  private spanStack: Span[] = []

  constructor(private traceId: string) {}

  startSpan(name: string, attributes?: SpanAttributes): Span {
    const parentSpan = this.currentSpan()
    const context: SpanContext = {
      traceId: this.traceId,
      spanId: generateId(),
      parentSpanId: parentSpan?.spanId,
    }

    const span = new TracingSpan(name, context, attributes)
    this.spanStack.push(span)
    return span
  }

  currentSpan(): Span | undefined {
    return this.spanStack[this.spanStack.length - 1]
  }
}

class NoOpTracer implements Tracer {
  private noOpSpan = new NoOpSpan()

  startSpan(): Span {
    return this.noOpSpan
  }

  currentSpan(): Span | undefined {
    return undefined
  }
}

export function createTracer(traceId: string): Tracer {
  if (TRACE_ENABLED) {
    return new RequestTracer(traceId)
  }
  return new NoOpTracer()
}

export async function withSpan<T>(
  tracer: Tracer,
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: SpanAttributes
): Promise<T> {
  const span = tracer.startSpan(name, attributes)
  try {
    const result = await fn(span)
    span.setStatus('ok')
    return result
  } catch (error) {
    span.setStatus('error', error instanceof Error ? error.message : String(error))
    throw error
  } finally {
    span.end()
  }
}
