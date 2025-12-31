import { registerTraceHandler, type TraceEvent } from './trace'

export interface LLMCostEntry {
  agentId: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  durationMs: number
  timestamp: number
}

export interface TraceCostSummary {
  traceId: string
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCalls: number
  totalDurationMs: number
  byAgent: Record<
    string,
    {
      calls: number
      cost: number
      inputTokens: number
      outputTokens: number
      avgDurationMs: number
    }
  >
  entries: LLMCostEntry[]
  startTime: number
  endTime?: number
}

const costsByTrace = new Map<string, TraceCostSummary>()
const MAX_TRACES = 500

function costTraceHandler(event: TraceEvent): void {
  if (event.type === 'pipeline_start') {
    if (costsByTrace.size >= MAX_TRACES) {
      const oldestKey = costsByTrace.keys().next().value
      if (oldestKey) costsByTrace.delete(oldestKey)
    }

    costsByTrace.set(event.traceId, {
      traceId: event.traceId,
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCalls: 0,
      totalDurationMs: 0,
      byAgent: {},
      entries: [],
      startTime: event.timestamp,
    })
    return
  }

  if (event.type === 'pipeline_end') {
    const summary = costsByTrace.get(event.traceId)
    if (summary) {
      summary.endTime = event.timestamp
      logCostSummary(summary)
    }
    return
  }

  if (event.type !== 'llm_call') return

  const data = event.data as {
    agentId: string
    model: string
    inputTokens: number
    outputTokens: number
    estimatedCost: number
    durationMs: number
    success: boolean
  }

  if (!data.success) return

  const summary = costsByTrace.get(event.traceId)
  if (!summary) return

  const entry: LLMCostEntry = {
    agentId: data.agentId,
    model: data.model,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    estimatedCost: data.estimatedCost,
    durationMs: data.durationMs,
    timestamp: event.timestamp,
  }

  summary.totalCost += data.estimatedCost
  summary.totalInputTokens += data.inputTokens
  summary.totalOutputTokens += data.outputTokens
  summary.totalCalls += 1
  summary.totalDurationMs += data.durationMs
  summary.entries.push(entry)

  if (!summary.byAgent[data.agentId]) {
    summary.byAgent[data.agentId] = {
      calls: 0,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      avgDurationMs: 0,
    }
  }

  const agentStats = summary.byAgent[data.agentId]!
  agentStats.calls += 1
  agentStats.cost += data.estimatedCost
  agentStats.inputTokens += data.inputTokens
  agentStats.outputTokens += data.outputTokens
  agentStats.avgDurationMs =
    (agentStats.avgDurationMs * (agentStats.calls - 1) + data.durationMs) / agentStats.calls
}

let isEnabled = false

export function enableCostAggregation(): void {
  if (isEnabled) return
  registerTraceHandler(costTraceHandler)
  isEnabled = true
}

export function getCostSummary(traceId: string): TraceCostSummary | null {
  return costsByTrace.get(traceId) ?? null
}

export function getAllCostSummaries(): TraceCostSummary[] {
  return Array.from(costsByTrace.values())
}

export function clearCostData(traceId: string): void {
  costsByTrace.delete(traceId)
}

export function logCostSummary(summary: TraceCostSummary): void {
  if (process.env.SHOW_DEBUG_LOGS !== 'true') return

  const prefix = '[cost]'
  const durationSec = summary.endTime
    ? ((summary.endTime - summary.startTime) / 1000).toFixed(1)
    : 'ongoing'

  console.log(`${prefix} ════════════════════════════════════════`)
  console.log(`${prefix} PIPELINE COST SUMMARY`)
  console.log(`${prefix} ────────────────────────────────────────`)
  console.log(`${prefix} Trace ID:     ${summary.traceId}`)
  console.log(`${prefix} Total Cost:   $${summary.totalCost.toFixed(4)}`)
  console.log(`${prefix} Total Calls:  ${summary.totalCalls}`)
  console.log(`${prefix} Duration:     ${durationSec}s`)
  console.log(
    `${prefix} Tokens:       ${summary.totalInputTokens.toLocaleString()} in / ${summary.totalOutputTokens.toLocaleString()} out`
  )
  console.log(`${prefix} ────────────────────────────────────────`)
  console.log(`${prefix} BY AGENT:`)

  const sortedAgents = Object.entries(summary.byAgent).sort((a, b) => b[1].cost - a[1].cost)

  for (const [agentId, stats] of sortedAgents) {
    const pct = summary.totalCost > 0 ? ((stats.cost / summary.totalCost) * 100).toFixed(0) : '0'
    console.log(
      `${prefix}   ${agentId.padEnd(20)} ${stats.calls.toString().padStart(2)} calls  $${stats.cost.toFixed(4).padStart(8)}  (${pct}%)`
    )
  }

  console.log(`${prefix} ════════════════════════════════════════`)
}
