import { generateObject } from 'ai'
import { z } from 'zod'
import { BaseAgent, type AgentConfig, type AgentOptions } from './base'
import { memoryAgentModel } from '../ai/client'
import type { MolleiState } from '../pipeline/state'
import type { PipelineContext } from '../pipeline/orchestrator'
import { MEMORY_AGENT_PROMPT } from '../prompts/memory-agent'
import {
  AGENT_IDS,
  TIMEOUTS,
  EMOTIONAL_TRAJECTORY,
} from '../utils/constants'
import { AGENT_MODELS } from '../ai/models'
import { getSharedConversationCache } from '../cache/conversation-cache'

const MemoryOutputSchema = z.object({
  contextSummary: z.string(),
  callbackOpportunities: z.array(z.string()),
  relationshipStage: z.string(),
  recurringThemes: z.array(z.string()),
  emotionalTrajectory: z.string(),
})

const config: AgentConfig = {
  agentId: AGENT_IDS.MEMORY_AGENT,
  model: AGENT_MODELS.MEMORY_AGENT,
  timeoutMs: TIMEOUTS.MEMORY_AGENT,
}

const fallback = () => ({
  contextSummary: '',
  callbackOpportunities: [],
  recurringThemes: [],
  emotionalTrajectory: EMOTIONAL_TRAJECTORY.STABLE,
})

export class MemoryAgent extends BaseAgent {
  constructor(options?: AgentOptions) {
    super(config, fallback, options)
  }

  protected async run(state: MolleiState, ctx: PipelineContext): Promise<Partial<MolleiState>> {
    const sessionContext = await this.getSessionContext(state.sessionId)

    const { object } = await generateObject({
      model: memoryAgentModel,
      schema: MemoryOutputSchema,
      messages: [
        {
          role: 'system',
          content: MEMORY_AGENT_PROMPT,
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
          },
        },
        {
          role: 'user',
          content: `Session context: ${sessionContext}\n\nCurrent message: ${state.userMessage}`,
        },
      ],
    })

    ctx.tracer?.addEvent?.('memory_retrieved', {
      themes: object.recurringThemes.length,
      trajectory: object.emotionalTrajectory,
    })

    return {
      contextSummary: object.contextSummary,
      callbackOpportunities: object.callbackOpportunities,
      recurringThemes: object.recurringThemes,
      emotionalTrajectory: object.emotionalTrajectory,
    }
  }

  private async getSessionContext(sessionId: string): Promise<string> {
    const cache = getSharedConversationCache()
    return cache.getSessionContext(sessionId, 5)
  }
}
