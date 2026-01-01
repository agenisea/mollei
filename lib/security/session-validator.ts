import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sessions } from '../db/schema'
import type { ValidationResult } from './types'

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

interface SessionValidationInput {
  requestSessionId: string | undefined
  clerkId: string
  internalUserId: string
}

interface SessionValidationResult {
  sessionId: string
  isNew: boolean
}

export async function validateSessionOwnership(
  input: SessionValidationInput
): Promise<ValidationResult<SessionValidationResult>> {
  const { requestSessionId, internalUserId } = input
  const database = getDb()

  if (!requestSessionId) {
    const newSessionId = crypto.randomUUID()
    return {
      success: true,
      data: { sessionId: newSessionId, isNew: true },
    }
  }

  const session = await database
    .select({
      id: sessions.id,
      userId: sessions.userId,
    })
    .from(sessions)
    .where(eq(sessions.id, requestSessionId))
    .limit(1)

  if (!session[0]) {
    const newSessionId = crypto.randomUUID()
    return {
      success: true,
      data: { sessionId: newSessionId, isNew: true },
    }
  }

  if (session[0].userId !== internalUserId) {
    return {
      success: false,
      error: {
        code: 'SESSION_NOT_OWNED',
        message: 'Session access denied',
        httpStatus: 403,
      },
    }
  }

  return {
    success: true,
    data: { sessionId: requestSessionId, isNew: false },
  }
}
