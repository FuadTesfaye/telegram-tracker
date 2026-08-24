import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";
import type { RoastLevel } from "@/server/services/roast-engine.service";
import { handleApiError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const accountId = searchParams.get("accountId");
    const level = (searchParams.get("level") as RoastLevel) || "normal";

    if (!userId) {
      throw new AppError("Missing required user session identifier", 400, "UNAUTHORIZED");
    }

    const leaderboard = await LeagueService.getWeeklyLeaderboard(userId);
    if (leaderboard.competitors.length === 0) {
      throw new AppError(
        "No competitor accounts enrolled yet. Add an account to generate a custom roast.",
        404,
        "NOT_FOUND"
      );
    }

    const target = accountId
      ? leaderboard.competitors.find((c) => c.accountId === accountId) || leaderboard.competitors[0]
      : leaderboard.competitors[0];

    const roast = LeagueService.generateRoast(
      target,
      target.rank,
      leaderboard.competitors.length,
      level
    );

    return NextResponse.json({
      target,
      ...roast,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
