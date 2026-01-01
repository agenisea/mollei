import type { AuditEvent, AuditEventType } from './types'

interface AuditContext {
  clerkId: string
  sessionId?: string
  traceId: string
  ip?: string
  userAgent?: string
}

export class AuditLogger {
  private events: AuditEvent[] = []

  constructor(private context: AuditContext) {}

  log(eventType: AuditEventType, metadata: Record<string, unknown> = {}): void {
    const event: AuditEvent = {
      eventType,
      timestamp: new Date().toISOString(),
      clerkId: this.context.clerkId,
      metadata: {
        ...metadata,
        traceId: this.context.traceId,
        sessionId: this.context.sessionId,
        ip: this.context.ip,
      },
    }

    this.events.push(event)

    const severity = this.getSeverity(eventType)
    const logFn = severity === 'error' ? console.error : severity === 'warn' ? console.warn : console.log

    logFn(`[AUDIT] [${eventType}] ${JSON.stringify(event.metadata)}`)
  }

  getEvents(): AuditEvent[] {
    return [...this.events]
  }

  setSessionId(sessionId: string): void {
    this.context.sessionId = sessionId
  }

  private getSeverity(eventType: AuditEventType): 'info' | 'warn' | 'error' {
    switch (eventType) {
      case 'auth.failure':
      case 'session.rejected':
      case 'crisis.detected':
        return 'error'
      case 'ratelimit.exceeded':
      case 'input.suspicious':
        return 'warn'
      default:
        return 'info'
    }
  }
}

export function createAuditLogger(context: AuditContext): AuditLogger {
  return new AuditLogger(context)
}
