import { auth } from '@clerk/nextjs/server'

const CLERK_ENABLED = !!process.env.CLERK_SECRET_KEY

interface ServerAuthResult {
  userId: string
  isAuthenticated: boolean
}

export async function getServerAuth(): Promise<ServerAuthResult> {
  if (!CLERK_ENABLED) {
    return { userId: 'anonymous', isAuthenticated: false }
  }

  const { userId } = await auth()

  if (!userId) {
    return { userId: '', isAuthenticated: false }
  }

  return { userId, isAuthenticated: true }
}
