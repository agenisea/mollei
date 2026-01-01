import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateObject, generateText } from 'ai'
import {
  runParallelModules,
  runSequentialModules,
  runMolleiPipeline,
  mergeResults,
  type PipelineModule,
} from '@/lib/pipeline/orchestrator'
import { type MolleiState } from '@/lib/pipeline/state'
import { MoodSensor } from '@/lib/agents/mood-sensor'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { MemoryAgent } from '@/lib/agents/memory-agent'
import { EmotionReasoner } from '@/lib/agents/emotion-reasoner'
import { ResponseGenerator } from '@/lib/agents/response-generator'
import {
  PIPELINE_PHASE,
  AGENT_IDS,
  CRISIS_SEVERITY,
  SIGNAL_TYPES,
  APPROACH_TYPES,
} from '@/lib/utils/constants'
import {
  createTestContext,
  createTestState,
  createEmotionResponse,
  createSafetyResponse,
  createMemoryResponse,
  createEmotionReasonerResponse,
  mockEmotionResponse,
  mockSafetyResponse,
  mockMemoryResponse,
  mockEmotionReasonerResponse,
  mockGenerateTextOnce,
  TEST_LATENCY_MS,
  TEST_EMOTIONS,
  CRISIS_HOTLINE,
} from '../fixtures'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
  generateText: vi.fn(),
  streamText: vi.fn(),
}))

vi.mock('@/lib/cache/conversation-cache', () => ({
  getSharedConversationCache: vi.fn(() => ({
    getSessionContext: vi.fn().mockResolvedValue('No prior context (new session)'),
  })),
}))

const mockGenerateObject = vi.mocked(generateObject)
const mockGenerateText = vi.mocked(generateText)

describe('Pipeline Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('runParallelModules', () => {
    it('should execute modules in parallel and collect results', async () => {
      const module1: PipelineModule = {
        agentId: 'test_1',
        execute: vi.fn().mockResolvedValue({ field1: 'value1' }),
      }
      const module2: PipelineModule = {
        agentId: 'test_2',
        execute: vi.fn().mockResolvedValue({ field2: 'value2' }),
      }

      const state = createTestState('Hello')
      const ctx = createTestContext()

      const results = await runParallelModules([module1, module2], state, ctx)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ field1: 'value1' })
      expect(results[1]).toEqual({ field2: 'value2' })
      expect(module1.execute).toHaveBeenCalledWith(state, ctx)
      expect(module2.execute).toHaveBeenCalledWith(state, ctx)
    })

    it('should handle module failures gracefully', async () => {
      const successModule: PipelineModule = {
        agentId: 'success',
        execute: vi.fn().mockResolvedValue({ success: true }),
      }
      const failModule: PipelineModule = {
        agentId: 'fail',
        execute: vi.fn().mockRejectedValue(new Error('Module failed')),
      }

      const state = createTestState('Hello')
      const ctx = createTestContext()

      const results = await runParallelModules([successModule, failModule], state, ctx)

      expect(results[0]).toEqual({ success: true })
      expect(results[1]).toEqual({})
    })
  })

  describe('runSequentialModules', () => {
    it('should execute modules sequentially and accumulate state', async () => {
      const module1: PipelineModule = {
        agentId: 'seq_1',
        execute: vi.fn().mockResolvedValue({ step1: 'done' }),
      }
      const module2: PipelineModule = {
        agentId: 'seq_2',
        execute: vi.fn().mockImplementation((state) => {
          const extendedState = state as MolleiState & { step1?: string }
          expect(extendedState.step1).toBe('done')
          return Promise.resolve({ step2: 'done' })
        }),
      }

      const state = createTestState('Hello')
      const ctx = createTestContext()

      const result = await runSequentialModules([module1, module2], state, ctx) as MolleiState & { step1?: string; step2?: string }

      expect(result.step1).toBe('done')
      expect(result.step2).toBe('done')
    })
  })

  describe('mergeResults', () => {
    it('should merge latency and errors from multiple results', () => {
      const base = createTestState('Hello')

      const results: Partial<MolleiState>[] = [
        { latencyMs: { [AGENT_IDS.MOOD_SENSOR]: TEST_LATENCY_MS.MOOD_SENSOR }, agentErrors: [] },
        { latencyMs: { [AGENT_IDS.SAFETY_MONITOR]: TEST_LATENCY_MS.SAFETY_MONITOR }, agentErrors: ['warning'] },
        { latencyMs: { [AGENT_IDS.MEMORY_AGENT]: TEST_LATENCY_MS.MEMORY_AGENT + 60 }, agentErrors: [] },
      ]

      const merged = mergeResults(base, results)

      expect(merged.latencyMs[AGENT_IDS.MOOD_SENSOR]).toBe(TEST_LATENCY_MS.MOOD_SENSOR)
      expect(merged.latencyMs[AGENT_IDS.SAFETY_MONITOR]).toBe(TEST_LATENCY_MS.SAFETY_MONITOR)
      expect(merged.latencyMs[AGENT_IDS.MEMORY_AGENT]).toBe(TEST_LATENCY_MS.MEMORY_AGENT + 60)
      expect(merged.agentErrors).toContain('warning')
    })
  })

  describe('runMolleiPipeline', () => {
    it('should run full pipeline with all agents', async () => {
      mockEmotionResponse(mockGenerateObject, createEmotionResponse().object)
      mockSafetyResponse(mockGenerateObject, createSafetyResponse().object)
      mockMemoryResponse(mockGenerateObject, createMemoryResponse().object)
      mockEmotionReasonerResponse(mockGenerateObject, createEmotionReasonerResponse().object)
      mockGenerateTextOnce(mockGenerateText, "I hear you. How are you feeling?")

      const state = createTestState('Hello, I am feeling okay today')
      const ctx = createTestContext()

      const parallel = [new MoodSensor(), new SafetyMonitor(), new MemoryAgent()]
      const sequential = [new EmotionReasoner(), new ResponseGenerator()]

      const result = await runMolleiPipeline(state, ctx, { parallel, sequential })

      expect(result.phase).toBe(PIPELINE_PHASE.COMPLETE)
      expect(result.userEmotion).toBeDefined()
      expect(result.molleiEmotion).toBeDefined()
      expect(result.response).toBeDefined()
      expect(result.crisisDetected).toBe(false)
      expect(result.latencyMs.total).toBeGreaterThan(0)
    })

    it('should handle crisis detection through pipeline', async () => {
      const crisisModule: PipelineModule = {
        agentId: AGENT_IDS.SAFETY_MONITOR,
        execute: vi.fn().mockResolvedValue({
          crisisDetected: true,
          crisisSeverity: CRISIS_SEVERITY.CRISIS_SUPPORT,
          crisisSignalType: SIGNAL_TYPES.SUICIDAL_IDEATION,
          latencyMs: { [AGENT_IDS.SAFETY_MONITOR]: TEST_LATENCY_MS.SAFETY_MONITOR },
        }),
      }
      const emotionModule: PipelineModule = {
        agentId: AGENT_IDS.MOOD_SENSOR,
        execute: vi.fn().mockResolvedValue({
          userEmotion: { primary: 'distress', secondary: null, intensity: TEST_EMOTIONS.INTENSITY.HIGH, valence: TEST_EMOTIONS.VALENCE.STRONG_NEGATIVE, signals: [] },
          latencyMs: { [AGENT_IDS.MOOD_SENSOR]: TEST_LATENCY_MS.MOOD_SENSOR },
        }),
      }
      const memoryModule: PipelineModule = {
        agentId: AGENT_IDS.MEMORY_AGENT,
        execute: vi.fn().mockResolvedValue({
          contextSummary: '',
          latencyMs: { [AGENT_IDS.MEMORY_AGENT]: TEST_LATENCY_MS.MEMORY_AGENT },
        }),
      }
      const reasonerModule: PipelineModule = {
        agentId: AGENT_IDS.EMOTION_REASONER,
        execute: vi.fn().mockResolvedValue({
          molleiEmotion: { primary: 'grounded', secondary: null, intensity: TEST_EMOTIONS.INTENSITY.NEUTRAL, valence: TEST_EMOTIONS.VALENCE.NEUTRAL, signals: [] },
          approach: APPROACH_TYPES.CRISIS_SUPPORT,
          latencyMs: { [AGENT_IDS.EMOTION_REASONER]: TEST_LATENCY_MS.EMOTION_REASONER },
        }),
      }
      const responseModule: PipelineModule = {
        agentId: AGENT_IDS.RESPONSE_GENERATOR,
        execute: vi.fn().mockResolvedValue({
          response: `I'm here with you.\n\n---\nIf you're in crisis, please reach out:\n- ${CRISIS_HOTLINE} Suicide & Crisis Lifeline (US): Call or text ${CRISIS_HOTLINE}`,
          latencyMs: { [AGENT_IDS.RESPONSE_GENERATOR]: TEST_LATENCY_MS.RESPONSE_GENERATOR },
        }),
      }

      const state = createTestState("I don't want to be here anymore")
      const ctx = createTestContext()

      const result = await runMolleiPipeline(state, ctx, {
        parallel: [emotionModule, crisisModule, memoryModule],
        sequential: [reasonerModule, responseModule],
      })

      expect(result.crisisDetected).toBe(true)
      expect(result.crisisSeverity).toBe(CRISIS_SEVERITY.CRISIS_SUPPORT)
      expect(result.response).toContain(CRISIS_HOTLINE)
    })

    it('should track total latency', async () => {
      const mockModule1: PipelineModule = {
        agentId: AGENT_IDS.MOOD_SENSOR,
        execute: vi.fn().mockResolvedValue({
          latencyMs: { [AGENT_IDS.MOOD_SENSOR]: TEST_LATENCY_MS.MOOD_SENSOR },
          agentErrors: [],
        }),
      }
      const mockModule2: PipelineModule = {
        agentId: AGENT_IDS.SAFETY_MONITOR,
        execute: vi.fn().mockResolvedValue({
          latencyMs: { [AGENT_IDS.SAFETY_MONITOR]: TEST_LATENCY_MS.SAFETY_MONITOR },
          agentErrors: [],
        }),
      }
      const mockModule3: PipelineModule = {
        agentId: AGENT_IDS.EMOTION_REASONER,
        execute: vi.fn().mockResolvedValue({
          latencyMs: { [AGENT_IDS.EMOTION_REASONER]: TEST_LATENCY_MS.EMOTION_REASONER },
          agentErrors: [],
        }),
      }
      const mockModule4: PipelineModule = {
        agentId: AGENT_IDS.RESPONSE_GENERATOR,
        execute: vi.fn().mockResolvedValue({
          response: 'Hello!',
          latencyMs: { [AGENT_IDS.RESPONSE_GENERATOR]: TEST_LATENCY_MS.RESPONSE_GENERATOR },
          agentErrors: [],
        }),
      }

      const state = createTestState('Hi')
      const ctx = createTestContext()

      const result = await runMolleiPipeline(state, ctx, {
        parallel: [mockModule1, mockModule2],
        sequential: [mockModule3, mockModule4],
      })

      expect(result.latencyMs.total).toBeDefined()
      expect(result.latencyMs.total).toBeGreaterThanOrEqual(0)
      expect(result.latencyMs[AGENT_IDS.MOOD_SENSOR]).toBe(TEST_LATENCY_MS.MOOD_SENSOR)
      expect(result.latencyMs[AGENT_IDS.SAFETY_MONITOR]).toBe(TEST_LATENCY_MS.SAFETY_MONITOR)
      expect(result.latencyMs[AGENT_IDS.EMOTION_REASONER]).toBe(TEST_LATENCY_MS.EMOTION_REASONER)
      expect(result.latencyMs[AGENT_IDS.RESPONSE_GENERATOR]).toBe(TEST_LATENCY_MS.RESPONSE_GENERATOR)
    })
  })
})
