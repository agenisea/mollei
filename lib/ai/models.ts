export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20241022',
  SONNET: 'claude-sonnet-4-5-20241022',
  OPUS: 'claude-opus-4-5-20250101',
} as const

export type ModelId = (typeof MODELS)[keyof typeof MODELS]

export const MODEL_PRICING: Record<ModelId, { input: number; output: number }> = {
  [MODELS.OPUS]: { input: 5.0, output: 25.0 },
  [MODELS.SONNET]: { input: 3.0, output: 15.0 },
  [MODELS.HAIKU]: { input: 1.0, output: 5.0 },
}

export const AGENT_MODELS = {
  MOOD_SENSOR: MODELS.HAIKU,
  MEMORY_AGENT: MODELS.HAIKU,
  SAFETY_MONITOR: MODELS.HAIKU,
  EMOTION_REASONER: MODELS.HAIKU,
  RESPONSE_GENERATOR: MODELS.SONNET,
  CRISIS_ESCALATION: MODELS.OPUS,
} as const
