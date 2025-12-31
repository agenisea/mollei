import { generateObject } from 'ai'
import { z } from 'zod'
import { BaseAgent, type AgentConfig, type AgentOptions } from './base'
import { moodSensorModel } from '../ai/client'
import type { MolleiState } from '../pipeline/state'
import type { PipelineContext } from '../pipeline/orchestrator'
import { MOOD_SENSOR_PROMPT } from '../prompts/mood-sensor'
import { AGENT_IDS, TIMEOUTS, FALLBACK_EMOTION } from '../utils/constants'
import { AGENT_MODELS } from '../ai/models'

const EmotionOutputSchema = z.object({
  primary: z.string(),
  secondary: z.string().nullable(),
  intensity: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  signals: z.array(z.string()),
  ambiguityNotes: z.string().nullable(),
})

const config: AgentConfig = {
  agentId: AGENT_IDS.MOOD_SENSOR,
  model: AGENT_MODELS.MOOD_SENSOR,
  timeoutMs: TIMEOUTS.MOOD_SENSOR,
}

const fallback = () => ({
  userEmotion: FALLBACK_EMOTION,
})

export class MoodSensor extends BaseAgent {
  constructor(options?: AgentOptions) {
    super(config, fallback, options)
  }

  protected async run(state: MolleiState, _ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const { object } = await generateObject({
      model: moodSensorModel,
      schema: EmotionOutputSchema,
      messages: [
        {
          role: 'system',
          content: MOOD_SENSOR_PROMPT,
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

    return { userEmotion: object }
  }
}
