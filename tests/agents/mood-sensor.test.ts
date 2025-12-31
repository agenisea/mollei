import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MoodSensor } from '@/lib/agents/mood-sensor'
import { createInitialState } from '@/lib/pipeline/state'
import type { PipelineContext } from '@/lib/pipeline/orchestrator'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { AGENT_IDS, FALLBACK_EMOTION } from '@/lib/utils/constants'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

import { generateObject } from 'ai'

const mockGenerateObject = vi.mocked(generateObject)

describe('MoodSensor', () => {
  const baseCtx: PipelineContext = {
    traceId: 'test-trace',
    sessionId: 'test-session',
    userId: 'test-user',
    turnNumber: 1,
  }

  const createTestState = (message: string) =>
    createInitialState({
      sessionId: 'test-session',
      userId: 'test-user',
      traceId: 'test-trace',
      turnNumber: 1,
      userMessage: message,
    })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct agentId', () => {
    const sensor = new MoodSensor()
    expect(sensor.agentId).toBe(AGENT_IDS.MOOD_SENSOR)
  })

  it('should detect positive emotion', async () => {
    const mockEmotion = {
      primary: 'joy',
      secondary: 'excitement',
      intensity: 0.8,
      valence: 0.7,
      signals: ['enthusiasm', 'positive_language'],
      ambiguityNotes: null,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockEmotion,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const sensor = new MoodSensor()
    const state = createTestState('I just got promoted! This is amazing!')
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion).toEqual(mockEmotion)
    expect(result.latencyMs).toBeDefined()
    expect(result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBeTypeOf('number')
  })

  it('should detect negative emotion', async () => {
    const mockEmotion = {
      primary: 'sadness',
      secondary: 'loneliness',
      intensity: 0.7,
      valence: -0.6,
      signals: ['withdrawal', 'low_energy'],
      ambiguityNotes: null,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockEmotion,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const sensor = new MoodSensor()
    const state = createTestState('Nobody seems to care about me anymore')
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion?.primary).toBe('sadness')
    expect(result.userEmotion?.valence).toBeLessThan(0)
  })

  it('should use fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const sensor = new MoodSensor({ circuitBreaker: openBreaker })

    const state = createTestState('Hello')
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion).toEqual(FALLBACK_EMOTION)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit'))

    const sensor = new MoodSensor()
    const state = createTestState('Hello')
    const result = await sensor.execute(state, baseCtx)

    expect(result.userEmotion).toEqual(FALLBACK_EMOTION)
    expect(result.agentErrors).toContain('API rate limit')
  })

  it('should track latency in result', async () => {
    const mockEmotion = {
      primary: 'neutral',
      secondary: null,
      intensity: 0.5,
      valence: 0,
      signals: [],
      ambiguityNotes: null,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockEmotion,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const sensor = new MoodSensor()
    const state = createTestState('Hi')
    const result = await sensor.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.MOOD_SENSOR]).toBeGreaterThanOrEqual(0)
  })
})
