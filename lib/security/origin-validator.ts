import { NextRequest } from 'next/server'
import type { ValidationResult } from './types'

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL

function getAllowedOrigin(): string | null {
  if (!NEXT_PUBLIC_APP_URL) return null
  try {
    return new URL(NEXT_PUBLIC_APP_URL).origin
  } catch {
    return null
  }
}

const ALLOWED_ORIGIN = getAllowedOrigin()
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function validateOrigin(request: Request | NextRequest): ValidationResult<void> {
  if (SAFE_METHODS.has(request.method)) {
    return { success: true }
  }

  if (!isSameOriginRequest(request)) {
    return {
      success: false,
      error: {
        code: 'ORIGIN_INVALID',
        message: 'Request blocked',
        httpStatus: 403,
      },
    }
  }

  return { success: true }
}

function isSameOriginRequest(request: Request | NextRequest): boolean {
  const originHeader = request.headers.get('origin')
  const refererHeader = request.headers.get('referer')

  if (originHeader) {
    try {
      const requestOrigin = new URL(originHeader).origin

      if (ALLOWED_ORIGIN && requestOrigin === ALLOWED_ORIGIN) {
        return true
      }

      if ('nextUrl' in request) {
        const serverOrigin = (request as NextRequest).nextUrl.origin
        if (requestOrigin === serverOrigin) {
          return true
        }
      }

      if (requestOrigin === 'http://localhost:3000') {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  if (refererHeader) {
    try {
      const refererOrigin = new URL(refererHeader).origin

      if (ALLOWED_ORIGIN && refererOrigin === ALLOWED_ORIGIN) {
        return true
      }

      if ('nextUrl' in request) {
        const serverOrigin = (request as NextRequest).nextUrl.origin
        if (refererOrigin === serverOrigin) {
          return true
        }
      }

      if (refererOrigin === 'http://localhost:3000') {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  return false
}
