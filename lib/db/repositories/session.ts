import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sessions, conversationTurns, type Session, type NewSession } from '../schema'

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

export interface ISessionRepository {
  getSession(sessionId: string): Promise<Session | null>
  createSession(userId: string): Promise<Session>
  updateSession(sessionId: string, data: Partial<Session>): Promise<void>
  getTurnNumber(sessionId: string): Promise<number>
}

export class SessionRepository implements ISessionRepository {
  private db = getDb()

  async getSession(sessionId: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)

    return result[0] ?? null
  }

  async createSession(userId: string): Promise<Session> {
    const result = await this.db
      .insert(sessions)
      .values({
        userId,
        status: 'active',
        emotionState: { primary: 'neutral', intensity: 0.5 },
      })
      .returning()

    if (!result[0]) {
      throw new Error('Failed to create session')
    }

    return result[0]
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))
  }

  async getTurnNumber(sessionId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(conversationTurns)
      .where(eq(conversationTurns.sessionId, sessionId))

    const count = result[0]?.count ?? 0
    return count + 1
  }
}

export function createSessionRepository(): ISessionRepository {
  return new SessionRepository()
}
