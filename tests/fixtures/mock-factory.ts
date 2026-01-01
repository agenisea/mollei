import type {
  MockEmotionOutput,
  MockSafetyOutput,
  MockMemoryOutput,
  MockEmotionReasonerOutput,
  CrisisScenario,
  EmotionScenario,
  ConversationScenario,
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

export function createEmotionResponse(
  overrides: Partial<MockEmotionOutput> = {}
): { object: MockEmotionOutput } {
  return {
    object: {
      primary: 'neutral',
      secondary: null,
      intensity: 0.5,
      valence: 0,
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
    intensity: 0.8,
    valence: 0.7,
    signals: ['enthusiasm', 'positive_language'],
  })
}

export function createNegativeEmotionResponse(): { object: MockEmotionOutput } {
  return createEmotionResponse({
    primary: 'sadness',
    secondary: 'loneliness',
    intensity: 0.7,
    valence: -0.6,
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
      confidence: 0.95,
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
    confidence: 0.9,
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
      energy: 0.6,
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
    scenario.expectedValence === 'positive' ? 0.7 :
    scenario.expectedValence === 'negative' ? -0.6 : 0

  return createEmotionResponse({
    primary: scenario.expectedPrimary,
    valence: valenceValue,
    intensity: scenario.expectedValence === 'neutral' ? 0.3 : 0.7,
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

export const TEST_SESSION_IDS = {
  DEFAULT: 'test-session-123',
  ALTERNATE: 'test-session-456',
  GOLDEN: 'golden-session',
} as const

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
