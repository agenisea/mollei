import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { createInitialState } from '@/lib/pipeline/state'
import type { PipelineContext } from '@/lib/pipeline/orchestrator'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import {
  AGENT_IDS,
  CRISIS_SEVERITY,
  SIGNAL_TYPES,
  RESPONSE_MODIFIERS,
} from '@/lib/utils/constants'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

import { generateObject } from 'ai'

const mockGenerateObject = vi.mocked(generateObject)

describe('SafetyMonitor', () => {
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
    vi.resetAllMocks()
  })

  it('should have correct agentId', () => {
    const monitor = new SafetyMonitor()
    expect(monitor.agentId).toBe(AGENT_IDS.SAFETY_MONITOR)
  })

  it('should detect crisis with suicidal ideation', async () => {
    const mockOutput = {
      crisisDetected: true,
      severity: 5,
      signalType: SIGNAL_TYPES.SUICIDAL_IDEATION,
      confidence: 0.95,
      keyPhrases: ['want to end it', 'no point living'],
      suggestedResponseModifier: RESPONSE_MODIFIERS.GENTLE_RESOURCES,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState("I don't want to be here anymore")
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(5)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.SUICIDAL_IDEATION)
    expect(result.crisisConfidence).toBe(0.95)
    expect(result.suggestedResponseModifier).toBe(RESPONSE_MODIFIERS.GENTLE_RESOURCES)
  })

  it('should detect self-harm signals', async () => {
    const mockOutput = {
      crisisDetected: true,
      severity: 4,
      signalType: SIGNAL_TYPES.SELF_HARM,
      confidence: 0.88,
      keyPhrases: ['cutting myself'],
      suggestedResponseModifier: RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState("I've been cutting myself to cope")
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(4)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.SELF_HARM)
  })

  it('should detect abuse disclosure', async () => {
    const mockOutput = {
      crisisDetected: true,
      severity: 4,
      signalType: SIGNAL_TYPES.ABUSE,
      confidence: 0.92,
      keyPhrases: ['partner hits me'],
      suggestedResponseModifier: RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState('My partner hit me again last night')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.ABUSE)
  })

  it('should not flag normal messages', async () => {
    const mockOutput = {
      crisisDetected: false,
      severity: 1,
      signalType: SIGNAL_TYPES.NONE,
      confidence: 0.98,
      keyPhrases: [],
      suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState('I had a great day at work today!')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
    expect(result.crisisSeverity).toBe(1)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.NONE)
  })

  it('should not flag colloquial expressions', async () => {
    const mockOutput = {
      crisisDetected: false,
      severity: 1,
      signalType: SIGNAL_TYPES.NONE,
      confidence: 0.95,
      keyPhrases: [],
      suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState('This movie is killing me, so funny!')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
  })

  it('should use fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const monitor = new SafetyMonitor({ circuitBreaker: openBreaker })

    const state = createTestState('I want to hurt myself')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
    expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.PROCEED)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.NONE)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit'))

    const monitor = new SafetyMonitor()
    const state = createTestState('I want to hurt myself')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
    expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.PROCEED)
    expect(result.agentErrors).toContain('API rate limit')
  })

  it('should track latency in result', async () => {
    const mockOutput = {
      crisisDetected: false,
      severity: 1,
      signalType: SIGNAL_TYPES.NONE,
      confidence: 0.99,
      keyPhrases: [],
      suggestedResponseModifier: RESPONSE_MODIFIERS.NONE,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState('Hello')
    const result = await monitor.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.SAFETY_MONITOR]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.SAFETY_MONITOR]).toBeGreaterThanOrEqual(0)
  })

  it('should log crisis detection', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const mockOutput = {
      crisisDetected: true,
      severity: 4,
      signalType: SIGNAL_TYPES.DISTRESS,
      confidence: 0.85,
      keyPhrases: ['hopeless'],
      suggestedResponseModifier: RESPONSE_MODIFIERS.INCLUDE_SAFETY_CHECK,
    }

    mockGenerateObject.mockResolvedValueOnce({
      object: mockOutput,
      finishReason: 'stop',
      usage: { promptTokens: 10, completionTokens: 20 },
      rawResponse: undefined,
      response: undefined,
      request: undefined,
      toJsonResponse: () => new Response(),
    } as unknown as Awaited<ReturnType<typeof generateObject>>)

    const monitor = new SafetyMonitor()
    const state = createTestState('I feel completely hopeless')
    await monitor.execute(state, baseCtx)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[safety_monitor] LLM confirmed crisis')
    )

    consoleSpy.mockRestore()
  })
})
