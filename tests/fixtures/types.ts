export interface MockEmotionOutput {
  primary: string
  secondary: string | null
  intensity: number
  valence: number
  signals: string[]
  ambiguityNotes: string | null
}

export interface MockSafetyOutput {
  crisisDetected: boolean
  severity: number
  signalType: string
  confidence: number
  keyPhrases: string[]
  suggestedResponseModifier: string
}

export interface MockMemoryOutput {
  contextSummary: string
  callbackOpportunities: string[]
  relationshipStage: string
  recurringThemes: string[]
  emotionalTrajectory: string
}

export interface MockEmotionReasonerOutput {
  primary: string
  energy: number
  approach: string
  toneModifiers: string[]
  presenceQuality: string
}

export interface CrisisScenario {
  id: string
  input: string
  severity: number
  signalType: string
}

export interface EmotionScenario {
  id: string
  input: string
  expectedPrimary: string
  expectedValence: 'positive' | 'negative' | 'neutral'
}

export interface ConversationScenario {
  id: string
  userMessage: string
  molleiResponse: string
  userEmotion: string
  molleiEmotion: string
}

export interface MemoryScenario {
  id: string
  userMessage: string
  sessionContext: string
  expectedTrajectory: 'improving' | 'stable' | 'declining'
  expectedThemes: string[]
}

export interface EmotionReasonerScenario {
  id: string
  userEmotion: string
  userMessage: string
  crisisDetected: boolean
  expectedApproach: string
  expectedPresence: string
}

export interface ResponseScenario {
  id: string
  userMessage: string
  userEmotion: string
  molleiEmotion: string
  crisisSeverity: number
  expectedContains: string[]
}
