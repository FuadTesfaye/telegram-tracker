import { Bot, Context } from "grammy";
import { UserRepository } from "../repositories/user.repository";
import { AccountRepository } from "../repositories/account.repository";
import { AccountService } from "../services/account.service";
import { AnalyticsService } from "../services/analytics.service";
import { LeagueService } from "../services/league.service";
import { FootprintService } from "../services/footprint.service";
import { RoastEngineService, type RoastLevel } from "../services/roast-engine.service";
import { BotMenus } from "./menus";
import { formatDuration, normalizeUsername } from "@/lib/utils";
import { logger } from "@/lib/logger";

const userSessionState = new Map<number, { state: string; data?: any }>();

export function registerBotHandlers(bot: Bot) {
  // 1. /start & /menu command — Interactive Choice Hub
  const sendWelcomeChoiceHub = async (ctx: Context) => {
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
      `🏆 *TELEGRAM LEAGUE — CHOICE HUB*\n` +
      `_Track. Compete. Get Roasted._\n\n` +
      `Welcome, *${tgUser.first_name || "Competitor"}*! Choose an action below:\n\n` +
      `1️⃣ *Weekly League Standings* — Ranks, medals & gap to crown\n` +
      `2️⃣ *My Stats & Footprint* — Personal presence & active chats\n` +
      `3️⃣ *Roast Me* — Select intensity (Friendly, Normal, Brutal, Nuclear)\n` +
      `4️⃣ *The Rival* — Head-to-head live score gap & rivalry\n` +
      `5️⃣ *Mini-Awards* — Superlative shelf (Session King, Night Owl, etc.)\n` +
      `6️⃣ *Competitor Slots* — Manage your 3 tracked accounts\n` +
      `7️⃣ *Help & Rules* — Privacy policy & tournament rules\n\n` +
      `👇 _Tap a numbered button below to proceed:_`;

    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: BotMenus.mainMenu(),
    });

    // Also activate the bottom persistent reply keyboard
    await ctx.reply(`🕹 *1-Tap Quick Navigation Active:*`, {
      reply_markup: BotMenus.persistentReplyKeyboard(),
    });
  };

  bot.command("start", sendWelcomeChoiceHub);
  bot.command("menu", sendWelcomeChoiceHub);

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
    await sendRoastPickerScreen(ctx);
  });

  // 5. /rival command
  bot.command("rival", async (ctx) => {
    await sendRivalPickerScreen(ctx);
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
      `➕ *Track a Telegram Competitor*\n\n` +
      `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
      `_Example:_ \`@fuadtesfaye\` or \`@username\``,
      { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
    );
  });

  // 10. /accounts command
  bot.command("accounts", async (ctx) => {
    await sendAccountsScreen(ctx);
  });

  // 11. /help command
  bot.command("help", async (ctx) => {
    await sendHelpScreen(ctx);
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
          `🏆 *TELEGRAM LEAGUE — CHOICE HUB*\n` +
          `_Track. Compete. Get Roasted._\n\n` +
          `Choose an action to proceed:`;
        await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), true);
      } else if (data === "action:my") {
        await sendMyTelegramScreen(ctx, true);
      } else if (data === "action:league") {
        await sendLeagueScreen(ctx, true);
      } else if (data === "action:roast" || data === "action:roast_picker") {
        await sendRoastPickerScreen(ctx, undefined, "normal", true);
      } else if (data.startsWith("action:select_roast_acc:")) {
        const accountId = data.replace("action:select_roast_acc:", "");
        await sendRoastPickerScreen(ctx, accountId, "normal", true);
      } else if (data.startsWith("action:set_roast_lvl:")) {
        const [, , lvl, accId] = data.split(":");
        await sendRoastPickerScreen(ctx, accId === "top" ? undefined : accId, lvl as RoastLevel, true);
      } else if (data.startsWith("action:re_roast:")) {
        const [, , accId, lvl] = data.split(":");
        await sendRoastPickerScreen(ctx, accId === "top" ? undefined : accId, lvl as RoastLevel, true);
      } else if (data === "action:rival" || data === "action:rival_picker") {
        await sendRivalPickerScreen(ctx, true);
      } else if (data.startsWith("action:set_rival:")) {
        const rivalAccountId = data.replace("action:set_rival:", "");
        const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
        await LeagueService.setRival(user.id, rivalAccountId);
        await sendRivalScreen(ctx, true);
      } else if (data === "action:footprint") {
        await sendFootprintScreen(ctx, true);
      } else if (data === "action:awards") {
        await sendAwardsScreen(ctx, true);
      } else if (data === "action:dashboard") {
        await sendDashboardScreen(ctx, true);
      } else if (data === "action:help") {
        await sendHelpScreen(ctx, true);
      } else if (data === "action:track") {
        userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
        await safeSendOrEdit(
          ctx,
          `➕ *Track a Telegram Competitor*\n\n` +
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
      } else if (data === "action:settings") {
        await safeSendOrEdit(
          ctx,
          `⚙️ *Telegram League Settings*\n\n` +
          `• Weekly Winner Notification: \`Enabled\`\n` +
          `• Timezone: \`UTC\`\n` +
          `• League Tiers: \`Bronze (<10h), Silver (10-20h), Gold (20-30h), Diamond (30-40h), Royalty (40h+)\`\n\n` +
          `Use the Mini App for full customization.`,
          BotMenus.backToMain(),
          true
        );
      }
    } catch (error: any) {
      logger.error("Error in bot callback query handler", { error });
    }
  });

  // Handle text input & persistent reply keyboard buttons
  bot.on("message:text", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;

    const text = ctx.message.text.trim();

    // 1. Check persistent keyboard triggers
    if (text === "🏆 Weekly League" || text === "🏆 Telegram League") return sendLeagueScreen(ctx);
    if (text === "👤 My Stats") return sendMyTelegramScreen(ctx);
    if (text === "🔥 Roast Me") return sendRoastPickerScreen(ctx);
    if (text === "⚔️ The Rival") return sendRivalPickerScreen(ctx);
    if (text === "🕵️ Chat Footprint") return sendFootprintScreen(ctx);
    if (text === "🎖 Mini-Awards") return sendAwardsScreen(ctx);
    if (text === "➕ Add Competitor") {
      userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
      return ctx.reply(
        `➕ *Track a Telegram Competitor*\n\n` +
        `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
        `_Example:_ \`@fuadtesfaye\``,
        { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
      );
    }
    if (text === "⚙️ Main Menu" || text === "⚙️ Settings") return sendWelcomeChoiceHub(ctx);

    // 2. Check pending input state
    const userState = userSessionState.get(tgUser.id);
    if (userState?.state === "AWAITING_USERNAME") {
      userSessionState.delete(tgUser.id);
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
      // fallback
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

async function sendRoastPickerScreen(
  ctx: Context,
  accountId?: string,
  level: RoastLevel = "normal",
  edit: boolean = false
) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const leaderboard = await LeagueService.getWeeklyLeaderboard(user.id);

  if (leaderboard.competitors.length === 0) {
    const text = `🔥 *Roast Me*\n\nEnroll at least one account to get roasted!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const target = accountId
    ? leaderboard.competitors.find((c) => c.accountId === accountId) || leaderboard.competitors[0]
    : leaderboard.competitors[0];

  const roastData = LeagueService.generateRoast(target, target.rank, leaderboard.competitors.length, level);

  const levelIcons: Record<RoastLevel, string> = {
    friendly: "🙂 Friendly",
    normal: "🔥 Normal",
    brutal: "💀 Brutal",
    nuclear: "☠️ Nuclear",
  };

  const text =
    `🔥 *TELEGRAM LEAGUE ROAST (${levelIcons[level]})*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🎯 *Target:* *${target.displayName}*\n` +
    `📊 *Observed:* \`${target.formattedDuration}\` (${target.sessionCount} sessions)\n` +
    `👑 *Title:* ${target.title}\n\n` +
    `💬 _"${roastData.roastText}"_\n\n` +
    `${roastData.verdict}\n\n` +
    `_Choose intensity or switch competitor below:_`;

  const menu = BotMenus.roastPickerMenu(leaderboard.competitors, target.accountId, level);
  await safeSendOrEdit(ctx, text, menu, edit);
}

async function sendRivalPickerScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  if (accounts.length < 2) {
    const text = `⚔️ *The Rival Showdown*\n\nYou need at least 2 tracked accounts to activate head-to-head rivalry mode!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const rivalData = await LeagueService.getRivalStatus(user.id);
  const currentRivalId = rivalData?.rivalAccount?.accountId;

  const text =
    `⚔️ *HEAD-TO-HEAD RIVALRY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👑 *${rivalData?.userAccount?.displayName}:* \`${rivalData?.userAccount?.formattedDuration}\`\n` +
    `😈 *${rivalData?.rivalAccount?.displayName}:* \`${rivalData?.rivalAccount?.formattedDuration}\`\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${rivalData?.statusMessage}\n\n` +
    `_Select a competitor below to switch your designated rival:_`;

  const menu = BotMenus.rivalPickerMenu(accounts, currentRivalId);
  await safeSendOrEdit(ctx, text, menu, edit);
}

async function sendRivalScreen(ctx: Context, edit: boolean = false) {
  return sendRivalPickerScreen(ctx, edit);
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
      : `Select a competitor to view session history, set as rival, or generate a roast:`);

  await safeSendOrEdit(ctx, text, BotMenus.accountsListMenu(accounts), edit);
}

async function sendHelpScreen(ctx: Context, edit: boolean = false) {
  const text =
    `📖 *Telegram League Rules & Guidance*\n\n` +
    `• *Weekly League*: Compete with 3 accounts in weekly presence tournaments.\n` +
    `• *The Rival*: Designate 1 account as your rival for live score gap alerts.\n` +
    `• *Roast Me*: Deterministic roasts across 4 levels (Friendly, Normal, Brutal, Nuclear).\n` +
    `• *Observed Footprint*: Aggregates chat & community presence where authorized.\n\n` +
    `*Commands:*\n` +
    `/start or /menu - Choice Hub\n` +
    `/my - My stats & footprint\n` +
    `/league - Current standings\n` +
    `/roast - Roast selector\n` +
    `/rival - Rival showdown\n` +
    `/footprint - Community activity\n` +
    `/awards - Weekly superlatives\n` +
    `/track - Add competitor`;

  await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
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
