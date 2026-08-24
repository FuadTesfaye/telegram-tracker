import { Bot, Context } from "grammy";
import { UserRepository } from "../repositories/user.repository";
import { AccountRepository } from "../repositories/account.repository";
import { AccountService } from "../services/account.service";
import { AnalyticsService } from "../services/analytics.service";
import { LeagueService } from "../services/league.service";
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
      `Rank your tracked accounts in a weekly activity competition, unlock ridiculous titles, fight your Rival, and get roasted by actual presence numbers.\n\n` +
      `⚠️ *Fair Play & Ethics:*\n` +
      `• Ranks are based purely on observable Telegram presence signals.\n` +
      `• No access to private messages, contacts, or device screen time.\n\n` +
      `Choose an option below to enter the arena:`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.mainMenu(),
    });
  });

  // 2. /league command
  bot.command("league", async (ctx) => {
    await sendLeagueScreen(ctx);
  });

  // 3. /roast command
  bot.command("roast", async (ctx) => {
    await sendRoastScreen(ctx);
  });

  // 4. /rival command
  bot.command("rival", async (ctx) => {
    await sendRivalScreen(ctx);
  });

  // 5. /awards command
  bot.command("awards", async (ctx) => {
    await sendAwardsScreen(ctx);
  });

  // 6. /dashboard command
  bot.command("dashboard", async (ctx) => {
    await sendDashboardScreen(ctx);
  });

  // 7. /track command
  bot.command("track", async (ctx) => {
    if (ctx.from) {
      userSessionState.set(ctx.from.id, { state: "AWAITING_USERNAME" });
    }
    await ctx.reply(
      `➕ *Track a Telegram Account*\n\n` +
      `Send the public Telegram username to add to your competition (up to 3 accounts):\n\n` +
      `_Example:_ \`@username\` or \`https://t.me/username\``,
      { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
    );
  });

  // 8. /accounts command
  bot.command("accounts", async (ctx) => {
    await sendAccountsScreen(ctx);
  });

  // 9. /help command
  bot.command("help", async (ctx) => {
    const text =
      `🏆 *Telegram League Guide*\n\n` +
      `• *Weekly League*: Compete with your 3 tracked accounts. Ranked every week.\n` +
      `• *Roast Me*: Deterministic, hilarious roasts generated from your actual presence stats.\n` +
      `• *The Rival*: Head-to-head live tracker against your chosen nemesis.\n` +
      `• *Mini-Awards*: Weekly superlatives like Session King, Night Owl, and Ghost.\n` +
      `• *Mini App*: Touch-first visual leaderboard, 24h heatmaps, and achievements.\n\n` +
      `*Commands:*\n` +
      `/start - Main menu\n` +
      `/league - View current weekly leaderboard\n` +
      `/roast - Roast the current leader\n` +
      `/rival - Head-to-head rivalry\n` +
      `/awards - Weekly mini-awards\n` +
      `/track - Add account to competition`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.backToMain(),
    });
  });

  // Callback query dispatcher
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    const tgUser = ctx.from;
    if (!tgUser) return;

    await ctx.answerCallbackQuery();

    try {
      if (data === "action:home") {
        userSessionState.delete(tgUser.id);
        const text =
          `🏆 *Telegram League Arena*\n` +
          `_Track. Compete. Get Roasted._\n\n` +
          `Select an option below to view the weekly leaderboard, challenge your Rival, or open the Mini App:`;
        await ctx.editMessageText(text, {
          parse_mode: "Markdown",
          reply_markup: BotMenus.mainMenu(),
        });
      } else if (data === "action:league") {
        await sendLeagueScreen(ctx, true);
      } else if (data === "action:roast") {
        await sendRoastScreen(ctx, true);
      } else if (data === "action:rival") {
        await sendRivalScreen(ctx, true);
      } else if (data === "action:awards") {
        await sendAwardsScreen(ctx, true);
      } else if (data === "action:dashboard") {
        await sendDashboardScreen(ctx, true);
      } else if (data === "action:track") {
        userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
        await ctx.editMessageText(
          `➕ *Track a Telegram Account*\n\n` +
          `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
          `_Example:_ \`@username\``,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
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
          await ctx.editMessageText(
            `✅ *Competitor Enrolled!*\n\n` +
            `*${acc.displayName || "@" + acc.username}* has joined your Telegram League.\n\n` +
            `• Historical presence tracking begins now.\n` +
            `• Check \`/league\` anytime to inspect weekly standings.`,
            {
              parse_mode: "Markdown",
              reply_markup: BotMenus.accountMenu(acc.id, true),
            }
          );
        } catch (err: any) {
          await ctx.editMessageText(`❌ *Error:* ${err.message || "Failed to add competitor"}`, {
            parse_mode: "Markdown",
            reply_markup: BotMenus.backToMain(),
          });
        }
      } else if (data.startsWith("action:toggle_track:")) {
        const accountId = data.replace("action:toggle_track:", "");
        const acc = await AccountRepository.findById(accountId);
        if (!acc) return;

        if (acc.trackingStatus === "active") {
          await AccountService.stopTracking(accountId);
          await ctx.editMessageText(
            `⏸ *Tracking Paused* for *${acc.displayName || "@" + acc.username}*.`,
            { parse_mode: "Markdown", reply_markup: BotMenus.accountMenu(accountId, false) }
          );
        } else {
          await AccountService.resumeTracking(accountId);
          await ctx.editMessageText(
            `▶️ *Tracking Resumed* for *${acc.displayName || "@" + acc.username}*.`,
            { parse_mode: "Markdown", reply_markup: BotMenus.accountMenu(accountId, true) }
          );
        }
      } else if (data.startsWith("action:delete_acc:")) {
        const accountId = data.replace("action:delete_acc:", "");
        await AccountService.deleteAccount(accountId);
        await ctx.editMessageText(
          `🗑 *Competitor removed from Telegram League.*`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
      } else if (data === "action:settings") {
        await ctx.editMessageText(
          `⚙️ *Telegram League Settings*\n\n` +
          `• Weekly Winner Notification: \`Enabled\`\n` +
          `• Timezone: \`UTC\`\n` +
          `• League Tiers: \`Bronze (<10h), Silver (10-20h), Gold (20-30h), Diamond (30-40h), Royalty (40h+)\`\n\n` +
          `Use the Mini App for full customization.`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
      }
    } catch (error: any) {
      logger.error("Error in bot callback query handler", { error });
    }
  });

  // Handle text input (e.g. username entry)
  bot.on("message:text", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;

    const userState = userSessionState.get(tgUser.id);
    if (userState?.state === "AWAITING_USERNAME") {
      userSessionState.delete(tgUser.id);
      const text = ctx.message.text.trim();
      const username = normalizeUsername(text);

      if (!username || username.length < 3) {
        await ctx.reply("❌ Invalid username. Please send a valid username (e.g. `@alice`).", {
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

// --- Screen Builders ---

async function sendLeagueScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.competitors.length === 0) {
    const text =
      `🏆 *TELEGRAM LEAGUE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `No competitors enrolled yet! Add up to 3 accounts to begin the weekly competition.`;

    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    }
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

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  }
}

async function sendRoastScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.competitors.length === 0) {
    const text = `🔥 *Roast Me*\n\nEnroll at least one account to get roasted!`;
    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    }
    return;
  }

  const victim = leaderboard.competitors[0];
  const roastData = LeagueService.generateRoast(victim, 1, leaderboard.competitors.length);

  const text =
    `🔥 *TELEGRAM LEAGUE ROAST*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎯 *Target:* *${victim.displayName}*\n` +
    `📊 *Observed:* \`${victim.formattedDuration}\` (${victim.sessionCount} sessions)\n` +
    `👑 *Title:* ${victim.title}\n\n` +
    `💬 _"${roastData.roast}"_\n\n` +
    `${roastData.verdict}`;

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  }
}

async function sendRivalScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const rivalData = await LeagueService.getRivalStatus(user.id);

  if (!rivalData) {
    const text = `⚔️ *The Rival*\n\nYou need at least 2 tracked accounts to activate head-to-head rivalry mode!`;
    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    }
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

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  }
}

async function sendAwardsScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.awards.length === 0) {
    const text = `🎖 *Mini-Awards*\n\nNo awards assigned yet. Ranks calculate every week based on observed presence.`;
    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    }
    return;
  }

  const rows = leaderboard.awards
    .map((a) => `${a.icon} *${a.title}*\n   Recipient: *${a.recipientName}*\n   _${a.statDescription}_\n   Badge: \`${a.badge}\``)
    .join("\n\n");

  const text =
    `🎖 *WEEKLY MINI-AWARDS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${rows}`;

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.leagueMenu() });
  }
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
      `Start tracking a Telegram account to join the competition.`;

    if (edit) {
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    } else {
      await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.mainMenu() });
    }
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
    `• Tracked accounts: *${accounts.length} / 3*\n` +
    `• Total observed today: *${formatDuration(totalActiveToday)}*\n\n` +
    `*Competitors:*\n` +
    accountsText.join("\n");

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.accountsListMenu(accounts) });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.accountsListMenu(accounts) });
  }
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

  if (edit) {
    await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: BotMenus.accountsListMenu(accounts) });
  } else {
    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: BotMenus.accountsListMenu(accounts) });
  }
}

async function sendAccountDetailScreen(ctx: Context, accountId: string, edit: boolean = false) {
  const overview = await AnalyticsService.getAccountOverview(accountId);
  if (!overview) {
    if (edit) {
      await ctx.editMessageText("❌ Account not found.", { reply_markup: BotMenus.backToMain() });
    }
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

  if (edit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountMenu(accountId, acc.trackingStatus === "active"),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountMenu(accountId, acc.trackingStatus === "active"),
    });
  }
}
