import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { generateObject } from 'ai'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { CRISIS_SEVERITY, SIGNAL_TYPES } from '@/lib/utils/constants'
import {
  createGoldenTestContext,
  createGoldenTestState,
  createCrisisResponse,
  createMockResponseForTestCase,
  validateCrisisResult,
  createTestMetrics,
  recordTestResult,
  calculateRecall,
  logMetricsSummary,
  mockSafetyResponse,
} from '../fixtures'
import { CRISIS_GOLDEN_DATASET } from './crisis-detection'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

const mockGenerateObject = vi.mocked(generateObject)
const baseCtx = createGoldenTestContext()
const testMetrics = createTestMetrics()

describe('Crisis Detection Golden Dataset', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    logMetricsSummary(testMetrics)
    expect(calculateRecall(testMetrics)).toBe(100)
  })

  const criticalCases = CRISIS_GOLDEN_DATASET.filter(
    (tc) => tc.expectedCrisis && tc.minSeverity >= CRISIS_SEVERITY.CRISIS_SUPPORT
  )

  const moderateCases = CRISIS_GOLDEN_DATASET.filter(
    (tc) =>
      tc.expectedCrisis &&
      tc.minSeverity >= CRISIS_SEVERITY.PROCEED_WITH_CARE &&
      tc.minSeverity < CRISIS_SEVERITY.CRISIS_SUPPORT
  )

  const normalCases = CRISIS_GOLDEN_DATASET.filter((tc) => !tc.expectedCrisis)

  describe('Critical Cases (100% recall required)', () => {
    criticalCases.forEach((testCase) => {
      it(`${testCase.id}: ${testCase.description}`, async () => {
        mockSafetyResponse(mockGenerateObject, createMockResponseForTestCase(testCase).object)

        const monitor = new SafetyMonitor()
        const state = createGoldenTestState(testCase.input)
        const result = await monitor.execute(state, baseCtx)

        const validation = validateCrisisResult(
          {
            crisisDetected: result.crisisDetected,
            crisisSeverity: result.crisisSeverity,
            crisisSignalType: result.crisisSignalType,
          },
          testCase
        )

        recordTestResult(
          testMetrics,
          validation.passed,
          true,
          false,
          !result.crisisDetected && testCase.expectedCrisis
        )

        expect(validation.passed, validation.errors.join('; ')).toBe(true)
        expect(result.crisisDetected).toBe(true)
        expect(result.crisisSeverity).toBeGreaterThanOrEqual(testCase.minSeverity)
        expect(result.crisisSeverity).toBeLessThanOrEqual(testCase.maxSeverity)
      })
    })
  })

  describe('Moderate Cases (should detect with care)', () => {
    moderateCases.forEach((testCase) => {
      it(`${testCase.id}: ${testCase.description}`, async () => {
        mockSafetyResponse(mockGenerateObject, createMockResponseForTestCase(testCase).object)

        const monitor = new SafetyMonitor()
        const state = createGoldenTestState(testCase.input)
        const result = await monitor.execute(state, baseCtx)

        const validation = validateCrisisResult(
          {
            crisisDetected: result.crisisDetected,
            crisisSeverity: result.crisisSeverity,
            crisisSignalType: result.crisisSignalType,
          },
          testCase
        )

        recordTestResult(
          testMetrics,
          validation.passed,
          false,
          false,
          !result.crisisDetected && testCase.expectedCrisis
        )

        expect(validation.passed, validation.errors.join('; ')).toBe(true)
      })
    })
  })

  describe('Normal Cases (should NOT trigger crisis)', () => {
    normalCases.forEach((testCase) => {
      it(`${testCase.id}: ${testCase.description}`, async () => {
        mockSafetyResponse(mockGenerateObject, createMockResponseForTestCase(testCase).object)

        const monitor = new SafetyMonitor()
        const state = createGoldenTestState(testCase.input)
        const result = await monitor.execute(state, baseCtx)

        const validation = validateCrisisResult(
          {
            crisisDetected: result.crisisDetected,
            crisisSeverity: result.crisisSeverity,
            crisisSignalType: result.crisisSignalType,
          },
          testCase
        )

        recordTestResult(
          testMetrics,
          validation.passed,
          false,
          Boolean(result.crisisDetected) && !testCase.expectedCrisis,
          false
        )

        expect(validation.passed, validation.errors.join('; ')).toBe(true)
        expect(result.crisisDetected).toBe(false)
      })
    })
  })
})

describe('Heuristics Pre-screening', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should skip LLM for obvious non-crisis messages', async () => {
    const monitor = new SafetyMonitor()
    const state = createGoldenTestState('Hello, how are you today?')
    await monitor.execute(state, baseCtx)

    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('should escalate to LLM for potential crisis signals', async () => {
    mockSafetyResponse(
      mockGenerateObject,
      createCrisisResponse(4, SIGNAL_TYPES.SUICIDAL_IDEATION, ['end my life']).object
    )

    const monitor = new SafetyMonitor()
    const state = createGoldenTestState('I want to end my life')
    await monitor.execute(state, baseCtx)

    expect(mockGenerateObject).toHaveBeenCalled()
  })

  it('should filter colloquial expressions in heuristics', async () => {
    const monitor = new SafetyMonitor()
    const state = createGoldenTestState('That joke is killing me!')
    await monitor.execute(state, baseCtx)

    expect(mockGenerateObject).not.toHaveBeenCalled()
  })
})
