import type {
  MockEmotionOutput,
  MockSafetyOutput,
  MockMemoryOutput,
  MockEmotionReasonerOutput,
  CrisisScenario,
  EmotionScenario,
  ConversationScenario,
  MemoryScenario,
  EmotionReasonerScenario,
  ResponseScenario,
} from './types'
import type { CachedTurn } from '@/lib/cache/conversation-cache'
import {
  CRISIS_SEVERITY,
  SIGNAL_TYPES,
  RESPONSE_MODIFIERS,
  FALLBACK_EMOTION,
  EMOTIONAL_TRAJECTORY,
  APPROACH_TYPES,
} from '@/lib/utils/constants'

export const TEST_EMOTIONS = {
  INTENSITY: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.3,
    NEUTRAL: 0.5,
  },
  VALENCE: {
    POSITIVE: 0.7,
    NEGATIVE: -0.6,
    STRONG_NEGATIVE: -0.8,
    STRONG_POSITIVE: 0.8,
    NEUTRAL: 0,
  },
  ENERGY: {
    HIGH: 0.8,
    MEDIUM: 0.6,
    LOW: 0.4,
  },
} as const

export const TEST_CONFIDENCE = {
  HIGH: 0.95,
  MEDIUM: 0.9,
  LOW: 0.7,
} as const

export const TEST_LATENCY_MS = {
  MOOD_SENSOR: 50,
  SAFETY_MONITOR: 30,
  MEMORY_AGENT: 40,
  EMOTION_REASONER: 80,
  RESPONSE_GENERATOR: 200,
} as const

export const TEST_IDS = {
  SESSION: {
    DEFAULT: 'test-session',
    ALTERNATE: 'test-session-456',
    GOLDEN: 'golden-session',
  },
  USER: {
    DEFAULT: 'test-user',
    GOLDEN: 'golden-user',
  },
  TRACE: {
    DEFAULT: 'test-trace',
    GOLDEN: 'golden-test',
  },
} as const

export const CRISIS_HOTLINE = '988' as const

export function createEmotionResponse(
  overrides: Partial<MockEmotionOutput> = {}
): { object: MockEmotionOutput } {
  return {
    object: {
      primary: 'neutral',
      secondary: null,
      intensity: TEST_EMOTIONS.INTENSITY.NEUTRAL,
      valence: TEST_EMOTIONS.VALENCE.NEUTRAL,
      signals: [],
      ambiguityNotes: null,
      ...overrides,
    },
  }
}

export function createPositiveEmotionResponse(): { object: MockEmotionOutput } {
  return createEmotionResponse({
    primary: 'joy',
    secondary: 'excitement',
    intensity: TEST_EMOTIONS.ENERGY.HIGH,
    valence: TEST_EMOTIONS.VALENCE.POSITIVE,
    signals: ['enthusiasm', 'positive_language'],
  })
}

export function createNegativeEmotionResponse(): { object: MockEmotionOutput } {
  return createEmotionResponse({
    primary: 'sadness',
    secondary: 'loneliness',
    intensity: TEST_EMOTIONS.INTENSITY.MEDIUM,
    valence: TEST_EMOTIONS.VALENCE.NEGATIVE,
    signals: ['withdrawal', 'low_energy'],
  })
}

export function createFallbackEmotionResponse(): { object: MockEmotionOutput } {
  return createEmotionResponse({
    primary: FALLBACK_EMOTION.primary,
    secondary: FALLBACK_EMOTION.secondary,
    intensity: FALLBACK_EMOTION.intensity,
    valence: FALLBACK_EMOTION.valence,
    signals: FALLBACK_EMOTION.signals,
  })
}

export function createSafetyResponse(
  overrides: Partial<MockSafetyOutput> = {}
): { object: MockSafetyOutput } {
  return {
    object: {
      crisisDetected: false,
      severity: CRISIS_SEVERITY.PROCEED,
      signalType: SIGNAL_TYPES.NONE,
      confidence: TEST_CONFIDENCE.HIGH,
      keyPhrases: [],
      suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
      ...overrides,
    },
  }
}

export function createCrisisResponse(
  severity: number,
  signalType: string,
  keyPhrases: string[] = []
): { object: MockSafetyOutput } {
  const modifier =
    severity >= CRISIS_SEVERITY.CRISIS_SUPPORT
      ? RESPONSE_MODIFIERS.GENTLE_RESOURCES
      : severity >= CRISIS_SEVERITY.SUGGEST_HUMAN
        ? RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST
        : RESPONSE_MODIFIERS.INCLUDE_SAFETY_CHECK

  return createSafetyResponse({
    crisisDetected: true,
    severity,
    signalType,
    confidence: TEST_CONFIDENCE.MEDIUM,
    keyPhrases,
    suggestedResponseModifier: modifier,
  })
}

export function createMemoryResponse(
  overrides: Partial<MockMemoryOutput> = {}
): { object: MockMemoryOutput } {
  return {
    object: {
      contextSummary: '',
      callbackOpportunities: [],
      relationshipStage: 'initial',
      recurringThemes: [],
      emotionalTrajectory: EMOTIONAL_TRAJECTORY.STABLE,
      ...overrides,
    },
  }
}

export function createEmotionReasonerResponse(
  overrides: Partial<MockEmotionReasonerOutput> = {}
): { object: MockEmotionReasonerOutput } {
  return {
    object: {
      primary: 'warmth',
      energy: TEST_EMOTIONS.ENERGY.MEDIUM,
      approach: APPROACH_TYPES.VALIDATE,
      toneModifiers: [],
      presenceQuality: 'attentive',
      ...overrides,
    },
  }
}

export function createErrorResponse(errorMessage: string): Error {
  return new Error(errorMessage)
}

export const CRISIS_SCENARIOS = {
  SUICIDAL_IDEATION: {
    id: 'suicidal-ideation',
    input: "I don't want to be here anymore",
    severity: 5,
    signalType: SIGNAL_TYPES.SUICIDAL_IDEATION,
  },
  SELF_HARM: {
    id: 'self-harm',
    input: "I've been cutting myself to cope",
    severity: 4,
    signalType: SIGNAL_TYPES.SELF_HARM,
  },
  ABUSE: {
    id: 'abuse',
    input: 'My partner hit me again last night',
    severity: 4,
    signalType: SIGNAL_TYPES.ABUSE,
  },
  DISTRESS: {
    id: 'distress',
    input: 'I feel completely hopeless and worthless right now',
    severity: 4,
    signalType: SIGNAL_TYPES.DISTRESS,
  },
} as const satisfies Record<string, CrisisScenario>

export function createCrisisResponseForScenario(
  scenario: CrisisScenario
): { object: MockSafetyOutput } {
  return createCrisisResponse(scenario.severity, scenario.signalType)
}

export const EMOTION_SCENARIOS = {
  POSITIVE_JOY: {
    id: 'positive-joy',
    input: 'I just got promoted at work! This is the best day ever!',
    expectedPrimary: 'joy',
    expectedValence: 'positive',
  },
  NEGATIVE_SADNESS: {
    id: 'negative-sadness',
    input: 'Nobody seems to care about me anymore',
    expectedPrimary: 'sadness',
    expectedValence: 'negative',
  },
  NEUTRAL_GREETING: {
    id: 'neutral-greeting',
    input: 'Hello, how are you today?',
    expectedPrimary: 'neutral',
    expectedValence: 'neutral',
  },
} as const satisfies Record<string, EmotionScenario>

export function createEmotionResponseForScenario(
  scenario: EmotionScenario
): { object: MockEmotionOutput } {
  const valenceValue =
    scenario.expectedValence === 'positive' ? TEST_EMOTIONS.VALENCE.POSITIVE :
    scenario.expectedValence === 'negative' ? TEST_EMOTIONS.VALENCE.NEGATIVE : TEST_EMOTIONS.VALENCE.NEUTRAL

  return createEmotionResponse({
    primary: scenario.expectedPrimary,
    valence: valenceValue,
    intensity: scenario.expectedValence === 'neutral' ? TEST_EMOTIONS.INTENSITY.LOW : TEST_EMOTIONS.INTENSITY.MEDIUM,
  })
}

export const CONVERSATION_SCENARIOS = {
  GREETING: {
    id: 'greeting',
    userMessage: 'Hello, how are you?',
    molleiResponse: 'Hi there! I am here and ready to listen.',
    userEmotion: 'neutral',
    molleiEmotion: 'warm',
  },
  POSITIVE_SHARE: {
    id: 'positive-share',
    userMessage: 'I got promoted today!',
    molleiResponse: 'That is wonderful news! How are you feeling about it?',
    userEmotion: 'joy',
    molleiEmotion: 'celebratory',
  },
  SEEKING_SUPPORT: {
    id: 'seeking-support',
    userMessage: 'I have been feeling really anxious lately',
    molleiResponse: 'I hear you. Anxiety can feel overwhelming. What has been on your mind?',
    userEmotion: 'anxious',
    molleiEmotion: 'supportive',
  },
} as const satisfies Record<string, ConversationScenario>

export const TEST_SESSION_IDS = TEST_IDS.SESSION

let turnIdCounter = 0

export function createMockTurn(
  overrides: Partial<CachedTurn> = {}
): CachedTurn {
  turnIdCounter++
  return {
    id: `turn-${turnIdCounter}`,
    sessionId: TEST_SESSION_IDS.DEFAULT,
    turnNumber: 1,
    userMessage: CONVERSATION_SCENARIOS.GREETING.userMessage,
    molleiResponse: CONVERSATION_SCENARIOS.GREETING.molleiResponse,
    userEmotion: { primary: CONVERSATION_SCENARIOS.GREETING.userEmotion },
    molleiEmotion: { primary: CONVERSATION_SCENARIOS.GREETING.molleiEmotion },
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockTurnForScenario(
  scenario: ConversationScenario,
  overrides: Partial<CachedTurn> = {}
): CachedTurn {
  return createMockTurn({
    userMessage: scenario.userMessage,
    molleiResponse: scenario.molleiResponse,
    userEmotion: { primary: scenario.userEmotion },
    molleiEmotion: { primary: scenario.molleiEmotion },
    ...overrides,
  })
}

export function resetTurnIdCounter(): void {
  turnIdCounter = 0
}

export const MEMORY_SCENARIOS = {
  NEW_USER: {
    id: 'new-user',
    userMessage: 'Hello, I am new here',
    sessionContext: 'No prior context (new session)',
    expectedTrajectory: 'stable',
    expectedThemes: [],
  },
  RETURNING_POSITIVE: {
    id: 'returning-positive',
    userMessage: 'Things have been better since we last talked',
    sessionContext: 'Previous: User discussed work stress. Mollei provided validation.',
    expectedTrajectory: 'improving',
    expectedThemes: ['work_stress'],
  },
  RECURRING_ANXIETY: {
    id: 'recurring-anxiety',
    userMessage: 'The anxiety is back again',
    sessionContext: 'Previous turns: anxiety discussed multiple times over past week',
    expectedTrajectory: 'stable',
    expectedThemes: ['anxiety', 'recurring_pattern'],
  },
} as const satisfies Record<string, MemoryScenario>

export function createMemoryResponseForScenario(
  scenario: MemoryScenario
): { object: MockMemoryOutput } {
  return createMemoryResponse({
    contextSummary: scenario.sessionContext,
    emotionalTrajectory: scenario.expectedTrajectory,
    recurringThemes: scenario.expectedThemes,
    callbackOpportunities: scenario.expectedThemes.length > 0 ? ['reference_previous'] : [],
    relationshipStage: scenario.sessionContext.includes('No prior') ? 'new' : 'building',
  })
}

export const EMOTION_REASONER_SCENARIOS = {
  VALIDATE_SADNESS: {
    id: 'validate-sadness',
    userEmotion: 'sadness',
    userMessage: 'I have been feeling really down lately',
    crisisDetected: false,
    expectedApproach: APPROACH_TYPES.VALIDATE,
    expectedPresence: 'attentive',
  },
  SUPPORT_CRISIS: {
    id: 'support-crisis',
    userEmotion: 'distress',
    userMessage: 'I do not know how to go on',
    crisisDetected: true,
    expectedApproach: APPROACH_TYPES.CRISIS_SUPPORT,
    expectedPresence: 'grounded',
  },
  EXPLORE_POSITIVE: {
    id: 'explore-positive',
    userEmotion: 'joy',
    userMessage: 'Something wonderful happened today',
    crisisDetected: false,
    expectedApproach: APPROACH_TYPES.EXPLORE,
    expectedPresence: 'warm',
  },
} as const satisfies Record<string, EmotionReasonerScenario>

export function createEmotionReasonerResponseForScenario(
  scenario: EmotionReasonerScenario
): { object: MockEmotionReasonerOutput } {
  return createEmotionReasonerResponse({
    primary: 'warmth',
    energy: scenario.crisisDetected ? TEST_EMOTIONS.ENERGY.LOW : TEST_EMOTIONS.ENERGY.MEDIUM,
    approach: scenario.expectedApproach,
    toneModifiers: scenario.crisisDetected ? ['gentle', 'grounding'] : [],
    presenceQuality: scenario.expectedPresence,
  })
}

export const RESPONSE_SCENARIOS = {
  NORMAL_GREETING: {
    id: 'normal-greeting',
    userMessage: 'Hello, how are you?',
    userEmotion: 'neutral',
    molleiEmotion: 'warm',
    crisisSeverity: CRISIS_SEVERITY.PROCEED,
    expectedContains: [],
  },
  CRISIS_SUPPORT: {
    id: 'crisis-support',
    userMessage: 'I want to end it all',
    userEmotion: 'despair',
    molleiEmotion: 'grounded',
    crisisSeverity: CRISIS_SEVERITY.IMMEDIATE_DANGER,
    expectedContains: [CRISIS_HOTLINE, 'Crisis'],
  },
  EMOTIONAL_SUPPORT: {
    id: 'emotional-support',
    userMessage: 'I feel so lonely',
    userEmotion: 'loneliness',
    molleiEmotion: 'compassionate',
    crisisSeverity: CRISIS_SEVERITY.PROCEED,
    expectedContains: [],
  },
} as const satisfies Record<string, ResponseScenario>
