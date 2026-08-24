import { NextResponse } from "next/server";
import { LeagueService } from "@/server/services/league.service";
import { handleApiError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const rivalAccountId = searchParams.get("rivalAccountId") || undefined;

    if (!userId) {
      throw new AppError("Missing required user session identifier", 400, "UNAUTHORIZED");
    }

    const rivalData = await LeagueService.getRivalStatus(userId, rivalAccountId);
    return NextResponse.json({ success: true, rival: rivalData });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
