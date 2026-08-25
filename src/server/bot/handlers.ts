import { Bot, Context } from "grammy";
import { UserRepository } from "../repositories/user.repository";
import { AccountRepository } from "../repositories/account.repository";
import { DailyRepository } from "../repositories/daily.repository";
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
  // 1. /start, /menu, /hub command — Interactive Choice Hub
  const sendWelcomeChoiceHub = async (ctx: Context, edit: boolean = false) => {
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
      `1️⃣ *Weekly League Ranks* — Standings, medals & crown gap\n` +
      `2️⃣ *My Stats & Footprint* — Personal telemetry & active chats\n` +
      `3️⃣ *Roast Me* — 4 intensities (Friendly, Normal, Brutal, Nuclear)\n` +
      `4️⃣ *The Rival* — Head-to-head live score gap & battle\n` +
      `5️⃣ *Weekly Bets & Odds* — Telemetry multipliers & payouts\n` +
      `6️⃣ *Compare Competitors* — Side-by-side comparison table\n` +
      `7️⃣ *Mini-Awards* — Superlatives (Session King, Night Owl, etc.)\n` +
      `8️⃣ *Competitor Slots* — Manage your 3 tracked accounts\n` +
      `9️⃣ *Help & Rules* — Privacy guarantee & tournament rules\n\n` +
      `👇 _Tap a button or type a number (1-9) to proceed:_`;

    if (edit) {
      await safeSendOrEdit(ctx, welcomeText, BotMenus.mainMenu(), true);
    } else {
      await ctx.reply(welcomeText, {
        parse_mode: "Markdown",
        reply_markup: BotMenus.mainMenu(),
      });

      // Also activate the bottom persistent reply keyboard
      await ctx.reply(`🕹 *1-Tap Quick Navigation Active:*`, {
        reply_markup: BotMenus.persistentReplyKeyboard(),
      });
    }
  };

  bot.command(["start", "menu", "hub"], async (ctx) => {
    await sendWelcomeChoiceHub(ctx, false);
  });

  // 2. /league, /standings, /ranks
  bot.command(["league", "standings", "ranks"], async (ctx) => {
    await sendLeagueScreen(ctx);
  });

  // 3. /my, /stats, /me
  bot.command(["my", "stats", "me"], async (ctx) => {
    await sendMyTelegramScreen(ctx);
  });

  // 4. /roast, /roastme
  bot.command(["roast", "roastme"], async (ctx) => {
    await sendRoastPickerScreen(ctx);
  });

  // 5. /rival, /showdown
  bot.command(["rival", "showdown"], async (ctx) => {
    await sendRivalPickerScreen(ctx);
  });

  // 6. /bets, /wagers, /odds
  bot.command(["bets", "wagers", "odds"], async (ctx) => {
    await sendWagersScreen(ctx);
  });

  // 7. /compare, /versus
  bot.command(["compare", "versus"], async (ctx) => {
    await sendCompareScreen(ctx);
  });

  // 8. /footprint, /chats
  bot.command(["footprint", "chats"], async (ctx) => {
    await sendFootprintScreen(ctx);
  });

  // 9. /awards, /trophies
  bot.command(["awards", "trophies"], async (ctx) => {
    await sendAwardsScreen(ctx);
  });

  // 10. /dashboard
  bot.command("dashboard", async (ctx) => {
    await sendDashboardScreen(ctx);
  });

  // 11. /track, /add
  bot.command(["track", "add"], async (ctx) => {
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

  // 12. /accounts, /slots
  bot.command(["accounts", "slots"], async (ctx) => {
    await sendAccountsScreen(ctx);
  });

  // 13. /help, /rules
  bot.command(["help", "rules"], async (ctx) => {
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
        await sendWelcomeChoiceHub(ctx, true);
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
      } else if (data === "action:wagers" || data === "action:bets") {
        await sendWagersScreen(ctx, true);
      } else if (data === "action:compare") {
        await sendCompareScreen(ctx, true);
      } else if (data.startsWith("action:compare_with:")) {
        const accBId = data.replace("action:compare_with:", "");
        await sendCompareScreen(ctx, true, accBId);
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
      } else if (data.startsWith("action:view_acc:") || data.startsWith("action:acc_overview:")) {
        const accountId = data.replace("action:view_acc:", "").replace("action:acc_overview:", "");
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

  // Handle text input & persistent reply keyboard buttons & numbered shortcuts
  bot.on("message:text", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;

    const rawText = ctx.message.text.trim();
    const textLower = rawText.toLowerCase();

    // 1. Check numbered shortcuts & keyword triggers
    if (rawText === "1" || textLower === "1" || rawText === "🏆 Weekly League" || rawText === "🏆 Telegram League" || textLower === "league" || textLower === "ranks" || textLower === "standings") {
      return sendLeagueScreen(ctx);
    }
    if (rawText === "2" || textLower === "2" || rawText === "👤 My Stats" || textLower === "my" || textLower === "stats" || textLower === "my stats" || textLower === "me") {
      return sendMyTelegramScreen(ctx);
    }
    if (rawText === "3" || textLower === "3" || rawText === "🔥 Roast Me" || textLower === "roast" || textLower === "roast me" || textLower === "roastme") {
      return sendRoastPickerScreen(ctx);
    }
    if (rawText === "4" || textLower === "4" || rawText === "⚔️ The Rival" || textLower === "rival" || textLower === "the rival" || textLower === "showdown") {
      return sendRivalPickerScreen(ctx);
    }
    if (rawText === "5" || textLower === "5" || rawText === "🎲 Weekly Bets" || textLower === "bets" || textLower === "wagers" || textLower === "odds") {
      return sendWagersScreen(ctx);
    }
    if (rawText === "6" || textLower === "6" || rawText === "⚖️ Compare" || rawText === "⚔️ Compare" || textLower === "compare" || textLower === "versus") {
      return sendCompareScreen(ctx);
    }
    if (rawText === "7" || textLower === "7" || rawText === "🎖 Mini-Awards" || textLower === "awards" || textLower === "trophies") {
      return sendAwardsScreen(ctx);
    }
    if (rawText === "8" || textLower === "8" || rawText === "➕ Add Competitor" || textLower === "add" || textLower === "track" || textLower === "accounts" || textLower === "slots") {
      userSessionState.set(tgUser.id, { state: "AWAITING_USERNAME" });
      return ctx.reply(
        `➕ *Track a Telegram Competitor*\n\n` +
        `Send the public Telegram username to add to your competition (up to 3 slots):\n\n` +
        `_Example:_ \`@fuadtesfaye\``,
        { parse_mode: "Markdown", reply_markup: BotMenus.backToMain() }
      );
    }
    if (rawText === "9" || textLower === "9" || textLower === "help" || textLower === "rules") {
      return sendHelpScreen(ctx);
    }
    if (rawText === "⚙️ Choice Hub" || rawText === "⚙️ Main Menu" || textLower === "menu" || textLower === "hub" || textLower === "start") {
      return sendWelcomeChoiceHub(ctx);
    }
    if (rawText === "🕵️ Chat Footprint" || textLower === "footprint" || textLower === "chats") {
      return sendFootprintScreen(ctx);
    }

    // 2. Check pending input state
    const userState = userSessionState.get(tgUser.id);
    if (userState?.state === "AWAITING_USERNAME" || rawText.startsWith("@") || rawText.includes("t.me/")) {
      userSessionState.delete(tgUser.id);
      const username = normalizeUsername(rawText);

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
      return;
    }

    // 3. Fallback guidance for unrecognized inputs
    await ctx.reply(
      `💡 Choose an option from the menu below, or tap a numbered option (1-9):`,
      {
        reply_markup: BotMenus.mainMenu(),
      }
    );
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
    .map((c, i) => `${medals[i] || "•"} *${c.displayName}*\n   \`${c.formattedDuration}\` (${c.sessionCount} sessions)\n   _${c.title}_`)
    .join("\n\n");

  const runnerUp = leaderboard.competitors[1];
  const gapText = runnerUp
    ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n👀 *Battle for the Crown:*\n*${runnerUp.displayName}* is only \`${runnerUp.formattedGapToLeader}\` behind #1!`
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

async function sendWagersScreen(ctx: Context, edit: boolean = false) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  if (accounts.length === 0) {
    const text = `🎲 *Weekly Wagers & Odds*\n\nEnroll accounts to generate live telemetry betting odds!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const endDate = now.toISOString().split("T")[0];

  const stats = await Promise.all(
    accounts.map(async (acc) => {
      const dailies = await DailyRepository.listByRange(acc.id, startDate, endDate);
      const totalSecs = dailies.reduce((sum, d) => sum + (d.activeSeconds || 0), 0);
      return { acc, totalSecs };
    })
  );

  const totalPool = Math.max(1, stats.reduce((sum, s) => sum + s.totalSecs, 0));
  stats.sort((a, b) => b.totalSecs - a.totalSecs);

  const oddsRows = stats.map((s, idx) => {
    const share = s.totalSecs / totalPool;
    let rawOdds: number;
    let role: string;

    if (idx === 0) {
      role = "⭐ FAVORITE";
      rawOdds = Math.max(1.25, Math.min(1.85, 1 / Math.max(0.4, share)));
    } else if (idx === 1) {
      role = "⚔️ CONTENDER";
      rawOdds = Math.max(1.95, Math.min(3.2, 1 / Math.max(0.2, share)));
    } else {
      role = "🔥 UNDERDOG";
      rawOdds = Math.max(3.5, Math.min(8.0, 1 / Math.max(0.1, share)));
    }

    const hours = Math.floor(s.totalSecs / 3600);
    const mins = Math.floor((s.totalSecs % 3600) / 60);

    return `• *${s.acc.displayName || "@" + s.acc.username}* [${role}]\n   Odds: \`${rawOdds.toFixed(2)}x\` • 7d: \`${hours}h ${mins}m\``;
  });

  const text =
    `🎲 *LIVE TELEMETRY WAGERS & ODDS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Weekly Points Balance: \`1000 PTS\`\n\n` +
    oddsRows.join("\n\n") +
    `\n\n_Lock in your prediction slips directly in the Telegram Mini App!_`;

  await safeSendOrEdit(ctx, text, BotMenus.wagersMenu(), edit);
}

async function sendCompareScreen(ctx: Context, edit: boolean = false, overrideBId?: string) {
  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await UserRepository.findOrCreate({ telegramId: tgUser.id });
  const accounts = await AccountRepository.listByOwner(user.id);

  if (accounts.length < 2) {
    const text = `⚖️ *Compare Accounts*\n\nTrack at least 2 accounts to view side-by-side presence metrics!`;
    await safeSendOrEdit(ctx, text, BotMenus.mainMenu(), edit);
    return;
  }

  const accA = accounts[0];
  const accB = overrideBId
    ? accounts.find((a) => a.id === overrideBId) || accounts[1]
    : accounts[1];

  const overviewA = await AnalyticsService.getAccountOverview(accA.id);
  const overviewB = await AnalyticsService.getAccountOverview(accB.id);

  const nameA = accA.displayName || "@" + accA.username;
  const nameB = accB.displayName || "@" + accB.username;

  const text =
    `⚖️ *SIDE-BY-SIDE PRESENCE COMPARISON*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🔵 *${nameA}* vs 🟣 *${nameB}*\n\n` +
    `• *Today:* \`${overviewA?.today.formattedDuration || "0m"}\` vs \`${overviewB?.today.formattedDuration || "0m"}\`\n` +
    `• *7-Day Total:* \`${overviewA?.sevenDays.formattedDuration || "0m"}\` vs \`${overviewB?.sevenDays.formattedDuration || "0m"}\`\n` +
    `• *7-Day Sessions:* \`${overviewA?.sevenDays.sessionCount || 0}\` vs \`${overviewB?.sevenDays.sessionCount || 0}\`\n` +
    `• *Avg Session:* \`${formatDuration(overviewA?.sevenDays.averageSessionSeconds || 0)}\` vs \`${formatDuration(overviewB?.sevenDays.averageSessionSeconds || 0)}\`\n` +
    `• *Peak Hour:* \`${overviewA?.sevenDays.peakHour || 0}:00\` vs \`${overviewB?.sevenDays.peakHour || 0}:00\`\n` +
    `• *Active Streak:* \`${overviewA?.streaks.currentStreakDays || 0}d\` vs \`${overviewB?.streaks.currentStreakDays || 0}d\``;

  await safeSendOrEdit(ctx, text, BotMenus.compareMenu(accounts, accA.id, accB.id), edit);
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
    `• *Live Odds & Bets*: Telemetry multipliers updated live.\n` +
    `• *Observed Footprint*: Aggregates chat & community presence where authorized.\n\n` +
    `*All Available Commands:*\n` +
    `/start or /menu — Open Interactive Choice Hub\n` +
    `/league — Weekly Championship standings & crown gap\n` +
    `/my — Personal observed telemetry & chat report\n` +
    `/roast — Satirical roast generator (4 levels)\n` +
    `/rival — Head-to-head rivalry showdown\n` +
    `/bets — Live telemetry multipliers & odds\n` +
    `/compare — Side-by-side presence comparison\n` +
    `/footprint — Observed community participation share\n` +
    `/awards — Superlatives shelf & weekly trophies\n` +
    `/track — Enroll a new competitor slot\n` +
    `/accounts — Competitor slots manager\n` +
    `/dashboard — Master overview of all slots\n` +
    `/help — Rules and guidance`;

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
    `${statusPill} — _${title}_\n\n` +
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

