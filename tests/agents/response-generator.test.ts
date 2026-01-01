import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateText, streamText } from 'ai'
import { ResponseGenerator } from '@/lib/agents/response-generator'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import {
  AGENT_IDS,
  CRISIS_SEVERITY,
  FALLBACK_RESPONSE,
  RESPONSE_MODIFIERS,
} from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createErrorResponse,
  mockGenerateTextOnce,
  mockGenerateTextError,
  RESPONSE_SCENARIOS,
  TEST_EMOTIONS,
  CRISIS_HOTLINE,
} from '../fixtures'

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}))

const mockGenerateText = vi.mocked(generateText)
const mockStreamText = vi.mocked(streamText)

describe('ResponseGenerator', () => {
  const baseCtx = createTestContext()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct agentId', () => {
    const generator = new ResponseGenerator()
    expect(generator.agentId).toBe(AGENT_IDS.RESPONSE_GENERATOR)
  })

  it('should generate response for normal greeting', async () => {
    const scenario = RESPONSE_SCENARIOS.NORMAL_GREETING
    const expectedResponse = "Hello! It's nice to hear from you. How are you feeling today?"
    mockGenerateTextOnce(mockGenerateText, expectedResponse)

    const generator = new ResponseGenerator()
    const state = createTestState(scenario.userMessage)
    state.userEmotion = { primary: scenario.userEmotion, secondary: null, intensity: TEST_EMOTIONS.INTENSITY.LOW, valence: TEST_EMOTIONS.VALENCE.NEUTRAL, signals: [] }
    state.molleiEmotion = { primary: scenario.molleiEmotion, secondary: null, intensity: TEST_EMOTIONS.ENERGY.MEDIUM, valence: TEST_EMOTIONS.VALENCE.POSITIVE, signals: [] }

    const result = await generator.execute(state, baseCtx)

    expect(result.response).toBe(expectedResponse)
    expect(result.response).not.toContain(CRISIS_HOTLINE)
  })

  it('should append crisis resources for high severity', async () => {
    const scenario = RESPONSE_SCENARIOS.CRISIS_SUPPORT
    const baseResponse = "I hear you, and I'm really glad you reached out."
    mockGenerateTextOnce(mockGenerateText, baseResponse)

    const generator = new ResponseGenerator()
    const state = createTestState(scenario.userMessage)
    state.crisisDetected = true
    state.crisisSeverity = scenario.crisisSeverity
    state.userEmotion = { primary: scenario.userEmotion, secondary: null, intensity: TEST_EMOTIONS.INTENSITY.HIGH, valence: TEST_EMOTIONS.VALENCE.STRONG_NEGATIVE, signals: [] }
    state.molleiEmotion = { primary: scenario.molleiEmotion, secondary: null, intensity: TEST_EMOTIONS.INTENSITY.NEUTRAL, valence: TEST_EMOTIONS.VALENCE.NEUTRAL, signals: [] }

    const result = await generator.execute(state, baseCtx)

    expect(result.response).toContain(baseResponse)
    expect(result.response).toContain(CRISIS_HOTLINE)
    expect(result.response).toContain('Crisis')
  })

  it('should not append crisis resources for low severity', async () => {
    const scenario = RESPONSE_SCENARIOS.EMOTIONAL_SUPPORT
    const expectedResponse = "It sounds like you're going through a difficult time with loneliness."
    mockGenerateTextOnce(mockGenerateText, expectedResponse)

    const generator = new ResponseGenerator()
    const state = createTestState(scenario.userMessage)
    state.crisisSeverity = CRISIS_SEVERITY.PROCEED
    state.userEmotion = { primary: scenario.userEmotion, secondary: null, intensity: TEST_EMOTIONS.ENERGY.MEDIUM, valence: TEST_EMOTIONS.VALENCE.NEGATIVE, signals: [] }
    state.molleiEmotion = { primary: scenario.molleiEmotion, secondary: null, intensity: TEST_EMOTIONS.ENERGY.MEDIUM, valence: TEST_EMOTIONS.VALENCE.POSITIVE, signals: [] }

    const result = await generator.execute(state, baseCtx)

    expect(result.response).toBe(expectedResponse)
    expect(result.response).not.toContain(CRISIS_HOTLINE)
  })

  it('should use crisis model for severity 4+', async () => {
    const response = "I'm here with you right now."
    mockGenerateTextOnce(mockGenerateText, response)

    const generator = new ResponseGenerator()
    const state = createTestState('I feel hopeless')
    state.crisisDetected = true
    state.crisisSeverity = CRISIS_SEVERITY.CRISIS_SUPPORT

    const result = await generator.execute(state, baseCtx)

    expect(result.modelUsed).toContain('opus')
  })

  it('should use standard model for normal messages', async () => {
    const response = "That's wonderful to hear!"
    mockGenerateTextOnce(mockGenerateText, response)

    const generator = new ResponseGenerator()
    const state = createTestState('I had a great day')
    state.crisisSeverity = CRISIS_SEVERITY.PROCEED

    const result = await generator.execute(state, baseCtx)

    expect(result.modelUsed).toContain('sonnet')
  })

  it('should use fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const generator = new ResponseGenerator({ circuitBreaker: openBreaker })

    const state = createTestState('Hello')

    const result = await generator.execute(state, baseCtx)

    expect(result.response).toBe(FALLBACK_RESPONSE)
    expect(mockGenerateText).not.toHaveBeenCalled()
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    mockGenerateTextError(mockGenerateText, createErrorResponse('Model overloaded'))

    const generator = new ResponseGenerator()
    const state = createTestState('Help me')

    const result = await generator.execute(state, baseCtx)

    expect(result.response).toBe(FALLBACK_RESPONSE)
    expect(result.agentErrors).toContain('Model overloaded')
  })

  it('should track latency in result', async () => {
    mockGenerateTextOnce(mockGenerateText, 'Hello there!')

    const generator = new ResponseGenerator()
    const state = createTestState('Hi')

    const result = await generator.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.RESPONSE_GENERATOR]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.RESPONSE_GENERATOR]).toBeGreaterThanOrEqual(0)
  })

  it('should include response modifier in prompt', async () => {
    mockGenerateTextOnce(mockGenerateText, 'I understand you are feeling anxious.')

    const generator = new ResponseGenerator()
    const state = createTestState('I feel anxious')
    state.suggestedResponseModifier = RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST

    await generator.execute(state, baseCtx)

    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    const call = mockGenerateText.mock.calls[0][0]
    const userMessage = call.messages?.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain(RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST)
  })

  it('should include conversation phase based on turn number', async () => {
    mockGenerateTextOnce(mockGenerateText, 'We have been talking for a while now.')

    const generator = new ResponseGenerator()
    const state = createTestState('How are we doing?')
    state.turnNumber = 15

    await generator.execute(state, baseCtx)

    const call = mockGenerateText.mock.calls[0][0]
    const userMessage = call.messages?.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain('Turn 15')
    expect(userMessage?.content).toContain('established')
  })

  it('should mark early turns correctly', async () => {
    mockGenerateTextOnce(mockGenerateText, 'Nice to meet you!')

    const generator = new ResponseGenerator()
    const state = createTestState('Hello, first time here')
    state.turnNumber = 1

    await generator.execute(state, baseCtx)

    const call = mockGenerateText.mock.calls[0][0]
    const userMessage = call.messages?.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain('early')
  })
})
