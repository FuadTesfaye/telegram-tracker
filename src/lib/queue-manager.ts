import { retryWithBackoff } from "./resilience";

export type JobPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "RETRYING";

export interface Job<TPayload = any, TResult = any> {
  id: string;
  type: string;
  payload: TPayload;
  priority: JobPriority;
  status: JobStatus;
  result?: TResult;
  error?: string;
  attempts: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobHandler<TPayload = any, TResult = any> = (
  job: Job<TPayload, TResult>
) => Promise<TResult>;

const PRIORITY_WEIGHTS: Record<JobPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

class AsyncQueueManager {
  private queue: Job[] = [];
  private activeJobs = new Map<string, Job>();
  private completedJobs = new Map<string, Job>();
  private deadLetterQueue = new Map<string, Job>();
  private handlers = new Map<string, JobHandler>();
  private maxConcurrency = 5;
  private isProcessing = false;

  constructor(maxConcurrency = 5) {
    this.maxConcurrency = maxConcurrency;
    this.registerDefaultHandlers();
  }

  /**
   * Registers a worker handler for a specific job type.
   */
  public registerHandler<TPayload = any, TResult = any>(
    type: string,
    handler: JobHandler<TPayload, TResult>
  ): void {
    this.handlers.set(type, handler);
  }

  /**
   * Adds a new task to the asynchronous priority queue.
   */
  public enqueue<TPayload = any, TResult = any>(
    type: string,
    payload: TPayload,
    options: {
      priority?: JobPriority;
      maxRetries?: number;
    } = {}
  ): Job<TPayload, TResult> {
    const job: Job<TPayload, TResult> = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      priority: options.priority ?? "NORMAL",
      status: "PENDING",
      attempts: 0,
      maxRetries: options.maxRetries ?? 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.sortQueue();
    this.processNext();

    return job;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.activeJobs.size < this.maxConcurrency && this.queue.length > 0) {
        const job = this.queue.shift()!;
        this.activeJobs.set(job.id, job);
        job.status = "RUNNING";
        job.startedAt = new Date();
        job.attempts++;

        // Process asynchronously without blocking loop
        this.executeJob(job).catch(() => {});
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      job.status = "FAILED";
      job.error = `No registered handler for job type [${job.type}]`;
      job.completedAt = new Date();
      this.activeJobs.delete(job.id);
      this.deadLetterQueue.set(job.id, job);
      this.processNext();
      return;
    }

    try {
      const result = await handler(job);
      job.status = "COMPLETED";
      job.result = result;
      job.completedAt = new Date();

      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);

      // Keep only last 500 completed jobs in memory
      if (this.completedJobs.size > 500) {
        const oldestKey = this.completedJobs.keys().next().value;
        if (oldestKey) this.completedJobs.delete(oldestKey);
      }
    } catch (err: any) {
      if (job.attempts < job.maxRetries) {
        job.status = "RETRYING";
        job.error = err.message || String(err);
        this.activeJobs.delete(job.id);

        // Exponential backoff delay before re-queueing
        const delayMs = Math.min(1000 * Math.pow(2, job.attempts), 10000);
        setTimeout(() => {
          this.queue.push(job);
          this.sortQueue();
          this.processNext();
        }, delayMs);
      } else {
        job.status = "FAILED";
        job.error = err.message || String(err);
        job.completedAt = new Date();
        this.activeJobs.delete(job.id);
        this.deadLetterQueue.set(job.id, job);

        if (this.deadLetterQueue.size > 200) {
          const oldestKey = this.deadLetterQueue.keys().next().value;
          if (oldestKey) this.deadLetterQueue.delete(oldestKey);
        }
      }
    } finally {
      this.processNext();
    }
  }

  public getJob(id: string): Job | undefined {
    return (
      this.activeJobs.get(id) ||
      this.completedJobs.get(id) ||
      this.deadLetterQueue.get(id) ||
      this.queue.find((j) => j.id === id)
    );
  }

  public getStats() {
    return {
      pending: this.queue.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      failedInDLQ: this.deadLetterQueue.size,
      concurrencyLimit: this.maxConcurrency,
    };
  }

  private registerDefaultHandlers() {
    // Default task handler for batch notifications
    this.registerHandler("NOTIFICATION_BROADCAST", async (job) => {
      const { text, targetIds } = job.payload;
      // Simulated or real broadcast logic
      return { sent: targetIds?.length || 1, timestamp: new Date().toISOString() };
    });

    // Default task handler for weekly calculations
    this.registerHandler("LEAGUE_RECALCULATION", async (job) => {
      const { weekNumber } = job.payload;
      return { recalculated: true, weekNumber, timestamp: new Date().toISOString() };
    });
  }
}

export const queueManager = new AsyncQueueManager(8);
