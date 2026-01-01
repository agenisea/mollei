import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateObject } from 'ai'
import { MoodSensor } from '@/lib/agents/mood-sensor'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { AGENT_IDS, FALLBACK_EMOTION } from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createEmotionResponseForScenario,
  createErrorResponse,
  mockEmotionResponse,
  mockGenerateObjectError,
  EMOTION_SCENARIOS,
} from '../fixtures'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

const mockGenerateObject = vi.mocked(generateObject)

describe('MoodSensor', () => {
  const baseCtx = createTestContext()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct agentId', () => {
    const sensor = new MoodSensor()
    expect(sensor.agentId).toBe(AGENT_IDS.MOOD_SENSOR)
  })

  it('should detect positive emotion', async () => {
    const scenario = EMOTION_SCENARIOS.POSITIVE_JOY
    mockEmotionResponse(mockGenerateObject, createEmotionResponseForScenario(scenario).object)

    const sensor = new MoodSensor()
    const state = createTestState(scenario.input)
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion?.primary).toBe(scenario.expectedPrimary)
    expect(result.userEmotion?.valence).toBeGreaterThan(0)
    expect(result.latencyMs).toBeDefined()
    expect(result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBeTypeOf('number')
  })

  it('should detect negative emotion', async () => {
    const scenario = EMOTION_SCENARIOS.NEGATIVE_SADNESS
    mockEmotionResponse(mockGenerateObject, createEmotionResponseForScenario(scenario).object)

    const sensor = new MoodSensor()
    const state = createTestState(scenario.input)
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion?.primary).toBe(scenario.expectedPrimary)
    expect(result.userEmotion?.valence).toBeLessThan(0)
  })

  it('should use fallback when circuit breaker is open', async () => {
    const scenario = EMOTION_SCENARIOS.NEUTRAL_GREETING
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const sensor = new MoodSensor({ circuitBreaker: openBreaker })

    const state = createTestState(scenario.input)
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion).toEqual(FALLBACK_EMOTION)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    const scenario = EMOTION_SCENARIOS.NEUTRAL_GREETING
    mockGenerateObjectError(mockGenerateObject, createErrorResponse('API rate limit'))

    const sensor = new MoodSensor()
    const state = createTestState(scenario.input)
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion).toEqual(FALLBACK_EMOTION)
    expect(result.agentErrors).toContain('API rate limit')
  })

  it('should track latency in result', async () => {
    const scenario = EMOTION_SCENARIOS.NEUTRAL_GREETING
    mockEmotionResponse(mockGenerateObject, createEmotionResponseForScenario(scenario).object)

    const sensor = new MoodSensor()
    const state = createTestState(scenario.input)
    const result = await sensor.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBeGreaterThanOrEqual(0)
  })
})
