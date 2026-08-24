import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";
import { UserRepository } from "@/server/repositories/user.repository";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const leaderboard = await LeagueService.getWeeklyLeaderboard(userId, timezone);
    const prediction = await LeagueService.getMidweekPrediction(userId);

    return NextResponse.json({
      success: true,
      ...leaderboard,
      prediction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
