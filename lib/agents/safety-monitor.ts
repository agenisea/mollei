import { generateObject } from 'ai'
import { z } from 'zod'
import { BaseAgent, type AgentConfig, type AgentOptions } from './base'
import { safetyMonitorModel } from '../ai/client'
import type { MolleiState } from '../pipeline/state'
import type { PipelineContext } from '../pipeline/orchestrator'
import { SAFETY_MONITOR_PROMPT } from '../prompts/safety-monitor'
import { runSafetyHeuristics } from './safety-heuristics'
import {
  AGENT_IDS,
  TIMEOUTS,
  SIGNAL_TYPES,
  RESPONSE_MODIFIERS,
  CRISIS_SEVERITY,
} from '../utils/constants'
import { AGENT_MODELS } from '../ai/models'

const SafetyOutputSchema = z.object({
  crisisDetected: z.boolean(),
  severity: z.number().min(1).max(5),
  signalType: z.string(),
  confidence: z.number().min(0).max(1),
  keyPhrases: z.array(z.string()),
  suggestedResponseModifier: z.string(),
})

const config: AgentConfig = {
  agentId: AGENT_IDS.SAFETY_MONITOR,
  model: AGENT_MODELS.SAFETY_MONITOR,
  timeoutMs: TIMEOUTS.SAFETY_MONITOR,
}

const fallback = () => ({
  crisisDetected: false,
  crisisSeverity: CRISIS_SEVERITY.PROCEED,
  crisisSignalType: SIGNAL_TYPES.NONE,
  suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
})

export class SafetyMonitor extends BaseAgent {
  constructor(options?: AgentOptions) {
    super(config, fallback, options)
  }

  protected async run(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const heuristics = runSafetyHeuristics(state.userMessage)

    if (!heuristics.shouldEscalate) {
      ctx.tracer?.addEvent?.('safety_clear', { method: 'heuristics' })
      return {
        crisisDetected: false,
        crisisSeverity: CRISIS_SEVERITY.PROCEED,
        crisisSignalType: SIGNAL_TYPES.NONE,
        crisisConfidence: 0.95,
        suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
      }
    }

    console.log(
      `[safety_monitor] Heuristics flagged: signals=${heuristics.signals.join(',')}, escalating to LLM`
    )

    const { object } = await generateObject({
      model: safetyMonitorModel,
      schema: SafetyOutputSchema,
      messages: [
        {
          role: 'system',
          content: SAFETY_MONITOR_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
          },
        },
        {
          role: 'user',
          content: state.userMessage,
        },
      ],
    })

    if (object.crisisDetected) {
      console.log(
        `[safety_monitor] LLM confirmed crisis: severity=${object.severity}, type=${object.signalType}`
      )
      ctx.tracer?.addEvent?.('crisis_detected', {
        severity: object.severity,
        signalType: object.signalType,
      })
    } else {
      console.log(`[safety_monitor] LLM override: heuristics flagged but LLM determined safe`)
      ctx.tracer?.addEvent?.('safety_override', { method: 'llm' })
    }

    return {
      crisisDetected: object.crisisDetected,
      crisisSeverity: object.severity,
      crisisSignalType: object.signalType,
      crisisConfidence: object.confidence,
      suggestedResponseModifier: object.suggestedResponseModifier,
    }
  }
}
