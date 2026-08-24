import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const rivalAccountId = searchParams.get("rivalAccountId") || undefined;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const rivalData = await LeagueService.getRivalStatus(userId, rivalAccountId);
    return NextResponse.json({ success: true, rival: rivalData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
