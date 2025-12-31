/**
 * Unified Rate Limiting Module
 *
 * Provides rate limiting for chat API endpoints with support for pluggable
 * backends (in-memory by default, Redis for production).
 *
 * Uses sliding window counter algorithm to prevent edge-burst attacks that
 * affect fixed window implementations.
 *
 * ⚠️ OPERATIONAL CONSIDERATIONS:
 *
 * The default in-memory implementation has per-instance state.
 * In multi-instance deployments (e.g., behind a load balancer),
 * effective limits are multiplied by instance count.
 *
 * When to upgrade to Redis:
 * - Production deployments with >1 instance
 * - Stricter rate limit enforcement required
 * - Coordinated rate limiting across services
 */

import { Redis } from '@upstash/redis'

export type RateLimitType = 'chat' | 'chat_stream'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  headers: Record<string, string>
}

export interface RateLimitConfig {
  chatPerMinute: number
  chatStreamPerMinute: number
}

export interface RateLimitBackend {
  check(key: string, limit: number, windowSeconds: number): RateLimitResult | Promise<RateLimitResult>
  destroy?(): void | Promise<void>
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  chatPerMinute: 20,
  chatStreamPerMinute: 20,
}

interface SlidingWindowEntry {
  currentCount: number
  currentWindowStart: number
  previousCount: number
  windowMs: number
}

class InMemoryRateLimitBackend implements RateLimitBackend {
  private store: Map<string, SlidingWindowEntry> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  check(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    let entry = this.store.get(key)

    if (!entry) {
      entry = {
        currentCount: 0,
        currentWindowStart: now,
        previousCount: 0,
        windowMs,
      }
      this.store.set(key, entry)
    }

    const windowStart = Math.floor(now / windowMs) * windowMs

    if (windowStart > entry.currentWindowStart) {
      if (windowStart - entry.currentWindowStart >= windowMs) {
        entry.previousCount = entry.currentCount
      }
      entry.currentCount = 0
      entry.currentWindowStart = windowStart
    }

    const elapsedInWindow = now - windowStart
    const weight = (windowMs - elapsedInWindow) / windowMs
    const estimatedCount = Math.floor(entry.previousCount * weight) + entry.currentCount

    if (estimatedCount >= limit) {
      const resetAt = windowStart + windowMs
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        headers: this.createHeaders(limit, 0, resetAt),
      }
    }

    entry.currentCount++
    this.store.set(key, entry)

    const remaining = Math.max(0, limit - estimatedCount - 1)
    const resetAt = windowStart + windowMs

    return {
      allowed: true,
      remaining,
      resetAt,
      headers: this.createHeaders(limit, remaining, resetAt),
    }
  }

  private createHeaders(limit: number, remaining: number, resetAt: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.currentWindowStart > entry.windowMs * 2) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

class RedisRateLimitBackend implements RateLimitBackend {
  private fallback: InMemoryRateLimitBackend
  private usesFallback = false

  constructor(private redis: Redis) {
    this.fallback = new InMemoryRateLimitBackend()
  }

  async check(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    if (this.usesFallback) {
      return this.fallback.check(key, limit, windowSeconds)
    }

    try {
      const now = Date.now()
      const windowMs = windowSeconds * 1000
      const windowStart = Math.floor(now / windowMs) * windowMs
      const previousWindowStart = windowStart - windowMs

      const currentKey = `ratelimit:${key}:${windowStart}`
      const previousKey = `ratelimit:${key}:${previousWindowStart}`

      const pipeline = this.redis.pipeline()
      pipeline.get(previousKey)
      pipeline.incr(currentKey)
      pipeline.pexpire(currentKey, windowMs * 2)

      const results = await pipeline.exec<[string | null, number, number]>()
      const previousCount = parseInt(results[0] || '0', 10)
      const currentCount = results[1]

      const elapsedInWindow = now - windowStart
      const weight = (windowMs - elapsedInWindow) / windowMs
      const estimatedCount = Math.floor(previousCount * weight) + currentCount

      const resetAt = windowStart + windowMs
      const allowed = estimatedCount <= limit
      const remaining = Math.max(0, limit - estimatedCount)

      return {
        allowed,
        remaining,
        resetAt,
        headers: this.createHeaders(limit, remaining, resetAt),
      }
    } catch (error) {
      console.warn('[rate-limiter] Redis error, falling back to in-memory:', error)
      this.usesFallback = true
      setTimeout(() => {
        this.usesFallback = false
      }, 30000)
      return this.fallback.check(key, limit, windowSeconds)
    }
  }

  private createHeaders(limit: number, remaining: number, resetAt: number): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
    }
  }

  destroy(): void {
    this.fallback.destroy()
  }
}

export class RateLimiter {
  private backend: RateLimitBackend

  constructor(
    private config: RateLimitConfig,
    backend?: RateLimitBackend
  ) {
    this.backend = backend || new InMemoryRateLimitBackend()
  }

  private getLimit(type: RateLimitType): { limit: number; windowSeconds: number } {
    switch (type) {
      case 'chat':
        return { limit: this.config.chatPerMinute, windowSeconds: 60 }
      case 'chat_stream':
        return { limit: this.config.chatStreamPerMinute, windowSeconds: 60 }
    }
  }

  check(ip: string, type: RateLimitType): RateLimitResult {
    const { limit, windowSeconds } = this.getLimit(type)
    const key = `${ip}:${type}`
    return this.backend.check(key, limit, windowSeconds) as RateLimitResult
  }

  checkByUser(userId: string, type: RateLimitType): RateLimitResult {
    const { limit, windowSeconds } = this.getLimit(type)
    const key = `user:${userId}:${type}`
    return this.backend.check(key, limit, windowSeconds) as RateLimitResult
  }

  async checkAsync(ip: string, type: RateLimitType): Promise<RateLimitResult> {
    const { limit, windowSeconds } = this.getLimit(type)
    const key = `${ip}:${type}`
    return await this.backend.check(key, limit, windowSeconds)
  }

  async checkByUserAsync(userId: string, type: RateLimitType): Promise<RateLimitResult> {
    const { limit, windowSeconds } = this.getLimit(type)
    const key = `user:${userId}:${type}`
    return await this.backend.check(key, limit, windowSeconds)
  }

  destroy(): void {
    this.backend.destroy?.()
  }
}

let sharedRateLimiter: RateLimiter | null = null

export function getSharedRateLimiter(config: RateLimitConfig = DEFAULT_RATE_LIMITS): RateLimiter {
  if (!sharedRateLimiter) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (url && token) {
      console.log('[rate-limiter] Using Redis sliding window backend')
      const redis = new Redis({ url, token })
      const backend = new RedisRateLimitBackend(redis)
      sharedRateLimiter = new RateLimiter(config, backend)
    } else {
      console.log('[rate-limiter] Using in-memory sliding window backend')
      sharedRateLimiter = new RateLimiter(config)
    }
  }
  return sharedRateLimiter
}

export function destroySharedRateLimiter(): void {
  if (sharedRateLimiter) {
    sharedRateLimiter.destroy()
    sharedRateLimiter = null
  }
}

export function createRateLimiter(
  backend: RateLimitBackend,
  config: RateLimitConfig = DEFAULT_RATE_LIMITS
): RateLimiter {
  return new RateLimiter(config, backend)
}

export function getRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
  return Response.json(
    { error: 'Too many requests', retryAfter },
    {
      status: 429,
      headers: {
        ...result.headers,
        'Retry-After': String(Math.max(1, retryAfter)),
      },
    }
  )
}
