import { generateText, streamText } from 'ai'
import { BaseAgent, type AgentConfig, type AgentOptions } from './base'
import { responseGeneratorModel, crisisModel } from '../ai/client'
import type { MolleiState } from '../pipeline/state'
import type { PipelineContext } from '../pipeline/orchestrator'
import { RESPONSE_GENERATOR_PROMPT } from '../prompts/response-generator'
import { applySeverityModifier } from '../tools/crisis-resources'
import {
  AGENT_IDS,
  TIMEOUTS,
  CRISIS_SEVERITY,
  FALLBACK_RESPONSE,
  RESPONSE_MODIFIERS,
} from '../utils/constants'
import { AGENT_MODELS } from '../ai/models'

const config: AgentConfig = {
  agentId: AGENT_IDS.RESPONSE_GENERATOR,
  model: AGENT_MODELS.RESPONSE_GENERATOR,
  timeoutMs: TIMEOUTS.RESPONSE_GENERATOR,
}

const fallback = () => ({
  response: FALLBACK_RESPONSE,
})

export class ResponseGenerator extends BaseAgent {
  constructor(options?: AgentOptions) {
    super(config, fallback, options)
  }

  protected async run(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const useCrisisModel = (state.crisisSeverity ?? 0) >= CRISIS_SEVERITY.CRISIS_SUPPORT
    const model = useCrisisModel ? crisisModel : responseGeneratorModel

    const prompt = this.buildPrompt(state)

    const messages = [
      {
        role: 'system' as const,
        content: RESPONSE_GENERATOR_PROMPT,
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' } },
        },
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ]

    let text: string

    if (ctx.orchestrator && !ctx.orchestrator.aborted) {
      const result = streamText({
        model,
        messages,
      })

      const chunks: string[] = []
      for await (const chunk of result.textStream) {
        chunks.push(chunk)
        await ctx.orchestrator.sendEvent('delta', { text: chunk })
      }
      text = chunks.join('')
    } else {
      const result = await generateText({
        model,
        messages,
      })
      text = result.text
    }

    const response = applySeverityModifier(text, state.crisisSeverity ?? 0)

    return {
      response,
      modelUsed: useCrisisModel ? AGENT_MODELS.CRISIS_ESCALATION : AGENT_MODELS.RESPONSE_GENERATOR,
    }
  }

  private buildPrompt(state: MolleiState): string {
    const emotionClarity = this.computeEmotionClarity(state)

    return `
## User Message
${state.userMessage}

## User Emotional State
${JSON.stringify(state.userEmotion, null, 2)}

## Emotion Clarity Score
${emotionClarity.toFixed(2)} (${this.clarityLabel(emotionClarity)})
${emotionClarity < 0.5 ? '→ Use tentative language: "It sounds like...", "I sense...", "I might be picking up on..."' : ''}
${emotionClarity >= 0.7 ? '→ Use confident language: "I hear...", "You seem...", "That sounds..."' : ''}

## Mollei's Emotional Response
${JSON.stringify(state.molleiEmotion, null, 2)}

## Context
${state.contextSummary ?? 'No prior context'}

## Conversation Phase
Turn ${state.turnNumber} (${state.turnNumber < 3 ? 'early' : state.turnNumber < 10 ? 'building' : 'established'})

## Approach
${state.approach ?? 'validate'}

## Response Modifier
${state.suggestedResponseModifier ?? RESPONSE_MODIFIERS.NONE}

## Crisis Status
${state.crisisDetected ? `CRISIS DETECTED (severity ${state.crisisSeverity})` : 'No crisis detected'}

Generate a response that:
1. Acknowledges the user's emotion before content
2. Maintains Mollei's warm, thoughtful personality
3. Uses confidence-modulated language matching the Emotion Clarity Score above
4. References context naturally (if available)
5. Does NOT rush to solutions unless asked
    `.trim()
  }

  private computeEmotionClarity(state: MolleiState): number {
    const emotion = state.userEmotion as { intensity?: number; ambiguityNotes?: string | null } | undefined
    if (!emotion) return 0.5

    const intensity = emotion.intensity ?? 0.5
    const hasAmbiguity = Boolean(emotion.ambiguityNotes)

    return hasAmbiguity ? intensity * 0.7 : intensity
  }

  private clarityLabel(clarity: number): string {
    if (clarity >= 0.7) return 'clear'
    if (clarity >= 0.4) return 'moderate'
    return 'uncertain'
  }
}
