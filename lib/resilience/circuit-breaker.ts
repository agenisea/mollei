import { CIRCUIT_BREAKER } from '../utils/constants'

export interface ICircuitBreaker {
  allowRequest(): boolean
  recordSuccess(): void
  recordFailure(): void
  getState(): 'closed' | 'open' | 'half-open'
}

export class CircuitBreaker implements ICircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private halfOpenRequests = 0

  constructor(
    private agentId: string,
    private config = CIRCUIT_BREAKER
  ) {}

  allowRequest(): boolean {
    if (this.state === 'closed') return true

    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime
      if (elapsed > this.config.RESET_TIMEOUT_MS) {
        this.state = 'half-open'
        this.halfOpenRequests = 0
        console.log(`[circuit-breaker:${this.agentId}] Transitioning to half-open`)
        return true
      }
      return false
    }

    if (this.halfOpenRequests < this.config.HALF_OPEN_MAX_REQUESTS) {
      this.halfOpenRequests++
      return true
    }
    return false
  }

  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.state = 'closed'
      this.failureCount = 0
      console.log(`[circuit-breaker:${this.agentId}] Circuit closed (recovered)`)
    }
  }

  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === 'half-open') {
      this.state = 'open'
      console.log(`[circuit-breaker:${this.agentId}] Circuit reopened (half-open failure)`)
    } else if (this.failureCount >= this.config.FAILURE_THRESHOLD) {
      this.state = 'open'
      console.log(`[circuit-breaker:${this.agentId}] Circuit opened (threshold reached)`)
    }
  }

  getState() {
    return this.state
  }
}

export class AlwaysClosedCircuitBreaker implements ICircuitBreaker {
  allowRequest() {
    return true
  }
  recordSuccess() {}
  recordFailure() {}
  getState(): 'closed' {
    return 'closed'
  }
}

export class AlwaysOpenCircuitBreaker implements ICircuitBreaker {
  allowRequest() {
    return false
  }
  recordSuccess() {}
  recordFailure() {}
  getState(): 'open' {
    return 'open'
  }
}
