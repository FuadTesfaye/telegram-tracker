import { InlineKeyboard, Keyboard } from "grammy";
import { env } from "@/lib/env";
import type { RoastLevel } from "../services/roast-engine.service";

export interface MenuAccountItem {
  id?: string;
  accountId?: string;
  displayName: string | null;
  username: string | null;
}

export class BotMenus {
  /**
   * Persistent bottom Reply Keyboard for 1-tap navigation
   */
  static persistentReplyKeyboard() {
    return new Keyboard()
      .text("🏆 Telegram League").text("👤 My Stats").row()
      .text("🔥 Roast Me").text("⚔️ The Rival").row()
      .text("🕵️ Chat Footprint").text("🎖 Mini-Awards").row()
      .text("➕ Add Competitor").text("⚙️ Settings").row()
      .resized();
  }

  /**
   * Main welcome / dashboard inline keyboard
   */
  static mainMenu() {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL;
    return new InlineKeyboard()
      .webApp("🏆 Open Telegram League Mini App", webAppUrl)
      .row()
      .text("🏆 Weekly League", "action:league")
      .text("👤 My Stats", "action:my")
      .row()
      .text("🔥 Roast Me", "action:roast_picker")
      .text("⚔️ The Rival", "action:rival_picker")
      .row()
      .text("🕵️ Chat Footprint", "action:footprint")
      .text("🎖 Mini-Awards", "action:awards")
      .row()
      .text("👤 Competitor Slots", "action:accounts")
      .text("⚙️ Settings", "action:settings");
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
        kb.text(isSelected ? `● ${name}` : name, `action:select_roast_acc:${accId}`).row();
      }
    }

    // Intensity levels
    kb.text(currentLevel === "friendly" ? "✓ 🙂 Friendly" : "🙂 Friendly", `action:set_roast_lvl:friendly:${selectedAccountId || "top"}`)
      .text(currentLevel === "normal" ? "✓ 🔥 Normal" : "🔥 Normal", `action:set_roast_lvl:normal:${selectedAccountId || "top"}`)
      .row()
      .text(currentLevel === "brutal" ? "✓ 💀 Brutal" : "💀 Brutal", `action:set_roast_lvl:brutal:${selectedAccountId || "top"}`)
      .text(currentLevel === "nuclear" ? "✓ ☠️ Nuclear" : "☠️ Nuclear", `action:set_roast_lvl:nuclear:${selectedAccountId || "top"}`)
      .row()
      .text("🔄 Roast Again", `action:re_roast:${selectedAccountId || "top"}:${currentLevel}`)
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
        isRival ? `👑 Current Rival: ${name}` : `⚔️ Challenge ${name}`,
        `action:set_rival:${accId}`
      ).row();
    }
    kb.text("🏆 View League Standings", "action:league").row();
    kb.text("« Back to Menu", "action:home");
    return kb;
  }

  /**
   * League screen keyboard
   */
  static leagueMenu() {
    return new InlineKeyboard()
      .text("🔥 Roast Current Leader", "action:roast_picker")
      .text("⚔️ Rival Showdown", "action:rival")
      .row()
      .text("🎖 Mini-Awards", "action:awards")
      .text("🔄 Refresh Standings", "action:league")
      .row()
      .text("« Back to Main Menu", "action:home");
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
      .text("▶️ Enroll in League", `action:confirm_track:${username}`)
      .row()
      .text("❌ Cancel", "action:home");
  }

  /**
   * Account detail keyboard
   */
  static accountMenu(accountId: string, isTrackingActive: boolean) {
    const kb = new InlineKeyboard()
      .text("📊 Overview", `action:acc_overview:${accountId}`)
      .text("🔥 Roast This Account", `action:select_roast_acc:${accountId}`)
      .row()
      .text("⚔️ Set as My Rival", `action:set_rival:${accountId}`)
      .row();

    if (isTrackingActive) {
      kb.text("⏸ Pause Tracking", `action:toggle_track:${accountId}`);
    } else {
      kb.text("▶️ Resume Tracking", `action:toggle_track:${accountId}`);
    }

    kb.text("🗑 Remove Slot", `action:delete_acc:${accountId}`)
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
      kb.text(`● ${name}`, `action:view_acc:${accId}`).row();
    }
    if (accounts.length < 3) {
      kb.text("➕ Add New Competitor", "action:track").row();
    }
    kb.text("« Back to Main Menu", "action:home");
    return kb;
  }
}
