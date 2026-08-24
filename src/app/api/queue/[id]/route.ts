import { NextResponse } from "next/server";
import { queueManager } from "@/lib/queue-manager";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = queueManager.getJob(id);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found", id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      priority: job.priority,
      status: job.status,
      attempts: job.attempts,
      maxRetries: job.maxRetries,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      result: job.result,
      error: job.error,
    },
  });
}
