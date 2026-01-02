import { Redis } from '@upstash/redis'
import type { ConversationTurn, NewConversationTurn } from '../db/schema'

export interface CachedTurn {
  id: string
  sessionId: string
  turnNumber: number
  userMessage: string
  molleiResponse: string
  userEmotion: Record<string, unknown>
  molleiEmotion: Record<string, unknown>
  crisisDetected?: boolean
  crisisSeverity?: number
  latencyMs?: number
  createdAt: string
}

export interface TurnCacheBackend {
  getSessionTurns(sessionId: string, limit?: number): Promise<CachedTurn[]>
  setSessionTurn(turn: CachedTurn): Promise<void>
  destroy?(): void | Promise<void>
}

export interface SummaryCacheBackend {
  getSessionSummary(sessionId: string): Promise<string | null>
  setSessionSummary(sessionId: string, summary: string): Promise<void>
  destroy?(): void | Promise<void>
}

export type ConversationCacheBackend = TurnCacheBackend & SummaryCacheBackend

const CACHE_TTL_SECONDS = 1800
const SUMMARY_TTL_SECONDS = 86400

class InMemoryConversationCache implements ConversationCacheBackend {
  private turns: Map<string, CachedTurn[]> = new Map()
  private summaries: Map<string, { value: string; expiresAt: number }> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  async getSessionTurns(sessionId: string, limit = 10): Promise<CachedTurn[]> {
    const sessionTurns = this.turns.get(sessionId) ?? []
    return sessionTurns.slice(-limit).reverse()
  }

  async setSessionTurn(turn: CachedTurn): Promise<void> {
    const sessionTurns = this.turns.get(turn.sessionId) ?? []
    sessionTurns.push(turn)
    if (sessionTurns.length > 50) {
      sessionTurns.shift()
    }
    this.turns.set(turn.sessionId, sessionTurns)
  }

  async getSessionSummary(sessionId: string): Promise<string | null> {
    const entry = this.summaries.get(sessionId)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.summaries.delete(sessionId)
      return null
    }
    return entry.value
  }

  async setSessionSummary(sessionId: string, summary: string): Promise<void> {
    this.summaries.set(sessionId, {
      value: summary,
      expiresAt: Date.now() + SUMMARY_TTL_SECONDS * 1000,
    })
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [sessionId, entry] of this.summaries.entries()) {
      if (now > entry.expiresAt) {
        this.summaries.delete(sessionId)
        this.turns.delete(sessionId)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.turns.clear()
    this.summaries.clear()
  }
}

class RedisConversationCache implements ConversationCacheBackend {
  private fallback: InMemoryConversationCache
  private usesFallback = false

  constructor(private redis: Redis) {
    this.fallback = new InMemoryConversationCache()
  }

  async getSessionTurns(sessionId: string, limit = 10): Promise<CachedTurn[]> {
    if (this.usesFallback) {
      return this.fallback.getSessionTurns(sessionId, limit)
    }

    try {
      const key = `session:${sessionId}:turns`
      const raw = await this.redis.lrange(key, -limit, -1)
      return raw.map((item) => {
        if (typeof item === 'string') {
          return JSON.parse(item) as CachedTurn
        }
        return item as CachedTurn
      }).reverse()
    } catch (error) {
      console.warn('[conversation-cache] Redis error, falling back:', error)
      this.activateFallback()
      return this.fallback.getSessionTurns(sessionId, limit)
    }
  }

  async setSessionTurn(turn: CachedTurn): Promise<void> {
    if (this.usesFallback) {
      return this.fallback.setSessionTurn(turn)
    }

    try {
      const key = `session:${turn.sessionId}:turns`
      await this.redis.rpush(key, JSON.stringify(turn))
      await this.redis.ltrim(key, -50, -1)
      await this.redis.expire(key, CACHE_TTL_SECONDS)
    } catch (error) {
      console.warn('[conversation-cache] Redis write error:', error)
      this.activateFallback()
      await this.fallback.setSessionTurn(turn)
    }
  }

  async getSessionSummary(sessionId: string): Promise<string | null> {
    if (this.usesFallback) {
      return this.fallback.getSessionSummary(sessionId)
    }

    try {
      const key = `session:${sessionId}:summary`
      return await this.redis.get(key)
    } catch (error) {
      console.warn('[conversation-cache] Redis error:', error)
      this.activateFallback()
      return this.fallback.getSessionSummary(sessionId)
    }
  }

  async setSessionSummary(sessionId: string, summary: string): Promise<void> {
    if (this.usesFallback) {
      return this.fallback.setSessionSummary(sessionId, summary)
    }

    try {
      const key = `session:${sessionId}:summary`
      await this.redis.set(key, summary, { ex: SUMMARY_TTL_SECONDS })
    } catch (error) {
      console.warn('[conversation-cache] Redis write error:', error)
      this.activateFallback()
      await this.fallback.setSessionSummary(sessionId, summary)
    }
  }

  private activateFallback(): void {
    this.usesFallback = true
    setTimeout(() => {
      this.usesFallback = false
    }, 30000)
  }

  destroy(): void {
    this.fallback.destroy()
  }
}

export class ConversationCache {
  private backend: ConversationCacheBackend

  constructor(backend?: ConversationCacheBackend) {
    this.backend = backend ?? new InMemoryConversationCache()
  }

  async getSessionContext(sessionId: string, maxTurns = 5): Promise<string> {
    const turns = await this.backend.getSessionTurns(sessionId, maxTurns)

    if (turns.length === 0) {
      return 'No prior context (new session)'
    }

    const context = turns
      .map((t) => `Turn ${t.turnNumber}:\nUser: ${t.userMessage}\nMollei: ${t.molleiResponse}`)
      .join('\n\n')

    return context
  }

  async cacheTurn(turn: CachedTurn): Promise<void> {
    await this.backend.setSessionTurn(turn)
  }

  async getSessionSummary(sessionId: string): Promise<string | null> {
    return this.backend.getSessionSummary(sessionId)
  }

  async setSessionSummary(sessionId: string, summary: string): Promise<void> {
    await this.backend.setSessionSummary(sessionId, summary)
  }

  async getRecentTurns(sessionId: string, limit = 10): Promise<CachedTurn[]> {
    return this.backend.getSessionTurns(sessionId, limit)
  }

  async getNextTurnNumber(sessionId: string): Promise<number> {
    const turns = await this.backend.getSessionTurns(sessionId, 1)
    if (turns.length === 0) return 1
    return (turns[0]?.turnNumber ?? 0) + 1
  }

  destroy(): void {
    this.backend.destroy?.()
  }
}

let sharedConversationCache: ConversationCache | null = null

export function getSharedConversationCache(): ConversationCache {
  if (!sharedConversationCache) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (url && token) {
      const redis = new Redis({ url, token })
      const backend = new RedisConversationCache(redis)
      sharedConversationCache = new ConversationCache(backend)
    } else {
      sharedConversationCache = new ConversationCache()
    }
  }
  return sharedConversationCache
}

export function destroySharedConversationCache(): void {
  if (sharedConversationCache) {
    sharedConversationCache.destroy()
    sharedConversationCache = null
  }
}

export function turnToCachedTurn(turn: ConversationTurn): CachedTurn {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    turnNumber: turn.turnNumber,
    userMessage: turn.userMessage,
    molleiResponse: turn.molleiResponse,
    userEmotion: turn.userEmotion as Record<string, unknown>,
    molleiEmotion: turn.molleiEmotion as Record<string, unknown>,
    crisisDetected: turn.crisisDetected ?? undefined,
    crisisSeverity: turn.crisisSeverity ?? undefined,
    latencyMs: turn.latencyMs ?? undefined,
    createdAt: turn.createdAt.toISOString(),
  }
}

export function cachedTurnToNewTurn(cached: CachedTurn): NewConversationTurn {
  return {
    id: cached.id,
    sessionId: cached.sessionId,
    turnNumber: cached.turnNumber,
    userMessage: cached.userMessage,
    molleiResponse: cached.molleiResponse,
    userEmotion: cached.userEmotion,
    molleiEmotion: cached.molleiEmotion,
    crisisDetected: cached.crisisDetected,
    crisisSeverity: cached.crisisSeverity,
    latencyMs: cached.latencyMs,
  }
}
