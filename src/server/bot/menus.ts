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
      .text("🏆 Weekly League").text("👤 My Stats").row()
      .text("🔥 Roast Me").text("⚔️ The Rival").row()
      .text("🕵️ Chat Footprint").text("🎖 Mini-Awards").row()
      .text("➕ Add Competitor").text("⚙️ Main Menu").row()
      .resized();
  }

  /**
   * Main welcome / choice hub inline keyboard
   */
  static mainMenu() {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL;
    return new InlineKeyboard()
      .webApp("🚀 Launch Full Mini App Dashboard", webAppUrl)
      .row()
      .text("1️⃣ 🏆 Weekly League Ranks", "action:league")
      .row()
      .text("2️⃣ 👤 My Stats & Footprint", "action:my")
      .row()
      .text("3️⃣ 🔥 Roast Me (Choose Level)", "action:roast_picker")
      .row()
      .text("4️⃣ ⚔️ Head-to-Head Rival", "action:rival_picker")
      .row()
      .text("5️⃣ 🎖 Weekly Mini-Awards", "action:awards")
      .row()
      .text("6️⃣ ➕ Manage Competitors (3 Slots)", "action:accounts")
      .row()
      .text("7️⃣ 📖 Help & Game Rules", "action:help");
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
        kb.text(isSelected ? `● Target: ${name}` : `Target: ${name}`, `action:select_roast_acc:${accId}`).row();
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
        isRival ? `👑 Designated Rival: ${name}` : `⚔️ Challenge ${name}`,
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
      .text("🔥 Roast #1 Leader", "action:roast_picker")
      .text("⚔️ Rival Battle", "action:rival_picker")
      .row()
      .text("🎖 Mini-Awards", "action:awards")
      .text("🔄 Refresh Standings", "action:league")
      .row()
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
      .text("🔥 Roast Account", `action:select_roast_acc:${accountId}`)
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
