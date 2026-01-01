export interface SecurityContext {
  clerkId: string
  internalUserId: string
  sessionId: string
  sessionOwned: boolean
  verified: boolean
  auditTrail: AuditEvent[]
}

export interface AuditEvent {
  eventType: AuditEventType
  timestamp: string
  clerkId: string
  metadata: Record<string, unknown>
}

export type AuditEventType =
  | 'auth.success'
  | 'auth.failure'
  | 'session.created'
  | 'session.validated'
  | 'session.rejected'
  | 'ratelimit.exceeded'
  | 'input.suspicious'
  | 'crisis.detected'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: SecurityError
}

export interface SecurityError {
  code: SecurityErrorCode
  message: string
  httpStatus: 401 | 403
}

export type SecurityErrorCode =
  | 'ORIGIN_INVALID'
  | 'SESSION_NOT_OWNED'
  | 'USER_NOT_FOUND'
  | 'CSRF_FAILED'
