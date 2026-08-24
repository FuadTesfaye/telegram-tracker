/**
 * Fault Tolerance & Resilience Suite for Telemetr / Stalker Platform
 * Includes: Circuit Breaker, Exponential Backoff with Full Jitter, and Timeout Protection.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  retryOn?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, nextDelayMs: number) => void;
}

export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker [${circuitName}] is OPEN. Failing fast.`);
    this.name = "CircuitBreakerOpenError";
  }
}

/**
 * Wraps a promise with strict timeout enforcement.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

/**
 * Retries an asynchronous function with Exponential Backoff and Full Jitter.
 * Jitter prevents the "Thundering Herd" problem against databases and APIs.
 */
export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const factor = options.factor ?? 2;

  let attempt = 0;

  while (true) {
    attempt++;
    try {
      return await fn(attempt);
    } catch (err: any) {
      if (attempt > maxRetries) {
        throw err;
      }

      if (options.retryOn && !options.retryOn(err)) {
        throw err;
      }

      // Calculate exponential backoff with full jitter
      const baseDelay = Math.min(initialDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
      const jitteredDelay = Math.floor(Math.random() * baseDelay);

      if (options.onRetry) {
        options.onRetry(err, attempt, jitteredDelay);
      }

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before opening circuit
  recoveryTimeoutMs?: number; // Time to wait in OPEN before attempting HALF-OPEN test
  successThreshold?: number; // Successes in HALF-OPEN to close circuit
}

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * Circuit Breaker implementation to stop cascading failures across downstream services.
 */
export class CircuitBreaker {
  public name: string;
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      recoveryTimeoutMs: options.recoveryTimeoutMs ?? 15000,
      successThreshold: options.successThreshold ?? 2,
    };
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.recoveryTimeoutMs) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
      }
    }
    return this.state;
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      throw new CircuitBreakerOpenError(this.name);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = "CLOSED";
        this.failureCount = 0;
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
    }
  }

  public getStats() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}
