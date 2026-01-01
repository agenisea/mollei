import type { ValidationResult } from './types'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
].filter(Boolean) as string[]

export function validateOrigin(request: Request): ValidationResult<void> {
  const origin = request.headers.get('origin')

  if (request.method === 'GET') {
    return { success: true }
  }

  if (!origin) {
    return { success: true }
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return {
      success: false,
      error: {
        code: 'ORIGIN_INVALID',
        message: 'Cross-origin request blocked',
        httpStatus: 403,
      },
    }
  }

  return { success: true }
}
