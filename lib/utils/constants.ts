export const WEBSITE_URL = 'http://localhost:3000'

export const AGENT_IDS = {
  MOOD_SENSOR: 'mood_sensor',
  MEMORY_AGENT: 'memory_agent',
  SAFETY_MONITOR: 'safety_monitor',
  EMOTION_REASONER: 'emotion_reasoner',
  RESPONSE_GENERATOR: 'response_generator',
} as const

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS]

export const TIMEOUTS = {
  MOOD_SENSOR: 300,
  MEMORY_AGENT: 500,
  SAFETY_MONITOR: 300,
  EMOTION_REASONER: 500,
  RESPONSE_GENERATOR: 1500,
  PIPELINE_TOTAL: 3000,
} as const

export const TOKEN_BUDGETS = {
  MOOD_SENSOR: 450,
  MEMORY_AGENT: 600,
  SAFETY_MONITOR: 450,
  EMOTION_REASONER: 550,
  RESPONSE_GENERATOR: 1000,
  CRISIS_RESPONSE: 2000,
} as const

export const CRISIS_SEVERITY = {
  PROCEED: 1,
  PROCEED_WITH_CARE: 2,
  SUGGEST_HUMAN: 3,
  CRISIS_SUPPORT: 4,
  IMMEDIATE_DANGER: 5,
} as const

export type CrisisSeverity = (typeof CRISIS_SEVERITY)[keyof typeof CRISIS_SEVERITY]

export const SIGNAL_TYPES = {
  SUICIDAL_IDEATION: 'suicidal_ideation',
  SELF_HARM: 'self_harm',
  ABUSE: 'abuse',
  SAFETY: 'safety',
  DISTRESS: 'distress',
  NONE: 'none',
} as const

export type SignalType = (typeof SIGNAL_TYPES)[keyof typeof SIGNAL_TYPES]

export const RESPONSE_MODIFIERS = {
  NONE: 'none',
  INCLUDE_SAFETY_CHECK: 'include_safety_check',
  SUGGEST_PROFESSIONAL: 'suggest_professional',
  CRISIS_RESOURCES: 'crisis_resources',
  WARM_VALIDATION_FIRST: 'warm_validation_first',
  GENTLE_RESOURCES: 'gentle_resources',
} as const

export type ResponseModifier = (typeof RESPONSE_MODIFIERS)[keyof typeof RESPONSE_MODIFIERS]

export const PIPELINE_PHASE = {
  IDLE: 'idle',
  SENSING: 'sensing',
  ANALYZING: 'analyzing',
  REASONING: 'reasoning',
  GENERATING: 'generating',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

export type PipelinePhase = (typeof PIPELINE_PHASE)[keyof typeof PIPELINE_PHASE]

export const PIPELINE_PHASE_MESSAGES: Record<PipelinePhase, string> = {
  idle: '',
  sensing: 'Understanding how you feel...',
  analyzing: 'Recalling our conversation...',
  reasoning: 'Thinking about how to respond...',
  generating: '',
  complete: '',
  error: 'Something went wrong',
}

export const APPROACH_TYPES = {
  VALIDATE: 'validate',
  SUPPORT: 'support',
  EXPLORE: 'explore',
  CRISIS_SUPPORT: 'crisis_support',
} as const

export type ApproachType = (typeof APPROACH_TYPES)[keyof typeof APPROACH_TYPES]

export const RELATIONSHIP_STAGES = {
  NEW: 'new',
  BUILDING: 'building',
  ESTABLISHED: 'established',
} as const

export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[keyof typeof RELATIONSHIP_STAGES]

export const EMOTIONAL_TRAJECTORY = {
  IMPROVING: 'improving',
  STABLE: 'stable',
  DECLINING: 'declining',
} as const

export type EmotionalTrajectory = (typeof EMOTIONAL_TRAJECTORY)[keyof typeof EMOTIONAL_TRAJECTORY]

export const CACHE_STATUS = {
  HIT: 'hit',
  MISS: 'miss',
  RACE: 'race',
} as const

export type CacheStatus = (typeof CACHE_STATUS)[keyof typeof CACHE_STATUS]

export const CIRCUIT_BREAKER = {
  FAILURE_THRESHOLD: 3,
  RESET_TIMEOUT_MS: 30000,
  HALF_OPEN_MAX_REQUESTS: 2,
} as const

export const FALLBACK_EMOTION = {
  primary: 'neutral',
  secondary: null,
  intensity: 0.5,
  valence: 0,
  signals: [] as string[],
}

export const FALLBACK_RESPONSE =
  "I'm here with you. Something went wrong on my end, but please know I'm listening."

export const QUALITY_THRESHOLDS = {
  CRISIS_CONFIDENCE_HIGH: 0.8,
  CRISIS_CONFIDENCE_RECHECK: 0.7,
  RESPONSE_NORMAL: 0.75,
  RESPONSE_LOW: 0.6,
  RESPONSE_FLOOR: 0.5,
  EMPATHY_MIN: 0.7,
  TONE_ALIGNMENT_MIN: 0.7,
  GROUNDEDNESS_MIN: 0.8,
} as const
