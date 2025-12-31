import { eq, sql, desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  conversationTurns,
  crisisEvents,
  type ConversationTurn,
  type NewConversationTurn,
  type CrisisEvent,
  type NewCrisisEvent,
} from '../schema'

function getConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('[db] DATABASE_URL must be set')
  return url
}

let db: ReturnType<typeof drizzle> | null = null

function getDb() {
  if (!db) {
    const client = postgres(getConnectionString())
    db = drizzle(client)
  }
  return db
}

export interface ITurnRepository {
  createTurn(turn: NewConversationTurn): Promise<ConversationTurn>
  getTurnsBySession(sessionId: string, limit?: number): Promise<ConversationTurn[]>
  getLatestTurn(sessionId: string): Promise<ConversationTurn | null>
  createCrisisEvent(event: NewCrisisEvent): Promise<CrisisEvent>
  getCrisisEventsBySession(sessionId: string): Promise<CrisisEvent[]>
}

export class TurnRepository implements ITurnRepository {
  private db = getDb()

  async createTurn(turn: NewConversationTurn): Promise<ConversationTurn> {
    const result = await this.db.insert(conversationTurns).values(turn).returning()

    if (!result[0]) {
      throw new Error('Failed to create conversation turn')
    }

    return result[0]
  }

  async getTurnsBySession(sessionId: string, limit = 10): Promise<ConversationTurn[]> {
    return this.db
      .select()
      .from(conversationTurns)
      .where(eq(conversationTurns.sessionId, sessionId))
      .orderBy(desc(conversationTurns.turnNumber))
      .limit(limit)
  }

  async getLatestTurn(sessionId: string): Promise<ConversationTurn | null> {
    const result = await this.db
      .select()
      .from(conversationTurns)
      .where(eq(conversationTurns.sessionId, sessionId))
      .orderBy(desc(conversationTurns.turnNumber))
      .limit(1)

    return result[0] ?? null
  }

  async createCrisisEvent(event: NewCrisisEvent): Promise<CrisisEvent> {
    const result = await this.db.insert(crisisEvents).values(event).returning()

    if (!result[0]) {
      throw new Error('Failed to create crisis event')
    }

    return result[0]
  }

  async getCrisisEventsBySession(sessionId: string): Promise<CrisisEvent[]> {
    return this.db
      .select()
      .from(crisisEvents)
      .where(eq(crisisEvents.sessionId, sessionId))
      .orderBy(desc(crisisEvents.createdAt))
  }
}

export function createTurnRepository(): ITurnRepository {
  return new TurnRepository()
}
