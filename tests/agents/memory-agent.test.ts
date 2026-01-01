import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateObject } from 'ai'
import { MemoryAgent } from '@/lib/agents/memory-agent'
import { AlwaysOpenCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import { AGENT_IDS, EMOTIONAL_TRAJECTORY } from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createMemoryResponseForScenario,
  createMemoryResponse,
  createErrorResponse,
  mockMemoryResponse,
  mockGenerateObjectError,
  MEMORY_SCENARIOS,
} from '../fixtures'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@/lib/cache/conversation-cache', () => ({
  getSharedConversationCache: vi.fn(() => ({
    getSessionContext: vi.fn().mockResolvedValue('No prior context (new session)'),
  })),
}))

const mockGenerateObject = vi.mocked(generateObject)

describe('MemoryAgent', () => {
  const baseCtx = createTestContext()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct agentId', () => {
    const agent = new MemoryAgent()
    expect(agent.agentId).toBe(AGENT_IDS.MEMORY_AGENT)
  })

  it('should handle new user with no prior context', async () => {
    const scenario = MEMORY_SCENARIOS.NEW_USER
    mockMemoryResponse(
      mockGenerateObject,
      createMemoryResponseForScenario(scenario).object
    )

    const agent = new MemoryAgent()
    const state = createTestState(scenario.userMessage)

    const result = await agent.execute(state, baseCtx)

    expect(result.contextSummary).toContain('No prior context')
    expect(result.emotionalTrajectory).toBe(EMOTIONAL_TRAJECTORY.STABLE)
    expect(result.recurringThemes).toEqual([])
  })

  it('should detect improving trajectory for returning user', async () => {
    const scenario = MEMORY_SCENARIOS.RETURNING_POSITIVE
    mockMemoryResponse(
      mockGenerateObject,
      createMemoryResponseForScenario(scenario).object
    )

    const agent = new MemoryAgent()
    const state = createTestState(scenario.userMessage)

    const result = await agent.execute(state, baseCtx)

    expect(result.emotionalTrajectory).toBe('improving')
    expect(result.recurringThemes).toContain('work_stress')
    expect(result.callbackOpportunities).toContain('reference_previous')
  })

  it('should identify recurring themes', async () => {
    const scenario = MEMORY_SCENARIOS.RECURRING_ANXIETY
    mockMemoryResponse(
      mockGenerateObject,
      createMemoryResponseForScenario(scenario).object
    )

    const agent = new MemoryAgent()
    const state = createTestState(scenario.userMessage)

    const result = await agent.execute(state, baseCtx)

    expect(result.recurringThemes).toContain('anxiety')
    expect(result.recurringThemes).toContain('recurring_pattern')
  })

  it('should use fallback when circuit breaker is open', async () => {
    const openBreaker = new AlwaysOpenCircuitBreaker()
    const agent = new MemoryAgent({ circuitBreaker: openBreaker })

    const state = createTestState('Hello')

    const result = await agent.execute(state, baseCtx)

    expect(result.contextSummary).toBe('')
    expect(result.emotionalTrajectory).toBe(EMOTIONAL_TRAJECTORY.STABLE)
    expect(result.callbackOpportunities).toEqual([])
    expect(result.recurringThemes).toEqual([])
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should use fallback on AI error', async () => {
    mockGenerateObjectError(mockGenerateObject, createErrorResponse('Database unavailable'))

    const agent = new MemoryAgent()
    const state = createTestState('Help me remember')

    const result = await agent.execute(state, baseCtx)

    expect(result.contextSummary).toBe('')
    expect(result.emotionalTrajectory).toBe(EMOTIONAL_TRAJECTORY.STABLE)
    expect(result.agentErrors).toContain('Database unavailable')
  })

  it('should track latency in result', async () => {
    mockMemoryResponse(mockGenerateObject, createMemoryResponse().object)

    const agent = new MemoryAgent()
    const state = createTestState('Hello')

    const result = await agent.execute(state, baseCtx)

    expect(result.latencyMs).toBeDefined()
    expect(typeof result.latencyMs?.[AGENT_IDS.MEMORY_AGENT]).toBe('number')
    expect(result.latencyMs?.[AGENT_IDS.MEMORY_AGENT]).toBeGreaterThanOrEqual(0)
  })

  it('should pass session context to LLM', async () => {
    mockMemoryResponse(mockGenerateObject, createMemoryResponse().object)

    const agent = new MemoryAgent()
    const state = createTestState('How have I been doing?')

    await agent.execute(state, baseCtx)

    expect(mockGenerateObject).toHaveBeenCalledTimes(1)
    const call = mockGenerateObject.mock.calls[0][0]
    const userMessage = call.messages?.find((m: { role: string }) => m.role === 'user')
    expect(userMessage?.content).toContain('Session context:')
    expect(userMessage?.content).toContain('Current message:')
  })
})
