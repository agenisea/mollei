import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerAuth } from '@/lib/auth/server'
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
import { sanitizeUserInput } from '@/lib/utils/input-sanitizer'
import { getSharedRateLimiter, getRateLimitResponse } from '@/lib/infrastructure/rate-limiter'
import { enableCostAggregation } from '@/lib/infrastructure/cost-aggregator'
import { getSharedConversationCache, cachedTurnToNewTurn, type CachedTurn } from '@/lib/cache/conversation-cache'
import { createTurnRepository } from '@/lib/db/repositories/turn'
import { runSecurityPipeline } from '@/lib/security'

enableCostAggregation()

export async function POST(request: NextRequest) {
  const { userId: clerkId, isAuthenticated } = await getServerAuth()

  if (!clerkId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { message: rawMessage, sessionId: requestSessionId } = parsed.data
  const traceId = `TURN-${randomUUID().slice(0, 8)}`

  let sessionId: string
  let internalUserId: string
  let auditLogger: ReturnType<typeof import('@/lib/security').createAuditLogger> | null = null

  if (isAuthenticated) {
    const securityResult = await runSecurityPipeline({
      request,
      clerkId,
      requestSessionId,
      traceId,
    })

    if (!securityResult.success) {
      return Response.json(
        { error: securityResult.error!.message },
        { status: securityResult.error!.httpStatus }
      )
    }

    sessionId = securityResult.context!.sessionId
    internalUserId = securityResult.context!.internalUserId
    auditLogger = securityResult.auditLogger
  } else {
    sessionId = requestSessionId ?? randomUUID()
    internalUserId = 'anonymous'
  }

  const rateLimiter = getSharedRateLimiter()
  const rateLimitResult = await rateLimiter.checkByUserAsync(internalUserId, 'chat')

  if (!rateLimitResult.allowed) {
    auditLogger?.log('ratelimit.exceeded', { limit: rateLimitResult.headers })
    return getRateLimitResponse(rateLimitResult)
  }

  const sanitizationResult = sanitizeUserInput(rawMessage)
  if (sanitizationResult.wasModified) {
    auditLogger?.log('input.suspicious', {
      patterns: sanitizationResult.detectedPatterns,
      originalLength: rawMessage.length,
    })
  }
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
        userId: internalUserId,
        turnNumber: 0,
        orchestrator,
      }

      const initialState = createInitialState({
        sessionId,
        userId: internalUserId,
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

        if (result.crisisDetected) {
          auditLogger?.log('crisis.detected', {
            severity: result.crisisSeverity,
            sessionId,
          })
        }

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
      await orchestrator.sendError('Something went wrong. Please try again.')
    } finally {
      await orchestrator.close()
    }
  })()

  return createSSEResponse(stream)
}
