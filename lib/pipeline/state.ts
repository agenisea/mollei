import { z } from 'zod'

export const EmotionStateSchema = z.object({
  primary: z.string(),
  secondary: z.string().nullable(),
  intensity: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  signals: z.array(z.string()),
  ambiguityNotes: z.string().nullable().optional(),
})

export const MolleiStateSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  traceId: z.string(),
  turnNumber: z.number(),

  userMessage: z.string(),

  userEmotion: EmotionStateSchema.optional(),
  contextSummary: z.string().optional(),
  emotionalTrajectory: z.string().optional(),
  callbackOpportunities: z.array(z.string()).optional(),
  recurringThemes: z.array(z.string()).optional(),

  crisisDetected: z.boolean().optional(),
  crisisSeverity: z.number().min(1).max(5).optional(),
  crisisSignalType: z.string().optional(),
  crisisConfidence: z.number().min(0).max(1).optional(),
  suggestedResponseModifier: z.string().optional(),

  molleiEmotion: EmotionStateSchema.optional(),
  presenceQuality: z.string().optional(),
  approach: z.string().optional(),

  response: z.string().optional(),

  latencyMs: z.record(z.string(), z.number()),
  agentErrors: z.array(z.string()),
  modelUsed: z.string().optional(),
  phase: z.string().optional(),
})

export type EmotionState = z.infer<typeof EmotionStateSchema>
export type MolleiState = z.infer<typeof MolleiStateSchema>

export function createInitialState(params: {
  sessionId: string
  userId: string
  traceId: string
  turnNumber: number
  userMessage: string
}): MolleiState {
  return {
    ...params,
    latencyMs: {},
    agentErrors: [],
    phase: 'idle',
  }
}
