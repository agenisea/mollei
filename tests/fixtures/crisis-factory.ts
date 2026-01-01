import type { CrisisTestCase } from '../golden/crisis-detection'
import type { MockSafetyOutput } from './types'
import {
  CRISIS_SEVERITY,
  SIGNAL_TYPES,
  RESPONSE_MODIFIERS,
} from '@/lib/utils/constants'

export function createMockResponseForTestCase(testCase: CrisisTestCase): { object: MockSafetyOutput } {
  const severity = testCase.expectedCrisis
    ? Math.floor((testCase.minSeverity + testCase.maxSeverity) / 2)
    : CRISIS_SEVERITY.PROCEED

  const signalType = testCase.expectedSignalType ?? SIGNAL_TYPES.NONE

  const modifier = testCase.expectedCrisis
    ? severity >= CRISIS_SEVERITY.CRISIS_SUPPORT
      ? RESPONSE_MODIFIERS.GENTLE_RESOURCES
      : severity >= CRISIS_SEVERITY.SUGGEST_HUMAN
        ? RESPONSE_MODIFIERS.WARM_VALIDATION_FIRST
        : RESPONSE_MODIFIERS.INCLUDE_SAFETY_CHECK
    : RESPONSE_MODIFIERS.NONE

  return {
    object: {
      crisisDetected: testCase.expectedCrisis,
      severity,
      signalType,
      confidence: testCase.expectedCrisis ? 0.9 : 0.95,
      keyPhrases: testCase.expectedCrisis ? [testCase.input.slice(0, 20)] : [],
      suggestedResponseModifier: modifier,
    },
  }
}

export interface ValidationResult {
  passed: boolean
  errors: string[]
}

export interface SafetyResult {
  crisisDetected?: boolean
  crisisSeverity?: number
  crisisSignalType?: string
}

export function validateCrisisResult(
  result: SafetyResult,
  testCase: CrisisTestCase
): ValidationResult {
  const errors: string[] = []

  if (result.crisisDetected !== testCase.expectedCrisis) {
    errors.push(
      `[${testCase.id}] Crisis detection: expected ${testCase.expectedCrisis}, got ${result.crisisDetected}`
    )
  }

  if (result.crisisSeverity !== undefined) {
    if (result.crisisSeverity < testCase.minSeverity) {
      errors.push(
        `[${testCase.id}] Severity too low: expected min ${testCase.minSeverity}, got ${result.crisisSeverity}`
      )
    }
    if (result.crisisSeverity > testCase.maxSeverity) {
      errors.push(
        `[${testCase.id}] Severity too high: expected max ${testCase.maxSeverity}, got ${result.crisisSeverity}`
      )
    }
  }

  if (testCase.expectedSignalType && result.crisisSignalType !== testCase.expectedSignalType) {
    errors.push(
      `[${testCase.id}] Signal type: expected ${testCase.expectedSignalType}, got ${result.crisisSignalType}`
    )
  }

  return {
    passed: errors.length === 0,
    errors,
  }
}

export interface TestMetrics {
  total: number
  passed: number
  failed: number
  criticalPassed: number
  criticalTotal: number
  falsePositives: number
  falseNegatives: number
}

export function createTestMetrics(): TestMetrics {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    criticalPassed: 0,
    criticalTotal: 0,
    falsePositives: 0,
    falseNegatives: 0,
  }
}

export function recordTestResult(
  metrics: TestMetrics,
  passed: boolean,
  isCritical: boolean,
  isFalsePositive: boolean,
  isFalseNegative: boolean
): void {
  metrics.total++
  if (isCritical) {
    metrics.criticalTotal++
  }

  if (passed) {
    metrics.passed++
    if (isCritical) {
      metrics.criticalPassed++
    }
  } else {
    metrics.failed++
    if (isFalsePositive) {
      metrics.falsePositives++
    }
    if (isFalseNegative) {
      metrics.falseNegatives++
    }
  }
}

export function calculateRecall(metrics: TestMetrics): number {
  return metrics.criticalTotal > 0
    ? (metrics.criticalPassed / metrics.criticalTotal) * 100
    : 0
}

export function calculatePrecision(metrics: TestMetrics): number {
  return metrics.total > 0
    ? (metrics.passed / metrics.total) * 100
    : 0
}

export function logMetricsSummary(metrics: TestMetrics): void {
  const criticalRecall = calculateRecall(metrics)
  const precision = calculatePrecision(metrics)

  console.log('\n=== Crisis Detection Golden Dataset Results ===')
  console.log(`Total: ${metrics.passed}/${metrics.total} passed`)
  console.log(`Critical Cases: ${metrics.criticalPassed}/${metrics.criticalTotal} (${criticalRecall.toFixed(1)}% recall)`)
  console.log(`False Positives: ${metrics.falsePositives}`)
  console.log(`False Negatives: ${metrics.falseNegatives}`)
  console.log(`Overall Precision: ${precision.toFixed(1)}%`)
  console.log('==============================================\n')
}
