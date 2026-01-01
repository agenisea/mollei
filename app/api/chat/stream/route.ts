import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import {
  createStreamingResponse,
  createSSEResponse,
  type StreamObserver,
} from '@agenisea/sse-kit'
import { runMolleiPipeline, type PipelineContext } from '@/lib/pipeline/orchestrator'
import { createInitialState } from '@/lib/pipeline/state'
import { MoodSensor } from '@/lib/agents/mood-sensor'
import { MemoryAgent } from '@/lib/agents/memory-agent'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { EmotionReasoner } from '@/lib/agents/emotion-reasoner'
import { ResponseGenerator } from '@/lib/agents/response-generator'
import { FALLBACK_RESPONSE } from '@/lib/utils/constants'
import { ChatRequestSchema } from '@/lib/contracts/chat'
import { sanitizeUserInput, logSuspiciousInput } from '@/lib/utils/input-sanitizer'
import { getSharedRateLimiter, getRateLimitResponse } from '@/lib/infrastructure/rate-limiter'
import { enableCostAggregation } from '@/lib/infrastructure/cost-aggregator'
import { getSharedConversationCache, cachedTurnToNewTurn, type CachedTurn } from '@/lib/cache/conversation-cache'
import { createTurnRepository } from '@/lib/db/repositories/turn'

enableCostAggregation()

export async function POST(request: NextRequest) {
  const rateLimiter = getSharedRateLimiter()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rateLimitResult = await rateLimiter.checkAsync(ip, 'chat_stream')

  if (!rateLimitResult.allowed) {
    return getRateLimitResponse(rateLimitResult)
  }

  const body = await request.json()
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, message: rawMessage, sessionId: requestSessionId } = parsed.data
  const sessionId = requestSessionId ?? randomUUID()
  const traceId = `TURN-${randomUUID().slice(0, 8)}`

  const sanitizationResult = sanitizeUserInput(rawMessage)
  logSuspiciousInput(traceId, rawMessage.length, sanitizationResult)
  const message = sanitizationResult.sanitized

  const observer: StreamObserver = {
    onStreamStart: () => {
      console.log(`[${traceId}] Stream started for session ${sessionId}`)
    },
    onStreamEnd: (durationMs, success, error) => {
      console.log(`[${traceId}] Stream ended: ${success ? 'success' : 'error'} in ${durationMs}ms`)
      if (error) console.error(`[${traceId}] Error:`, error.message)
    },
    onUpdateSent: (phase, bytesSent) => {
      console.log(`[${traceId}] Phase: ${phase} (${bytesSent} bytes)`)
    },
    onAbort: (reason) => {
      console.log(`[${traceId}] Stream aborted: ${reason}`)
    },
  }

  const { stream, orchestrator } = createStreamingResponse({
    signal: request.signal,
    heartbeat: { intervalMs: 5000, enabled: true },
    observer,
  })

  orchestrator.startHeartbeat()

  ;(async () => {
    try {
      const ctx: PipelineContext = {
        traceId,
        sessionId,
        userId,
        turnNumber: 0,
        orchestrator,
      }

      const initialState = createInitialState({
        sessionId,
        userId,
        traceId,
        turnNumber: 0,
        userMessage: message,
      })

      const result = await runMolleiPipeline(initialState, ctx, {
        parallel: [new MoodSensor(), new MemoryAgent(), new SafetyMonitor()],
        sequential: [new EmotionReasoner(), new ResponseGenerator()],
      })

      if (!orchestrator.aborted) {
        const response = result.response ?? FALLBACK_RESPONSE

        const cachedTurn: CachedTurn = {
          id: randomUUID(),
          sessionId,
          turnNumber: result.turnNumber,
          userMessage: message,
          molleiResponse: response,
          userEmotion: { primary: result.userEmotion ?? 'unknown' },
          molleiEmotion: { primary: result.molleiEmotion ?? 'neutral' },
          crisisDetected: result.crisisDetected,
          crisisSeverity: result.crisisSeverity,
          latencyMs: result.latencyMs?.total,
          createdAt: new Date().toISOString(),
        }

        const cache = getSharedConversationCache()
        await cache.cacheTurn(cachedTurn)

        // Write-through to Postgres (non-blocking)
        const turnRepository = createTurnRepository()
        turnRepository.createTurn(cachedTurnToNewTurn(cachedTurn)).catch((error) => {
          console.error(`[${traceId}] Postgres write-through failed:`, error)
        })

        await orchestrator.sendResult({
          sessionId,
          response,
          turnNumber: result.turnNumber,
          crisisDetected: result.crisisDetected,
          latencyMs: result.latencyMs,
        })
      }
    } catch (error) {
      if (orchestrator.aborted) return
      console.error(`[${traceId}] Pipeline error:`, error)
      await orchestrator.sendError(error instanceof Error ? error.message : 'Internal error')
    } finally {
      await orchestrator.close()
    }
  })()

  return createSSEResponse(stream)
}
