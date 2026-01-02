import { generateObject } from 'ai'
import { z } from 'zod'
import { BaseAgent, type AgentConfig, type AgentOptions } from './base'
import { emotionReasonerModel } from '../ai/client'
import type { MolleiState } from '../pipeline/state'
import type { PipelineContext } from '../pipeline/orchestrator'
import { EMOTION_REASONER_PROMPT } from '../prompts/emotion-reasoner'
import { AGENT_IDS, TIMEOUTS, APPROACH_TYPES } from '../utils/constants'
import { AGENT_MODELS } from '../ai/models'

const EmotionReasonerOutputSchema = z.object({
  primary: z.string(),
  energy: z.number().min(0).max(1),
  approach: z.string(),
  toneModifiers: z.array(z.string()),
  presenceQuality: z.string(),
})

const config: AgentConfig = {
  agentId: AGENT_IDS.EMOTION_REASONER,
  model: AGENT_MODELS.EMOTION_REASONER,
  timeoutMs: TIMEOUTS.EMOTION_REASONER,
}

const fallback = () => ({
  molleiEmotion: {
    primary: 'warmth',
    secondary: null,
    intensity: 0.6,
    valence: 0.3,
    signals: [] as string[],
  },
  approach: APPROACH_TYPES.VALIDATE,
  presenceQuality: 'attentive',
})

export class EmotionReasoner extends BaseAgent {
  constructor(options?: AgentOptions) {
    super(config, fallback, options)
  }

  protected async run(
    state: MolleiState,
    ctx: PipelineContext,
    abortSignal: AbortSignal
  ): Promise<Partial<MolleiState>> {
    const context = this.buildContext(state)

    const { object } = await generateObject({
      model: emotionReasonerModel,
      schema: EmotionReasonerOutputSchema,
      abortSignal,
      messages: [
        {
          role: 'system',
          content: EMOTION_REASONER_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
          },
        },
        {
          role: 'user',
          content: context,
        },
      ],
    })

    ctx.tracer?.addEvent?.('emotion_reasoned', {
      primary: object.primary,
      approach: object.approach,
    })

    return {
      molleiEmotion: {
        primary: object.primary,
        secondary: null,
        intensity: object.energy,
        valence: 0.3,
        signals: object.toneModifiers,
      },
      approach: object.approach,
      presenceQuality: object.presenceQuality,
    }
  }

  private buildContext(state: MolleiState): string {
    return `
User message: ${state.userMessage}
User emotion: ${JSON.stringify(state.userEmotion)}
Context summary: ${state.contextSummary ?? 'None'}
Emotional trajectory: ${state.emotionalTrajectory ?? 'unknown'}
Crisis detected: ${state.crisisDetected ?? false}
Crisis severity: ${state.crisisSeverity ?? 1}
Turn number: ${state.turnNumber}
    `.trim()
  }
}
