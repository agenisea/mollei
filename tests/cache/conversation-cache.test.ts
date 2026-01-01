import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  ConversationCache,
  type CachedTurn,
  type TurnCacheBackend,
  type SummaryCacheBackend,
} from '@/lib/cache/conversation-cache'
import {
  createMockTurn,
  createMockTurnForScenario,
  resetTurnIdCounter,
  CONVERSATION_SCENARIOS,
  TEST_SESSION_IDS,
} from '../fixtures'

class MockTurnCacheBackend implements TurnCacheBackend {
  private turns: Map<string, CachedTurn[]> = new Map()

  async getSessionTurns(sessionId: string, limit = 10): Promise<CachedTurn[]> {
    const sessionTurns = this.turns.get(sessionId) ?? []
    return sessionTurns.slice(-limit).reverse()
  }

  async setSessionTurn(turn: CachedTurn): Promise<void> {
    const sessionTurns = this.turns.get(turn.sessionId) ?? []
    sessionTurns.push(turn)
    this.turns.set(turn.sessionId, sessionTurns)
  }

  destroy(): void {
    this.turns.clear()
  }
}

class MockSummaryCacheBackend implements SummaryCacheBackend {
  private summaries: Map<string, string> = new Map()

  async getSessionSummary(sessionId: string): Promise<string | null> {
    return this.summaries.get(sessionId) ?? null
  }

  async setSessionSummary(sessionId: string, summary: string): Promise<void> {
    this.summaries.set(sessionId, summary)
  }

  destroy(): void {
    this.summaries.clear()
  }
}

class MockConversationCacheBackend implements TurnCacheBackend, SummaryCacheBackend {
  private turnBackend = new MockTurnCacheBackend()
  private summaryBackend = new MockSummaryCacheBackend()

  getSessionTurns = this.turnBackend.getSessionTurns.bind(this.turnBackend)
  setSessionTurn = this.turnBackend.setSessionTurn.bind(this.turnBackend)
  getSessionSummary = this.summaryBackend.getSessionSummary.bind(this.summaryBackend)
  setSessionSummary = this.summaryBackend.setSessionSummary.bind(this.summaryBackend)

  destroy(): void {
    this.turnBackend.destroy()
    this.summaryBackend.destroy()
  }
}

describe('ConversationCache', () => {
  let cache: ConversationCache
  let backend: MockConversationCacheBackend

  beforeEach(() => {
    resetTurnIdCounter()
    backend = new MockConversationCacheBackend()
    cache = new ConversationCache(backend)
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('getSessionContext', () => {
    it('returns default message for new session', async () => {
      const context = await cache.getSessionContext('new-session')
      expect(context).toBe('No prior context (new session)')
    })

    it('returns formatted context for existing session', async () => {
      const scenario1 = CONVERSATION_SCENARIOS.GREETING
      const scenario2 = CONVERSATION_SCENARIOS.POSITIVE_SHARE

      const turn1 = createMockTurnForScenario(scenario1, { turnNumber: 1 })
      const turn2 = createMockTurnForScenario(scenario2, { turnNumber: 2 })

      await cache.cacheTurn(turn1)
      await cache.cacheTurn(turn2)

      const context = await cache.getSessionContext(TEST_SESSION_IDS.DEFAULT)

      expect(context).toContain('Turn 1:')
      expect(context).toContain(`User: ${scenario1.userMessage}`)
      expect(context).toContain(`Mollei: ${scenario1.molleiResponse}`)
      expect(context).toContain('Turn 2:')
      expect(context).toContain(`User: ${scenario2.userMessage}`)
      expect(context).toContain(`Mollei: ${scenario2.molleiResponse}`)
    })

    it('respects maxTurns limit', async () => {
      for (let i = 1; i <= 10; i++) {
        await cache.cacheTurn(
          createMockTurn({
            turnNumber: i,
            userMessage: `Message ${i}`,
            molleiResponse: `Response ${i}`,
          })
        )
      }

      const context = await cache.getSessionContext(TEST_SESSION_IDS.DEFAULT, 3)

      expect(context).toContain('Turn 8:')
      expect(context).toContain('Turn 9:')
      expect(context).toContain('Turn 10:')
      expect(context).not.toContain('Turn 7:')
    })
  })

  describe('cacheTurn', () => {
    it('stores turn in cache', async () => {
      const turn = createMockTurn()
      await cache.cacheTurn(turn)

      const turns = await cache.getRecentTurns(TEST_SESSION_IDS.DEFAULT, 10)
      expect(turns).toHaveLength(1)
      expect(turns[0]).toEqual(turn)
    })

    it('stores multiple turns in order', async () => {
      const turn1 = createMockTurn({ turnNumber: 1 })
      const turn2 = createMockTurn({ turnNumber: 2 })
      const turn3 = createMockTurn({ turnNumber: 3 })

      await cache.cacheTurn(turn1)
      await cache.cacheTurn(turn2)
      await cache.cacheTurn(turn3)

      const turns = await cache.getRecentTurns(TEST_SESSION_IDS.DEFAULT, 10)
      expect(turns).toHaveLength(3)
      expect(turns[0].turnNumber).toBe(3)
      expect(turns[1].turnNumber).toBe(2)
      expect(turns[2].turnNumber).toBe(1)
    })
  })

  describe('session summaries', () => {
    it('returns null for non-existent summary', async () => {
      const summary = await cache.getSessionSummary('nonexistent')
      expect(summary).toBeNull()
    })

    it('stores and retrieves summary', async () => {
      const scenario = CONVERSATION_SCENARIOS.SEEKING_SUPPORT
      await cache.setSessionSummary(TEST_SESSION_IDS.DEFAULT, `User discussed: ${scenario.userEmotion}`)
      const summary = await cache.getSessionSummary(TEST_SESSION_IDS.DEFAULT)
      expect(summary).toBe(`User discussed: ${scenario.userEmotion}`)
    })

    it('updates existing summary', async () => {
      await cache.setSessionSummary(TEST_SESSION_IDS.DEFAULT, 'Initial summary')
      await cache.setSessionSummary(TEST_SESSION_IDS.DEFAULT, 'Updated summary')

      const summary = await cache.getSessionSummary(TEST_SESSION_IDS.DEFAULT)
      expect(summary).toBe('Updated summary')
    })
  })

  describe('getRecentTurns', () => {
    it('returns empty array for new session', async () => {
      const turns = await cache.getRecentTurns('new-session')
      expect(turns).toEqual([])
    })

    it('returns turns in reverse chronological order', async () => {
      for (let i = 1; i <= 5; i++) {
        await cache.cacheTurn(createMockTurn({ turnNumber: i }))
      }

      const turns = await cache.getRecentTurns(TEST_SESSION_IDS.DEFAULT, 3)

      expect(turns).toHaveLength(3)
      expect(turns[0].turnNumber).toBe(5)
      expect(turns[1].turnNumber).toBe(4)
      expect(turns[2].turnNumber).toBe(3)
    })
  })
})

describe('ConversationCache isolation', () => {
  let cache: ConversationCache
  let backend: MockConversationCacheBackend

  beforeEach(() => {
    resetTurnIdCounter()
    backend = new MockConversationCacheBackend()
    cache = new ConversationCache(backend)
  })

  afterEach(() => {
    cache.destroy()
  })

  it('isolates turns by session', async () => {
    const turn1 = createMockTurn({ sessionId: TEST_SESSION_IDS.DEFAULT, turnNumber: 1 })
    const turn2 = createMockTurn({ sessionId: TEST_SESSION_IDS.ALTERNATE, turnNumber: 1 })

    await cache.cacheTurn(turn1)
    await cache.cacheTurn(turn2)

    const turnsDefault = await cache.getRecentTurns(TEST_SESSION_IDS.DEFAULT)
    const turnsAlternate = await cache.getRecentTurns(TEST_SESSION_IDS.ALTERNATE)

    expect(turnsDefault).toHaveLength(1)
    expect(turnsAlternate).toHaveLength(1)
    expect(turnsDefault[0].sessionId).toBe(TEST_SESSION_IDS.DEFAULT)
    expect(turnsAlternate[0].sessionId).toBe(TEST_SESSION_IDS.ALTERNATE)
  })

  it('isolates summaries by session', async () => {
    await cache.setSessionSummary(TEST_SESSION_IDS.DEFAULT, 'Summary Default')
    await cache.setSessionSummary(TEST_SESSION_IDS.ALTERNATE, 'Summary Alternate')

    expect(await cache.getSessionSummary(TEST_SESSION_IDS.DEFAULT)).toBe('Summary Default')
    expect(await cache.getSessionSummary(TEST_SESSION_IDS.ALTERNATE)).toBe('Summary Alternate')
  })
})
