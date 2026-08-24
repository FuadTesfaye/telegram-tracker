import { Bot, Context } from "grammy";
import { UserRepository } from "../repositories/user.repository";
import { AccountRepository } from "../repositories/account.repository";
import { AccountService } from "../services/account.service";
import { AnalyticsService } from "../services/analytics.service";
import { BotMenus } from "./menus";
import { formatDuration, normalizeUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Simple in-memory conversation state for text inputs (per user)
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
      `👋 *Welcome to Telemetr*\n\n` +
      `Track observable Telegram activity, understand daily & weekly patterns, and build a verified historical presence timeline.\n\n` +
      `⚠️ *Data Ethics & Honesty:*\n` +
      `• Data collection starts from the exact moment tracking is activated.\n` +
      `• Activity is based on observable Telegram presence, not private messages or device screen time.\n\n` +
      `Choose an option below or launch the Mini App:`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.mainMenu(),
    });
  });

  // 2. /help command
  bot.command("help", async (ctx) => {
    const text =
      `ℹ️ *Telemetr Help & Guidance*\n\n` +
      `• *Dashboard*: Live statistics across all tracked accounts.\n` +
      `• *Track Account*: Add any public @username to start tracking.\n` +
      `• *Analytics*: Daily trends, 24-hour heatmaps, peak activity hours, and quiet windows.\n` +
      `• *Mini App*: Touch-friendly dashboard with interactive charts and calendar.\n\n` +
      `*Commands:*\n` +
      `/start - Open main menu\n` +
      `/dashboard - Summary of all accounts\n` +
      `/track - Add new account\n` +
      `/accounts - Manage tracked accounts\n` +
      `/settings - Configure timezone & alerts`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.backToMain(),
    });
  });

  // 3. /dashboard command
  bot.command("dashboard", async (ctx) => {
    await sendDashboardScreen(ctx);
  });

  // 4. /track command
  bot.command("track", async (ctx) => {
    if (ctx.from) {
      userSessionState.set(ctx.from.id, { state: "AWAITING_USERNAME" });
    }
    await ctx.reply(
      `➕ *Track a Telegram Account*\n\n` +
      `Send the public Telegram username you would like to observe:\n\n` +
      `_Example:_ \`@username\` or \`https://t.me/username\``,
      { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
    );
  });

  // 5. /accounts command
  bot.command("accounts", async (ctx) => {
    await sendAccountsScreen(ctx);
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
          `👋 *Telemetr Dashboard*\n\n` +
          `Select an option below to manage tracked accounts, inspect analytics, or launch the Mini App:`;
        await ctx.editMessageText(text, {
          parse_mode: "Markdown",
          reply_markup: BotMenus.mainMenu(),
        });
      } else if (data === "action:dashboard") {
        await sendDashboardScreen(ctx, true);
      } else if (data === "action:track") {
        userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
        await ctx.editMessageText(
          `➕ *Track a Telegram Account*\n\n` +
          `Send the public Telegram username you want to observe:\n\n` +
          `_Example:_ \`@username\` or \`https://t.me/username\``,
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
            `✅ *Tracking Activated*\n\n` +
            `*${acc.displayName || "@" + acc.username}* is now being monitored for observable presence.\n\n` +
            `• Historical data collection started: \`${acc.trackingStartedAt.toUTCString()}\`\n` +
            `• You can view daily activity, 24-hour heatmaps, and sessions anytime.`,
            {
              parse_mode: "Markdown",
              reply_markup: BotMenus.accountMenu(acc.id, true),
            }
          );
        } catch (err: any) {
          await ctx.editMessageText(`❌ *Error:* ${err.message || "Failed to start tracking"}`, {
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
          `🗑 *Account and historical tracking data deleted successfully.*`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
      } else if (data === "action:analytics" || data === "action:history") {
        await sendDashboardScreen(ctx, true);
      } else if (data === "action:settings") {
        await ctx.editMessageText(
          `⚙️ *Telemetr Settings*\n\n` +
          `• Timezone: \`UTC\` (changeable in Mini App)\n` +
          `• Daily Summary: \`Enabled (21:00)\`\n` +
          `• Weekly Report: \`Enabled (Mondays)\`\n` +
          `• Session Alert Threshold: \`60 minutes\`\n\n` +
          `Use the Mini App for full custom configuration.`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
      } else if (data === "action:alerts") {
        await ctx.editMessageText(
          `🔔 *Activity Alerts*\n\n` +
          `• *Long Session Alert*: Triggered when an account stays active > 60m.\n` +
          `• *Anomaly Detection*: Triggered when daily activity exceeds 2σ deviation.\n\n` +
          `Notifications will be delivered directly to this chat.`,
          { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
        );
      } else if (data === "action:help") {
        await ctx.editMessageText(
          `ℹ️ *Telemetr Activity Intelligence*\n\n` +
          `• *Observable Signals*: Telegram exposes online, offline, and coarse presence.\n` +
          `• *Session State Machine*: Converts raw status updates into normalized activity periods.\n` +
          `• *Mini App*: For interactive charts, heatmaps, and exports, click "Open Mini App".`,
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

      await ctx.reply(`🔍 Resolving Telegram account for \`@${username}\`...`, {
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
        `👤 *Account Found*\n\n` +
        `• Name: *${name}*\n` +
        `• Username: \`@${target.username}\`\n` +
        `• Telegram User ID: \`${target.telegramUserId}\`\n\n` +
        `Start observing this account? Historical data will accumulate from the moment you click Start.`,
        {
          parse_mode: "Markdown",
          reply_markup: BotMenus.trackConfirmMenu(target.username!),
        }
      );
    }
  });
}

// --- Screen Builders ---

async function sendDashboardScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({
    telegramId: tgUser.id,
    username: tgUser.username,
  });

  const accounts = await AccountRepository.listByOwner(user.id);
  if (accounts.length === 0) {
    const text =
      `📊 *Dashboard Overview*\n\n` +
      `👤 *No Tracked Accounts*\n\n` +
      `You are not observing any accounts yet. Start tracking a Telegram username to accumulate historical presence analytics.`;

    if (edit) {
      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        reply_markup: BotMenus.mainMenu(),
      });
    } else {
      await ctx.reply(text, {
        parse_mode: "Markdown",
        reply_markup: BotMenus.mainMenu(),
      });
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
    `📊 *Telemetr Master Dashboard*\n\n` +
    `• Tracked accounts: *${accounts.length}*\n` +
    `• Total observed today: *${formatDuration(totalActiveToday)}*\n\n` +
    `*Accounts Summary:*\n` +
    accountsText.join("\n") +
    `\n\n_Tap an account below to view deep analytics or open the Mini App:_`;

  if (edit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountsListMenu(accounts),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountsListMenu(accounts),
    });
  }
}

async function sendAccountsScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  const text =
    `👤 *Tracked Accounts (${accounts.length})*\n\n` +
    (accounts.length === 0
      ? `No accounts are currently being tracked. Tap below to add one.`
      : `Select an account to view session history, heatmap, and trends:`);

  if (edit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountsListMenu(accounts),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.accountsListMenu(accounts),
    });
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
  const trendSign = overview.weeklyTrend.direction === "up" ? "📈" : overview.weeklyTrend.direction === "down" ? "📉" : "➡️";

  const text =
    `👤 *${acc.displayName || "@" + acc.username}*\n` +
    `${statusPill}\n\n` +
    `• *Tracked Since:* \`${new Date(acc.trackingStartedAt).toLocaleDateString()}\`\n` +
    `• *Observed Today:* \`${overview.today.formattedDuration}\` (${overview.today.sessionCount} sessions)\n` +
    `• *7-Day Total:* \`${overview.sevenDays.formattedDuration}\`\n` +
    `• *30-Day Total:* \`${overview.thirtyDays.formattedDuration}\`\n` +
    `• *Weekly Trend:* ${trendSign} \`${overview.weeklyTrend.changePercentage > 0 ? "+" : ""}${overview.weeklyTrend.changePercentage}%\`\n` +
    `• *Average Session:* \`${formatDuration(overview.today.averageSessionSeconds || overview.sevenDays.averageSessionSeconds)}\`\n` +
    `• *Peak Hour:* \`${overview.sevenDays.peakHour}:00 - ${overview.sevenDays.peakHour + 1}:00\`\n` +
    `• *Active Streak:* \`${overview.streaks.currentStreakDays} days\` (Best: \`${overview.streaks.longestStreakDays}d\`)`;

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
