import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, type User } from '../db/schema'
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

const userCache = new Map<string, { user: User; expires: number }>()
const CACHE_TTL_MS = 60_000

export async function getOrCreateUser(clerkId: string): Promise<ValidationResult<User>> {
  const cached = userCache.get(clerkId)
  if (cached && cached.expires > Date.now()) {
    return { success: true, data: cached.user }
  }

  const database = getDb()

  const existing = await database
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)

  if (existing[0]) {
    userCache.set(clerkId, { user: existing[0], expires: Date.now() + CACHE_TTL_MS })
    return { success: true, data: existing[0] }
  }

  try {
    const [newUser] = await database
      .insert(users)
      .values({ clerkId })
      .returning()

    if (!newUser) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Failed to create user record',
          httpStatus: 401,
        },
      }
    }

    userCache.set(clerkId, { user: newUser, expires: Date.now() + CACHE_TTL_MS })
    return { success: true, data: newUser }
  } catch {
    const retryExisting = await database
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (retryExisting[0]) {
      userCache.set(clerkId, { user: retryExisting[0], expires: Date.now() + CACHE_TTL_MS })
      return { success: true, data: retryExisting[0] }
    }

    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User creation failed',
        httpStatus: 401,
      },
    }
  }
}

export function clearUserCache(clerkId?: string): void {
  if (clerkId) {
    userCache.delete(clerkId)
  } else {
    userCache.clear()
  }
}
