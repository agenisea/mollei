import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { runMolleiPipeline, type PipelineContext } from '@/lib/pipeline/orchestrator'
import { createInitialState } from '@/lib/pipeline/state'
import { MoodSensor } from '@/lib/agents/mood-sensor'
import { MemoryAgent } from '@/lib/agents/memory-agent'
import { SafetyMonitor } from '@/lib/agents/safety-monitor'
import { EmotionReasoner } from '@/lib/agents/emotion-reasoner'
import { ResponseGenerator } from '@/lib/agents/response-generator'
import { FALLBACK_RESPONSE } from '@/lib/utils/constants'
import { ChatRequestSchema, type ChatResponse } from '@/lib/contracts/chat'
import { sanitizeUserInput, logSuspiciousInput } from '@/lib/utils/input-sanitizer'
import { getSharedRateLimiter, getRateLimitResponse } from '@/lib/infrastructure/rate-limiter'
import { enableCostAggregation } from '@/lib/infrastructure/cost-aggregator'
import { getSharedConversationCache, cachedTurnToNewTurn, type CachedTurn } from '@/lib/cache/conversation-cache'
import { createTurnRepository } from '@/lib/db/repositories/turn'

enableCostAggregation()

export async function POST(request: NextRequest) {
  const start = performance.now()

  const rateLimiter = getSharedRateLimiter()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rateLimitResult = await rateLimiter.checkAsync(ip, 'chat')

  if (!rateLimitResult.allowed) {
    return getRateLimitResponse(rateLimitResult)
  }

  try {
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

    const ctx: PipelineContext = {
      traceId,
      sessionId,
      userId,
      turnNumber: 0,
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

    const totalLatency = Math.round(performance.now() - start)
    const responseText = result.response ?? FALLBACK_RESPONSE

    const cachedTurn: CachedTurn = {
      id: randomUUID(),
      sessionId,
      turnNumber: result.turnNumber,
      userMessage: message,
      molleiResponse: responseText,
      userEmotion: { primary: result.userEmotion ?? 'unknown' },
      molleiEmotion: { primary: result.molleiEmotion ?? 'neutral' },
      crisisDetected: result.crisisDetected,
      crisisSeverity: result.crisisSeverity,
      latencyMs: totalLatency,
      createdAt: new Date().toISOString(),
    }

    const cache = getSharedConversationCache()
    await cache.cacheTurn(cachedTurn)

    // Write-through to Postgres (non-blocking)
    const turnRepository = createTurnRepository()
    turnRepository.createTurn(cachedTurnToNewTurn(cachedTurn)).catch((error) => {
      console.error('[api:chat] Postgres write-through failed:', error)
    })

    const response: ChatResponse = {
      sessionId,
      response: responseText,
      turnNumber: result.turnNumber,
      latencyMs: totalLatency,
      crisisDetected: result.crisisDetected,
    }

    return Response.json(response)
  } catch (error) {
    console.error('[api:chat] Error:', error)

    return Response.json({
      sessionId: randomUUID(),
      response: FALLBACK_RESPONSE,
      turnNumber: 0,
      latencyMs: Math.round(performance.now() - start),
    } satisfies ChatResponse)
  }
}
