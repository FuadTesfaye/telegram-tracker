import { NextRequest, NextResponse } from "next/server";
import { AccountRepository } from "@/server/repositories/account.repository";
import { DailyRepository } from "@/server/repositories/daily.repository";
import { handleApiError } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

interface CompetitorOdds {
  accountId: string;
  telegramUserId: number;
  displayName: string;
  username: string | null;
  odds: number; // Multiplier, e.g. 1.45
  impliedProbability: number; // e.g. 68%
  role: "FAVORITE" | "CONTENDER" | "UNDERDOG";
  sevenDaySeconds: number;
  formattedDuration: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "0de130c1-ee4c-4c32-9366-353e207e6446";

    const accounts = await AccountRepository.listByOwner(userId);
    if (accounts.length === 0) {
      return NextResponse.json({
        weekNumber: 35,
        userPoints: 1000,
        odds: [],
        activeWager: null,
      });
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    const stats = await Promise.all(
      accounts.map(async (acc) => {
        const dailies = await DailyRepository.listByRange(acc.id, startDate, endDate);
        const totalSecs = dailies.reduce((sum, d) => sum + (d.activeSeconds || 0), 0);
        return {
          acc,
          totalSecs,
        };
      })
    );

    const totalPool = Math.max(1, stats.reduce((sum, s) => sum + s.totalSecs, 0));

    // Sort by activity descending
    stats.sort((a, b) => b.totalSecs - a.totalSecs);

    const odds: CompetitorOdds[] = stats.map((s, idx) => {
      const share = s.totalSecs / totalPool;
      let rawOdds: number;
      let role: "FAVORITE" | "CONTENDER" | "UNDERDOG";

      if (idx === 0) {
        role = "FAVORITE";
        rawOdds = Math.max(1.25, Math.min(1.85, 1 / Math.max(0.4, share)));
      } else if (idx === 1) {
        role = "CONTENDER";
        rawOdds = Math.max(1.95, Math.min(3.2, 1 / Math.max(0.2, share)));
      } else {
        role = "UNDERDOG";
        rawOdds = Math.max(3.5, Math.min(8.0, 1 / Math.max(0.1, share)));
      }

      const hours = Math.floor(s.totalSecs / 3600);
      const mins = Math.floor((s.totalSecs % 3600) / 60);

      return {
        accountId: s.acc.id,
        telegramUserId: s.acc.telegramUserId,
        displayName: s.acc.displayName || "@" + s.acc.username,
        username: s.acc.username,
        odds: Number(rawOdds.toFixed(2)),
        impliedProbability: Math.round(Math.max(10, Math.min(90, (1 / rawOdds) * 100))),
        role,
        sevenDaySeconds: s.totalSecs,
        formattedDuration: `${hours}h ${mins}m`,
      };
    });

    return NextResponse.json(
      {
        weekNumber: 35,
        userPoints: 1000,
        odds,
        activeWager: null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=20, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return handleApiError(error, "LeagueBetsAPI");
  }
}
