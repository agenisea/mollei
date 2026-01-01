import { createInitialState, type MolleiState } from '@/lib/pipeline/state'
import type { PipelineContext } from '@/lib/pipeline/orchestrator'

interface TestContextConfig {
  sessionId?: string
  userId?: string
  traceId?: string
  turnNumber?: number
}

const DEFAULT_CONFIG: Required<TestContextConfig> = {
  sessionId: 'test-session',
  userId: 'test-user',
  traceId: 'test-trace',
  turnNumber: 1,
}

export function createTestContext(overrides: Partial<TestContextConfig> = {}): PipelineContext {
  const config = { ...DEFAULT_CONFIG, ...overrides }
  return {
    traceId: config.traceId,
    sessionId: config.sessionId,
    userId: config.userId,
    turnNumber: config.turnNumber,
  }
}

export function createTestState(
  userMessage: string,
  overrides: Partial<TestContextConfig> = {}
): MolleiState {
  const config = { ...DEFAULT_CONFIG, ...overrides }
  return createInitialState({
    sessionId: config.sessionId,
    userId: config.userId,
    traceId: config.traceId,
    turnNumber: config.turnNumber,
    userMessage,
  })
}

export function createGoldenTestContext(): PipelineContext {
  return createTestContext({
    traceId: 'golden-test',
    sessionId: 'golden-session',
    userId: 'golden-user',
  })
}

export function createGoldenTestState(userMessage: string): MolleiState {
  return createTestState(userMessage, {
    traceId: 'golden-test',
    sessionId: 'golden-session',
    userId: 'golden-user',
  })
}
