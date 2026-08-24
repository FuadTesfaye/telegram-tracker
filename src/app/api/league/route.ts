import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";
import { handleApiError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const timezone = searchParams.get("timezone") || "UTC";

    if (!userId) {
      throw new AppError("Missing required user session identifier", 400, "UNAUTHORIZED");
    }

    const leaderboard = await LeagueService.getWeeklyLeaderboard(userId, timezone);
    const prediction = await LeagueService.getMidweekPrediction(userId);

    return NextResponse.json({
      success: true,
      ...leaderboard,
      prediction,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
