import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, type User, type NewUser } from '../schema'

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

export interface IUserRepository {
  getUserById(userId: string): Promise<User | null>
  getUserByClerkId(clerkId: string): Promise<User | null>
  createUser(user: NewUser): Promise<User>
  getOrCreateByClerkId(clerkId: string): Promise<User>
}

export class UserRepository implements IUserRepository {
  private db = getDb()

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, userId)).limit(1)
    return result[0] ?? null
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
    return result[0] ?? null
  }

  async createUser(user: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning()

    if (!result[0]) {
      throw new Error('Failed to create user')
    }

    return result[0]
  }

  async getOrCreateByClerkId(clerkId: string): Promise<User> {
    const existing = await this.getUserByClerkId(clerkId)
    if (existing) return existing

    try {
      return await this.createUser({ clerkId })
    } catch (error) {
      const existing = await this.getUserByClerkId(clerkId)
      if (existing) return existing
      throw error
    }
  }
}

export function createUserRepository(): IUserRepository {
  return new UserRepository()
}
