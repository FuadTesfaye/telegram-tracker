import { Bot, Context } from "grammy";
import { UserRepository } from "../repositories/user.repository";
import { AccountRepository } from "../repositories/account.repository";
import { AccountService } from "../services/account.service";
import { AnalyticsService } from "../services/analytics.service";
import { LeagueService } from "../services/league.service";
import { FootprintService } from "../services/footprint.service";
import { BotMenus } from "./menus";
import { formatDuration, normalizeUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";

const userSessionState = new Map<number, { state: string; data?: any }>();

export function registerBotHandlers(bot: Bot) {
  // 1. /start command
  bot.command("start", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;

    await UserRepository.findOrCreate({
      telegramId: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      languageCode: tgUser.language_code,
    });

    userSessionState.delete(tgUser.id);

    const welcomeText =
      `🏆 *Welcome to Telegram League*\n` +
      `_Track. Compete. Get Roasted._\n\n` +
      `Rank your tracked accounts in weekly presence tournaments, unlock ridiculous titles, fight your Rival, and get roasted by actual numbers.\n\n` +
      `• *Mode A (My Telegram)*: Deep personal presence & observed chat footprint.\n` +
      `• *Mode B (Telegram League)*: 3-competitor weekly tournament.\n\n` +
      `⚠️ *Privacy Notice:*\n` +
      `Rankings & footprints are derived solely from observable presence signals and chats with legitimate visibility. Message texts are never stored.`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.mainMenu(),
    });
  });

  // 2. /my command
  bot.command("my", async (ctx) => {
    await sendMyTelegramScreen(ctx);
  });

  // 3. /league command
  bot.command("league", async (ctx) => {
    await sendLeagueScreen(ctx);
  });

  // 4. /roast command
  bot.command("roast", async (ctx) => {
    await sendRoastScreen(ctx);
  });

  // 5. /rival command
  bot.command("rival", async (ctx) => {
    await sendRivalScreen(ctx);
  });

  // 6. /footprint command
  bot.command("footprint", async (ctx) => {
    await sendFootprintScreen(ctx);
  });

  // 7. /awards command
  bot.command("awards", async (ctx) => {
    await sendAwardsScreen(ctx);
  });

  // 8. /dashboard command
  bot.command("dashboard", async (ctx) => {
    await sendDashboardScreen(ctx);
  });

  // 9. /track command
  bot.command("track", async (ctx) => {
    if (ctx.from) {
      userSessionState.set(ctx.from.id, { state: "AWAITING_USERNAME" });
    }
    await ctx.reply(
      `➕ *Track a Telegram Account*\n\n` +
      `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
      `_Example:_ \`@fuadtesfaye\` or \`https://t.me/fuadtesfaye\``,
      { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
    );
  });

  // 10. /accounts command
  bot.command("accounts", async (ctx) => {
    await sendAccountsScreen(ctx);
  });

  // Callback query dispatcher
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const tgUser = ctx.from;
    if (!tgUser) return;

    try {
      await ctx.answerCallbackQuery().catch(() => {});
    } catch {}

    try {
      if (data === "action:home") {
        userSessionState.delete(tgUser.id);
        const text =
          `🏆 *Telegram League Arena*\n` +
          `_Track. Compete. Get Roasted._\n\n` +
          `Select an option below to enter the competition or open the Mini App:`;
        await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), true);
      } else if (data === "action:my") {
        await sendMyTelegramScreen(ctx, true);
      } else if (data === "action:league") {
        await sendLeagueScreen(ctx, true);
      } else if (data === "action:roast") {
        await sendRoastScreen(ctx, true);
      } else if (data === "action:rival") {
        await sendRivalScreen(ctx, true);
      } else if (data === "action:footprint") {
        await sendFootprintScreen(ctx, true);
      } else if (data === "action:awards") {
        await sendAwardsScreen(ctx, true);
      } else if (data === "action:dashboard") {
        await sendDashboardScreen(ctx, true);
      } else if (data === "action:track") {
        userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
        await safeSendOrEdit(
          ctx,
          `➕ *Track a Telegram Account*\n\n` +
          `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
          `_Example:_ \`@fuadtesfaye\``,
          BotMenus.backToMain(),
          true
        );
      } else if (data === "action:accounts") {
        await sendAccountsScreen(ctx, true);
      } else if (data.startsWith("action:view_acc:")) {
        const accountId = data.replace("action:view_acc:", "");
        await sendAccountDetailScreen(ctx, accountId, true);
      } else if (data.startsWith("action:confirm_track:")) {
        const username = data.replace("action:confirm_track:", "");
        const user = await UserRepository.findByTelegramId(tgUser.id);
        if (!user) return;

        try {
          const acc = await AccountService.addAccountToTrack(user.id, username);
          await safeSendOrEdit(
            ctx,
            `✅ *Competitor Enrolled!*\n\n` +
            `*${acc.displayName || "@" + acc.username}* has joined your Telegram League.\n\n` +
            `• Historical presence tracking begins now.\n` +
            `• Check \`/league\` anytime to inspect weekly standings.`,
            BotMenus.accountMenu(acc.id, true),
            true
          );
        } catch (err: any) {
          await safeSendOrEdit(
            ctx,
            `❌ *Error:* ${err.message || "Failed to add competitor"}`,
            BotMenus.backToMain(),
            true
          );
        }
      } else if (data.startsWith("action:toggle_track:")) {
        const accountId = data.replace("action:toggle_track:", "");
        const acc = await AccountRepository.findById(accountId);
        if (!acc) return;

        if (acc.trackingStatus === "active") {
          await AccountService.stopTracking(accountId);
          await safeSendOrEdit(
            ctx,
            `⏸ *Tracking Paused* for *${acc.displayName || "@" + acc.username}*.`,
            BotMenus.accountMenu(accountId, false),
            true
          );
        } else {
          await AccountService.resumeTracking(accountId);
          await safeSendOrEdit(
            ctx,
            `▶️ *Tracking Resumed* for *${acc.displayName || "@" + acc.username}*.`,
            BotMenus.accountMenu(accountId, true),
            true
          );
        }
      } else if (data.startsWith("action:delete_acc:")) {
        const accountId = data.replace("action:delete_acc:", "");
        await AccountService.deleteAccount(accountId);
        await safeSendOrEdit(
          ctx,
          `🗑 *Competitor removed from Telegram League.*`,
          BotMenus.backToMain(),
          true
        );
      }
    } catch (error: any) {
      logger.error("Error in bot callback query handler", { error });
    }
  });

  // Handle text input
  bot.on("message:text", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;

    const userState = userSessionState.get(tgUser.id);
    if (userState?.state === "AWAITING_USERNAME") {
      userSessionState.delete(tgUser.id);
      const text = ctx.message.text.trim();
      const username = normalizeUsername(text);

      if (!username || username.length < 3) {
        await ctx.reply("❌ Invalid username. Please send a valid username (e.g. `@fuadtesfaye`).", {
          reply_markup: BotMenus.backToMain(),
        });
        return;
      }

      await ctx.reply(`🔍 Resolving competitor \`@${username}\`...`, {
        parse_mode: "Markdown",
      });

      const target = await AccountService.resolveUsername(username);
      if (!target) {
        await ctx.reply(
          `❌ Could not resolve \`@${username}\` on Telegram.\nPlease ensure the public username exists and try again.`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
        return;
      }

      const name = [target.firstName, target.lastName].filter(Boolean).join(" ") || target.username;
      await ctx.reply(
        `👤 *Competitor Found*\n\n` +
        `• Name: *${name}*\n` +
        `• Username: \`@${target.username}\`\n\n` +
        `Enroll this account in your Telegram League competition?`,
        {
          parse_mode: "Markdown",
          reply_markup: BotMenus.trackConfirmMenu(target.username!),
        }
      );
    }
  });
}

// --- Helper for Safe Send or Edit ---
async function safeSendOrEdit(ctx: Context, text: string, replyMarkup: any, edit: boolean = false) {
  if (edit) {
    try {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: replyMarkup });
      return;
    } catch {
      // Fall back to sending reply if message edit fails
    }
  }
  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: replyMarkup });
}

// --- Screen Builders ---

async function sendMyTelegramScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const footprint = await FootprintService.getUserFootprint(user.id);

  const text =
    `👤 *MY TELEGRAM REPORT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `• *Observed Presence:* \`${footprint.formattedTotalDuration}\`\n` +
    `• *Messages Sent:* \`${footprint.totalMessagesSent}\`\n` +
    `• *Active Groups:* \`${footprint.activeGroupsCount}\` (${footprint.chatBreakdown.groupsPercent}% share)\n` +
    `• *Private Chats:* \`${footprint.activePrivateChatsCount}\` (${footprint.chatBreakdown.privateChatsPercent}% share)\n` +
    `• *Channels:* \`${footprint.activeChannelsCount}\` (${footprint.chatBreakdown.channelsPercent}% share)\n\n` +
    (footprint.topChat
      ? `🔥 *Top Community:* *${footprint.topChat.title}* (\`${footprint.topChat.formattedDuration}\`)\n\n`
      : "") +
    `Open the Mini App to connect your personal Telegram account and inspect hourly replays!`;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendFootprintScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const footprint = await FootprintService.getUserFootprint(user.id);

  if (footprint.chats.length === 0) {
    const text =
      `🕵️ *CHAT FOOTPRINT*\n\n` +
      `No observed chats yet. Connect your account in the Mini App or observe groups to build your activity footprint.`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const rows = footprint.chats
    .slice(0, 5)
    .map((c, i) => `${i + 1}. *${c.title}* ${c.customLabel ? `\`[${c.customLabel}]\`` : ""}\n   \`${c.formattedDuration}\` • ${c.messageCount} msgs (${c.percentageOfActivity}% share)`)
    .join("\n\n");

  const text =
    `🕵️ *OBSERVED CHAT FOOTPRINT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${rows}\n\n` +
    `_Only chats where your session has legitimate visibility are shown._`;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendLeagueScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.competitors.length === 0) {
    const text =
      `🏆 *TELEGRAM LEAGUE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `No competitors enrolled yet! Add up to 3 accounts (e.g. \`@fuadtesfaye\`) to begin the weekly competition.`;

    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const rows = leaderboard.competitors
    .map((c, i) => `${medals[i] || "•"} *${c.displayName}*\n   \`${c.formattedDuration}\` (${c.sessionCount} sessions)\n   ${c.title}`)
    .join("\n\n");

  const runnerUp = leaderboard.competitors[1];
  const gapText = runnerUp
    ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n👀 *Battle for the Crown:*\n*${runnerUp.displayName}* is only \`${runnerUp.formattedGapToLeader}\` away from stealing the crown!`
    : "";

  const text =
    `🏆 *TELEGRAM LEAGUE — WEEK ${leaderboard.weekNumber}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${rows}` +
    gapText;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendRoastScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.competitors.length === 0) {
    const text = `🔥 *Roast Me*\n\nEnroll at least one account to get roasted!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const victim = leaderboard.competitors[0];
  const roastData = LeagueService.generateRoast(victim, 1, leaderboard.competitors.length, "normal");

  const text =
    `🔥 *TELEGRAM LEAGUE ROAST*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎯 *Target:* *${victim.displayName}*\n` +
    `📊 *Observed:* \`${victim.formattedDuration}\` (${victim.sessionCount} sessions)\n` +
    `👑 *Title:* ${victim.title}\n\n` +
    `💬 _"${roastData.roastText}"_\n\n` +
    `${roastData.verdict}`;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendRivalScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const rivalData = await LeagueService.getRivalStatus(user.id);

  if (!rivalData) {
    const text = `⚔️ *The Rival*\n\nYou need at least 2 tracked accounts to activate head-to-head rivalry mode!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const { userAccount, rivalAccount, statusMessage } = rivalData;

  const text =
    `⚔️ *HEAD-TO-HEAD RIVALRY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👑 *${userAccount?.displayName}:* \`${userAccount?.formattedDuration}\`\n` +
    `😈 *${rivalAccount?.displayName}:* \`${rivalAccount?.formattedDuration}\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${statusMessage}`;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendAwardsScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.awards.length === 0) {
    const text = `🎖 *Mini-Awards*\n\nNo awards assigned yet. Ranks calculate every week based on observed presence.`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const rows = leaderboard.awards
    .map((a) => `${a.icon} *${a.title}*\n   Recipient: *${a.recipientName}*\n   _${a.statDescription}_\n   Badge: \`${a.badge}\``)
    .join("\n\n");

  const text =
    `🎖 *WEEKLY MINI-AWARDS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${rows}`;

  await safeSendOrEdit(ctx, text, BotMenus.leagueMenu(), edit);
}

async function sendDashboardScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  if (accounts.length === 0) {
    const text =
      `📊 *Dashboard Overview*\n\n` +
      `👤 *No Tracked Accounts*\n\n` +
      `Start tracking a Telegram account (e.g. \`@fuadtesfaye\`) to join the competition.`;

    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  let totalActiveToday = 0;
  const accountsText: string[] = [];

  for (const acc of accounts) {
    const overview = await AnalyticsService.getAccountOverview(acc.id);
    const todayDur = overview?.today.formattedDuration || "0m";
    totalActiveToday += overview?.today.totalSeconds || 0;

    const statusPill = acc.lastSeenStatus === "online" ? "🟢 Active" : "⚪ Offline";
    accountsText.push(`• *${acc.displayName || "@" + acc.username}* — ${statusPill} (\`${todayDur}\` today)`);
  }

  const text =
    `📊 *Telegram League Master Dashboard*\n\n` +
    `• Tracked accounts: *${accounts.length} / 3 slots*\n` +
    `• Total observed today: *${formatDuration(totalActiveToday)}*\n\n` +
    `*Competitors:*\n` +
    accountsText.join("\n");

  await safeSendOrEdit(ctx, text, BotMenus.accountsListMenu(accounts), edit);
}

async function sendAccountsScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  const text =
    `👤 *Tracked Competitors (${accounts.length} / 3 slots)*\n\n` +
    (accounts.length === 0
      ? `No accounts enrolled. Tap below to add your first competitor.`
      : `Select a competitor to view session history and roasts:`);

  await safeSendOrEdit(ctx, text, BotMenus.accountsListMenu(accounts), edit);
}

async function sendAccountDetailScreen(ctx: Context, accountId: string, edit: boolean = false) {
  const overview = await AnalyticsService.getAccountOverview(accountId);
  if (!overview) {
    await safeSendOrEdit(ctx, "❌ Account not found.", BotMenus.backToMain(), edit);
    return;
  }

  const acc = overview.account;
  const statusPill = acc.lastSeenStatus === "online" ? "🟢 Currently Active" : "⚪ Offline";
  const title = LeagueService.generateTitle({
    totalActiveSeconds: overview.sevenDays.totalSeconds,
    longestSessionSeconds: overview.personalBests.longestSessionSeconds,
    sessionCount: overview.sevenDays.sessionCount,
    nightActivitySeconds: 0,
    morningActivitySeconds: 0,
  });

  const text =
    `👤 *${acc.displayName || "@" + acc.username}*\n` +
    `${statusPill} — ${title}\n\n` +
    `• *Observed Today:* \`${overview.today.formattedDuration}\` (${overview.today.sessionCount} sessions)\n` +
    `• *7-Day Total:* \`${overview.sevenDays.formattedDuration}\`\n` +
    `• *Peak Hour:* \`${overview.sevenDays.peakHour}:00 - ${overview.sevenDays.peakHour + 1}:00\`\n` +
    `• *Active Streak:* \`${overview.streaks.currentStreakDays} days\``;

  await safeSendOrEdit(
    ctx,
    text,
    BotMenus.accountMenu(accountId, acc.trackingStatus === "active"),
    edit
  );
}
