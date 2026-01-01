import { validateOrigin } from './origin-validator'
import { validateSessionOwnership } from './session-validator'
import { getOrCreateUser } from './user-sync'
import { createAuditLogger, type AuditLogger } from './audit-logger'
import type { SecurityContext, SecurityError } from './types'

interface SecurityPipelineInput {
  request: Request
  clerkId: string
  requestSessionId: string | undefined
  traceId: string
}

interface SecurityPipelineResult {
  success: boolean
  context?: SecurityContext
  error?: SecurityError
  auditLogger: AuditLogger
}

export async function runSecurityPipeline(
  input: SecurityPipelineInput
): Promise<SecurityPipelineResult> {
  const { request, clerkId, requestSessionId, traceId } = input

  const auditLogger = createAuditLogger({
    clerkId,
    traceId,
    ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  })

  const originResult = validateOrigin(request)
  if (!originResult.success) {
    auditLogger.log('auth.failure', { reason: 'origin_invalid' })
    return { success: false, error: originResult.error, auditLogger }
  }

  const userResult = await getOrCreateUser(clerkId)
  if (!userResult.success) {
    auditLogger.log('auth.failure', { reason: 'user_sync_failed' })
    return { success: false, error: userResult.error, auditLogger }
  }

  const internalUserId = userResult.data!.id

  const sessionResult = await validateSessionOwnership({
    requestSessionId,
    clerkId,
    internalUserId,
  })

  if (!sessionResult.success) {
    auditLogger.log('session.rejected', {
      requestedSessionId: requestSessionId,
      reason: 'ownership_mismatch',
    })
    return { success: false, error: sessionResult.error, auditLogger }
  }

  const { sessionId, isNew } = sessionResult.data!

  auditLogger.setSessionId(sessionId)
  auditLogger.log('auth.success', { method: 'clerk_jwt' })

  if (isNew) {
    auditLogger.log('session.created', { sessionId })
  } else {
    auditLogger.log('session.validated', { sessionId })
  }

  const context: SecurityContext = {
    clerkId,
    internalUserId,
    sessionId,
    sessionOwned: true,
    verified: true,
    auditTrail: auditLogger.getEvents(),
  }

  return { success: true, context, auditLogger }
}
