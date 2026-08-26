import { InlineKeyboard, Keyboard } from "grammy";
import { env } from "@/lib/env";
import type { RoastLevel } from "../services/roast-engine.service";

export interface MenuAccountItem {
  id?: string;
  accountId?: string;
  displayName: string | null;
  username: string | null;
}

export function getSafeWebAppUrl(): string {
  let url = env.NEXT_PUBLIC_APP_URL || "https://telegram-tracker-alpha.vercel.app";
  if (!url || typeof url !== "string") {
    return "https://telegram-tracker-alpha.vercel.app";
  }
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return "https://telegram-tracker-alpha.vercel.app";
  }
  if (!url.startsWith("https://")) {
    if (url.startsWith("http://")) {
      url = url.replace("http://", "https://");
    } else {
      url = `https://${url}`;
    }
  }
  return url;
}

export class BotMenus {
  /**
   * Persistent bottom Reply Keyboard for 1-tap fast navigation
   */
  static persistentReplyKeyboard() {
    return new Keyboard()
      .text("🏆 Weekly League").text("👤 My Stats").row()
      .text("🔥 Roast Me").text("⚔️ The Rival").row()
      .text("🎲 Weekly Bets").text("⚖️ Compare").row()
      .text("🕵️ Chat Footprint").text("🎖 Mini-Awards").row()
      .text("➕ Add Competitor").text("⚙️ Choice Hub").row()
      .resized();
  }

  /**
   * Main welcome / choice hub inline keyboard
   */
  static mainMenu() {
    const webAppUrl = getSafeWebAppUrl();
    return new InlineKeyboard()
      .webApp("🚀 Launch Full Mini App Dashboard", webAppUrl)
      .row()
      .text("1️⃣ 🏆 Weekly League Ranks", "action:league")
      .row()
      .text("2️⃣ 👤 My Stats & Footprint", "action:my")
      .row()
      .text("3️⃣ 🔥 Roast Me (4 Levels)", "action:roast_picker")
      .row()
      .text("4️⃣ ⚔️ Head-to-Head Rival", "action:rival_picker")
      .row()
      .text("5️⃣ 🎲 Weekly Wagers & Odds", "action:wagers")
      .row()
      .text("6️⃣ ⚖️ Compare Competitors", "action:compare")
      .row()
      .text("7️⃣ 🎖 Weekly Mini-Awards", "action:awards")
      .row()
      .text("8️⃣ ➕ Competitor Slots (3 Max)", "action:accounts")
      .row()
      .text("9️⃣ 📖 Help & Game Rules", "action:help");
  }

  /**
   * Roast Level & Account Picker Menu
   */
  static roastPickerMenu(
    accounts: MenuAccountItem[],
    selectedAccountId?: string,
    currentLevel: RoastLevel = "normal"
  ) {
    const kb = new InlineKeyboard();

    // Accounts row
    if (accounts.length > 1) {
      for (const acc of accounts) {
        const accId = acc.accountId || acc.id || "";
        const name = acc.displayName || (acc.username ? `@${acc.username}` : "Account");
        const isSelected = selectedAccountId === accId;
        kb.text(isSelected ? `● Target: ${name}` : `Target: ${name}`, `r_acc:${accId}`).row();
      }
    }

    // Intensity levels (using short prefixes so callback_data never exceeds 64 bytes)
    const targetId = selectedAccountId || "top";
    kb.text(currentLevel === "friendly" ? "✓ 🙂 Friendly" : "🙂 Friendly", `r_lvl:friendly:${targetId}`)
      .text(currentLevel === "normal" ? "✓ 🔥 Normal" : "🔥 Normal", `r_lvl:normal:${targetId}`)
      .row()
      .text(currentLevel === "brutal" ? "✓ 💀 Brutal" : "💀 Brutal", `r_lvl:brutal:${targetId}`)
      .text(currentLevel === "nuclear" ? "✓ ☠️ Nuclear" : "☠️ Nuclear", `r_lvl:nuclear:${targetId}`)
      .row()
      .text("🔄 Roast Again", `r_again:${targetId}:${currentLevel}`)
      .text("« Back to Menu", "action:home");

    return kb;
  }

  /**
   * Rival Picker Menu
   */
  static rivalPickerMenu(
    accounts: MenuAccountItem[],
    currentRivalId?: string
  ) {
    const kb = new InlineKeyboard();
    for (const acc of accounts) {
      const accId = acc.accountId || acc.id || "";
      const name = acc.displayName || (acc.username ? `@${acc.username}` : "Account");
      const isRival = currentRivalId === accId;
      kb.text(
        isRival ? `👑 Designated Rival: ${name}` : `⚔️ Challenge ${name}`,
        `r_rival:${accId}`
      ).row();
    }
    kb.text("🏆 View League Standings", "action:league").row();
    kb.text("« Back to Menu", "action:home");
    return kb;
  }

  /**
   * Wagers & Odds Menu
   */
  static wagersMenu() {
    return new InlineKeyboard()
      .text("🏆 View Standings", "action:league")
      .text("⚔️ Rival Battle", "action:rival_picker")
      .row()
      .text("« Back to Menu", "action:home");
  }

  /**
   * Compare Screen Menu
   */
  static compareMenu(accounts: MenuAccountItem[], accAId?: string, accBId?: string) {
    const kb = new InlineKeyboard();
    if (accounts.length > 2) {
      for (const acc of accounts) {
        const accId = acc.accountId || acc.id || "";
        const name = acc.displayName || (acc.username ? `@${acc.username}` : "Account");
        if (accId !== accAId && accId !== accBId) {
          kb.text(`Compare with ${name}`, `cmp_with:${accId}`).row();
        }
      }
    }
    kb.text("🏆 League Standings", "action:league")
      .text("« Back to Menu", "action:home");
    return kb;
  }

  /**
   * League screen keyboard
   */
  static leagueMenu() {
    return new InlineKeyboard()
      .text("🔥 Roast #1 Leader", "action:roast_picker")
      .text("⚔️ Rival Battle", "action:rival_picker")
      .row()
      .text("🎲 Live Bets & Odds", "action:wagers")
      .text("🎖 Mini-Awards", "action:awards")
      .row()
      .text("🔄 Refresh Standings", "action:league")
      .text("« Back to Menu", "action:home");
  }

  /**
   * Back button to return to main dashboard
   */
  static backToMain() {
    return new InlineKeyboard().text("« Back to Main Menu", "action:home");
  }

  /**
   * Confirmation menu after username is resolved
   */
  static trackConfirmMenu(username: string) {
    return new InlineKeyboard()
      .text("▶️ Enroll in League", `trk_ok:${username}`)
      .row()
      .text("❌ Cancel", "action:home");
  }

  /**
   * Account detail keyboard
   */
  static accountMenu(accountId: string, isTrackingActive: boolean) {
    const kb = new InlineKeyboard()
      .text("📊 Overview", `acc_v:${accountId}`)
      .text("🔥 Roast Account", `r_acc:${accountId}`)
      .row()
      .text("⚔️ Set as My Rival", `r_rival:${accountId}`)
      .row();

    if (isTrackingActive) {
      kb.text("⏸ Pause Tracking", `acc_tog:${accountId}`);
    } else {
      kb.text("▶️ Resume Tracking", `acc_tog:${accountId}`);
    }

    kb.text("🗑 Remove Slot", `acc_del:${accountId}`)
      .row()
      .text("« Back to Slots", "action:accounts");

    return kb;
  }

  /**
   * List of tracked accounts keyboard
   */
  static accountsListMenu(accounts: MenuAccountItem[]) {
    const kb = new InlineKeyboard();
    for (const acc of accounts) {
      const accId = acc.accountId || acc.id || "";
      const name = acc.displayName || (acc.username ? `@${acc.username}` : "Account");
      kb.text(`● ${name}`, `acc_v:${accId}`).row();
    }
    if (accounts.length < 3) {
      kb.text("➕ Add New Competitor", "action:track").row();
    }
    kb.text("« Back to Main Menu", "action:home");
    return kb;
  }
}
