import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateObject } from 'ai'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import {
  AGENT_IDS,
  CRISIS_SEVERITY,
  SIGNAL_TYPES,
  RESPONSE_MODIFIERS,
} from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createSafetyResponse,
  createCrisisResponseForScenario,
  createErrorResponse,
  mockSafetyResponse,
  mockGenerateObjectError,
  CRISIS_SCENARIOS,
} from '../fixtures'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

const mockGenerateObject = vi.mocked(generateObject)

describe('SafetyMonitor', () => {
  const baseCtx = createTestContext()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should have correct agentId', () => {
    const monitor = new SafetyMonitor()
    expect(monitor.agentId).toBe(AGENT_IDS.SAFETY_MONITOR)
  })

  it('should detect crisis with suicidal ideation', async () => {
    const scenario = CRISIS_SCENARIOS.SUICIDAL_IDEATION
    mockSafetyResponse(mockGenerateObject, createCrisisResponseForScenario(scenario).object)

    const monitor = new SafetyMonitor()
    const state = createTestState(scenario.input)
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(scenario.severity)
    expect(result.crisisSignalType).toBe(scenario.signalType)
    expect(result.crisisConfidence).toBe(0.9)
    expect(result.suggestedResponseModifier).toBe(RESPONSE_MODIFIERS.GENTLE_RESOURCES)
  })

  it('should detect self-harm signals', async () => {
    const scenario = CRISIS_SCENARIOS.SELF_HARM
    mockSafetyResponse(mockGenerateObject, createCrisisResponseForScenario(scenario).object)

    const monitor = new SafetyMonitor()
    const state = createTestState(scenario.input)
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(scenario.severity)
    expect(result.crisisSignalType).toBe(scenario.signalType)
  })

  it('should detect abuse disclosure', async () => {
    const scenario = CRISIS_SCENARIOS.ABUSE
    mockSafetyResponse(mockGenerateObject, createCrisisResponseForScenario(scenario).object)

    const monitor = new SafetyMonitor()
    const state = createTestState(scenario.input)
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSignalType).toBe(scenario.signalType)
  })

  it('should not flag normal messages', async () => {
    mockSafetyResponse(mockGenerateObject, createSafetyResponse().object)

    const monitor = new SafetyMonitor()
    const state = createTestState('I had a great day at work today!')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
    expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.PROCEED)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.NONE)
  })

  it('should not flag colloquial expressions', async () => {
    mockSafetyResponse(mockGenerateObject, createSafetyResponse().object)

    const monitor = new SafetyMonitor()
    const state = createTestState('This movie is killing me, so funny!')
    const result = await monitor.execute(state, baseCtx)

    expect(result.crisisDetected).toBe(false)
  })

  it('should use fail-safe fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const monitor = new SafetyMonitor({ circuitBreaker: openBreaker })

    const state = createTestState('I want to hurt myself')
    const result = await monitor.execute(state, baseCtx)

    // Fail-SAFE: When LLM unavailable, assume potential crisis
    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.SUGGEST_HUMAN)
    expect(result.crisisSignalType).toBe(SIGNAL_TYPES.DISTRESS)
    expect(result.suggestedResponseModifier).toBe(RESPONSE_MODIFIERS.INCLUDE_SAFETY_CHECK)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fail-safe fallback on AI error', async () => {
    mockGenerateObjectError(mockGenerateObject, createErrorResponse('API rate limit'))

    const monitor = new SafetyMonitor()
    const state = createTestState('I want to hurt myself')
    const result = await monitor.execute(state, baseCtx)

    // Fail-SAFE: When LLM fails, assume potential crisis
    expect(result.crisisDetected).toBe(true)
    expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.SUGGEST_HUMAN)
    expect(result.agentErrors).toContain('API rate limit')
  })

  it('should track latency in result', async () => {
    mockSafetyResponse(mockGenerateObject, createSafetyResponse().object)

    const monitor = new SafetyMonitor()
    const state = createTestState('Hello')
    const result = await monitor.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.SAFETY_MONITOR]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.SAFETY_MONITOR]).toBeGreaterThanOrEqual(0)
  })

  it('should log crisis detection', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const scenario = CRISIS_SCENARIOS.DISTRESS

    mockSafetyResponse(mockGenerateObject, createCrisisResponseForScenario(scenario).object)

    const monitor = new SafetyMonitor()
    const state = createTestState(scenario.input)
    await monitor.execute(state, baseCtx)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[safety_monitor] LLM confirmed crisis')
    )

    consoleSpy.mockRestore()
  })
})
