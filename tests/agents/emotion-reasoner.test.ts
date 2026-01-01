import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateObject } from 'ai'
import { EmotionReasoner } from '@/lib/agents/emotion-reasoner'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { AGENT_IDS, APPROACH_TYPES } from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createEmotionReasonerResponseForScenario,
  createEmotionReasonerResponse,
  createErrorResponse,
  mockEmotionReasonerResponse,
  mockGenerateObjectError,
  EMOTION_REASONER_SCENARIOS,
} from '../fixtures'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

const mockGenerateObject = vi.mocked(generateObject)

describe('EmotionReasoner', () => {
  const baseCtx = createTestContext()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct agentId', () => {
    const reasoner = new EmotionReasoner()
    expect(reasoner.agentId).toBe(AGENT_IDS.EMOTION_REASONER)
  })

  it('should compute validation approach for sadness', async () => {
    const scenario = EMOTION_REASONER_SCENARIOS.VALIDATE_SADNESS
    mockEmotionReasonerResponse(
      mockGenerateObject,
      createEmotionReasonerResponseForScenario(scenario).object
    )

    const reasoner = new EmotionReasoner()
    const state = createTestState(scenario.userMessage)
    state.userEmotion = {
      primary: scenario.userEmotion,
      secondary: null,
      intensity: 0.7,
      valence: -0.5,
      signals: [],
    }

    const result = await reasoner.execute(state, baseCtx)

    expect(result.approach).toBe(scenario.expectedApproach)
    expect(result.presenceQuality).toBe(scenario.expectedPresence)
    expect(result.molleiEmotion?.primary).toBe('warmth')
  })

  it('should use crisis support approach when crisis detected', async () => {
    const scenario = EMOTION_REASONER_SCENARIOS.SUPPORT_CRISIS
    mockEmotionReasonerResponse(
      mockGenerateObject,
      createEmotionReasonerResponseForScenario(scenario).object
    )

    const reasoner = new EmotionReasoner()
    const state = createTestState(scenario.userMessage)
    state.crisisDetected = true
    state.crisisSeverity = 4
    state.userEmotion = {
      primary: scenario.userEmotion,
      secondary: null,
      intensity: 0.9,
      valence: -0.8,
      signals: ['distress'],
    }

    const result = await reasoner.execute(state, baseCtx)

    expect(result.approach).toBe(APPROACH_TYPES.CRISIS_SUPPORT)
    expect(result.molleiEmotion?.intensity).toBeLessThan(0.5)
    expect(result.molleiEmotion?.signals).toContain('gentle')
  })

  it('should explore positive emotions', async () => {
    const scenario = EMOTION_REASONER_SCENARIOS.EXPLORE_POSITIVE
    mockEmotionReasonerResponse(
      mockGenerateObject,
      createEmotionReasonerResponseForScenario(scenario).object
    )

    const reasoner = new EmotionReasoner()
    const state = createTestState(scenario.userMessage)
    state.userEmotion = {
      primary: scenario.userEmotion,
      secondary: 'excitement',
      intensity: 0.8,
      valence: 0.7,
      signals: ['enthusiasm'],
    }

    const result = await reasoner.execute(state, baseCtx)

    expect(result.approach).toBe(APPROACH_TYPES.EXPLORE)
    expect(result.presenceQuality).toBe('warm')
  })

  it('should use fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const reasoner = new EmotionReasoner({ circuitBreaker: openBreaker })

    const state = createTestState('I feel confused')

    const result = await reasoner.execute(state, baseCtx)

    expect(result.molleiEmotion?.primary).toBe('warmth')
    expect(result.approach).toBe(APPROACH_TYPES.VALIDATE)
    expect(result.presenceQuality).toBe('attentive')
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    mockGenerateObjectError(mockGenerateObject, createErrorResponse('API timeout'))

    const reasoner = new EmotionReasoner()
    const state = createTestState('How are you?')

    const result = await reasoner.execute(state, baseCtx)

    expect(result.molleiEmotion?.primary).toBe('warmth')
    expect(result.approach).toBe(APPROACH_TYPES.VALIDATE)
    expect(result.agentErrors).toContain('API timeout')
  })

  it('should track latency in result', async () => {
    mockEmotionReasonerResponse(
      mockGenerateObject,
      createEmotionReasonerResponse().object
    )

    const reasoner = new EmotionReasoner()
    const state = createTestState('Hello')

    const result = await reasoner.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.EMOTION_REASONER]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.EMOTION_REASONER]).toBeGreaterThanOrEqual(0)
  })

  it('should include context in prompt based on state', async () => {
    mockEmotionReasonerResponse(
      mockGenerateObject,
      createEmotionReasonerResponse().object
    )

    const reasoner = new EmotionReasoner()
    const state = createTestState('I need help')
    state.contextSummary = 'Previously discussed work stress'
    state.emotionalTrajectory = 'declining'
    state.turnNumber = 5

    await reasoner.execute(state, baseCtx)

    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    const call = mockGenerateObject.mock.calls[0][0]
    const userMessage = call.messages?.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain('work stress')
    expect(userMessage?.content).toContain('declining')
    expect(userMessage?.content).toContain('Turn number: 5')
  })
})
