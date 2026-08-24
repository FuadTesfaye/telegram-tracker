import { NextResponse } from "next/server";
import { SessionRepository } from "@/server/repositories/session.repository";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const sessions = await SessionRepository.listRecentByAccount(id, limit);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        durationSeconds: s.durationSeconds || 0,
        isOpen: s.isOpen,
        confidence: s.confidence,
        source: s.source,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
