import { NextResponse } from "next/server";
import { getTelegramBot } from "@/server/bot/bot";
import { UserRepository } from "@/server/repositories/user.repository";
import { LeagueService } from "@/server/services/league.service";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const leaderboard = await LeagueService.getWeeklyLeaderboard(userId, user.timezone);
    if (leaderboard.competitors.length === 0) {
      return NextResponse.json({ error: "No competitors found" }, { status: 400 });
    }

    const bot = getTelegramBot();
    const victim = leaderboard.weeklyVictim;
    const top3 = leaderboard.competitors.slice(0, 3);

    const medals = ["🥇", "🥈", "🥉"];
    const rows = top3
      .map((c, i) => `${medals[i]} *${c.displayName}*\n   \`${c.formattedDuration}\` — ${c.title}`)
      .join("\n\n");

    const text =
      `🏆 *TELEGRAM LEAGUE — WEEK ${leaderboard.weekNumber} RESULTS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${rows}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⚰️ *Weekly Victim:* *${victim?.displayName}*\n` +
      `_${victim ? LeagueService.generateRoast(victim, 1, top3.length).roast : ""}_\n\n` +
      `Open Telegram League to inspect the full leaderboard and mini-awards!`;

    await bot.api.sendMessage(user.telegramId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏆 View Full League", callback_data: "action:league" },
            { text: "🔥 Roast Me", callback_data: "action:roast" },
          ],
        ],
      },
    });

    return NextResponse.json({ success: true, message: "Weekly winner notification sent" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
