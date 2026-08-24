import { describe, it, expect, vi } from "vitest";
import { queueManager } from "../../src/lib/queue-manager";

describe("Async Queue Manager", () => {
  it("enqueues and processes a job with registered handler", async () => {
    const jobType = "TEST_ECHO_JOB";
    const handler = vi.fn().mockImplementation(async (job) => {
      return { echoed: job.payload.text, upper: job.payload.text.toUpperCase() };
    });

    queueManager.registerHandler(jobType, handler);

    const job = queueManager.enqueue(jobType, { text: "hello world" }, { priority: "HIGH" });
    expect(["PENDING", "RUNNING"]).toContain(job.status);

    // Wait briefly for async execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    const completed = queueManager.getJob(job.id);
    expect(completed?.status).toBe("COMPLETED");
    expect(completed?.result).toEqual({ echoed: "hello world", upper: "HELLO WORLD" });
    expect(handler).toHaveBeenCalled();
  });

  it("handles job failure and records error in Dead Letter Queue", async () => {
    const failingType = "FAILING_JOB_TYPE";
    queueManager.registerHandler(failingType, async () => {
      throw new Error("Fatal task crash");
    });

    const job = queueManager.enqueue(failingType, {}, { maxRetries: 1 });

    // Wait for initial run + retry to complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    const failedJob = queueManager.getJob(job.id);
    expect(failedJob?.status).toBe("FAILED");
    expect(failedJob?.error).toContain("Fatal task crash");
  });
});
