import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const accountId = searchParams.get("accountId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const leaderboard = await LeagueService.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length === 0) {
      return NextResponse.json({ error: "No accounts found to roast" }, { status: 404 });
    }

    const target = accountId
      ? leaderboard.competitors.find((c) => c.accountId === accountId) || leaderboard.competitors[0]
      : leaderboard.competitors[0];

    const roast = LeagueService.generateRoast(
      target,
      target.rank,
      leaderboard.competitors.length
    );

    return NextResponse.json({
      target,
      ...roast,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
