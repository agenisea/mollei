import { createInitialState, type MolleiState } from '@/lib/pipeline/state'
import type { PipelineContext } from '@/lib/pipeline/orchestrator'
import { TEST_IDS } from './mock-factory'

interface TestContextConfig {
  sessionId?: string
  userId?: string
  traceId?: string
  turnNumber?: number
}

const DEFAULT_CONFIG: Required<TestContextConfig> = {
  sessionId: TEST_IDS.SESSION.DEFAULT,
  userId: TEST_IDS.USER.DEFAULT,
  traceId: TEST_IDS.TRACE.DEFAULT,
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
    traceId: TEST_IDS.TRACE.GOLDEN,
    sessionId: TEST_IDS.SESSION.GOLDEN,
    userId: TEST_IDS.USER.GOLDEN,
  })
}

export function createGoldenTestState(userMessage: string): MolleiState {
  return createTestState(userMessage, {
    traceId: TEST_IDS.TRACE.GOLDEN,
    sessionId: TEST_IDS.SESSION.GOLDEN,
    userId: TEST_IDS.USER.GOLDEN,
  })
}
