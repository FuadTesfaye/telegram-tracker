import { InlineKeyboard } from "grammy";
import { env } from "@/lib/env";

export class BotMenus {
  /**
   * Main welcome / start dashboard keyboard for Telegram League
   */
  static mainMenu() {
    const webAppUrl = env.NEXT_PUBLIC_APP_URL;
    return new InlineKeyboard()
      .webApp("🏆 Launch Telegram League", webAppUrl)
      .row()
      .text("👤 My Telegram", "action:my")
      .text("🏆 Weekly League", "action:league")
      .row()
      .text("🔥 Roast Me", "action:roast")
      .text("⚔️ The Rival", "action:rival")
      .row()
      .text("🕵️ Chat Footprint", "action:footprint")
      .text("🎖 Mini-Awards", "action:awards")
      .row()
      .text("📊 Dashboard", "action:dashboard")
      .text("➕ Track Account", "action:track")
      .row()
      .text("👤 Tracked Accounts", "action:accounts")
      .text("⚙️ Settings", "action:settings");
  }

  /**
   * League screen keyboard
   */
  static leagueMenu() {
    return new InlineKeyboard()
      .text("🔥 Roast Me", "action:roast")
      .text("⚔️ The Rival", "action:rival")
      .row()
      .text("🎖 Mini-Awards", "action:awards")
      .text("📊 Dashboard", "action:dashboard")
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
      .text("▶️ Start Tracking", `action:confirm_track:${username}`)
      .row()
      .text("❌ Cancel", "action:home");
  }

  /**
   * Account detail keyboard
   */
  static accountMenu(accountId: string, isTrackingActive: boolean) {
    const kb = new InlineKeyboard()
      .text("📊 Overview", `action:acc_overview:${accountId}`)
      .text("🔥 Roast Account", `action:roast_acc:${accountId}`)
      .row()
      .text("📅 History", `action:acc_history:${accountId}`)
      .text("⏱ Sessions", `action:acc_sessions:${accountId}`)
      .row();

    if (isTrackingActive) {
      kb.text("⏸ Pause Tracking", `action:toggle_track:${accountId}`);
    } else {
      kb.text("▶️ Resume Tracking", `action:toggle_track:${accountId}`);
    }

    kb.text("🗑 Delete Account", `action:delete_acc:${accountId}`)
      .row()
      .text("« Back to Accounts", "action:accounts");

    return kb;
  }

  /**
   * List of tracked accounts keyboard
   */
  static accountsListMenu(accounts: Array<{ id: string; displayName: string | null; username: string | null }>) {
    const kb = new InlineKeyboard();
    for (const acc of accounts) {
      const name = acc.displayName || (acc.username ? `@${acc.username}` : "Account");
      kb.text(`● ${name}`, `action:view_acc:${acc.id}`).row();
    }
    kb.text("➕ Track New Account", "action:track").row();
    kb.text("« Back to Main Menu", "action:home");
    return kb;
  }
}
