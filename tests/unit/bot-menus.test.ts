import { describe, it, expect } from "vitest";
import { BotMenus } from "../../src/server/bot/menus";
import { getTelegramBot } from "../../src/server/bot/bot";

describe("Telegram Bot Menus & Choice Hub", () => {
  it("generates the main menu with all 9 choice hub buttons and Mini App launch button", () => {
    const kb = BotMenus.mainMenu();
    const inlineButtons = kb.inline_keyboard.flat();

    // Verify Mini App Launch WebApp button exists
    const webAppBtn = inlineButtons.find((b: any) => b.web_app !== undefined);
    expect(webAppBtn).toBeDefined();
    expect((webAppBtn as any).text).toContain("Launch Full Mini App Dashboard");

    // Verify all 9 Choice Hub action callbacks exist
    const callbackDataList = inlineButtons
      .map((b: any) => b.callback_data)
      .filter(Boolean);

    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:my");
    expect(callbackDataList).toContain("action:roast_picker");
    expect(callbackDataList).toContain("action:rival_picker");
    expect(callbackDataList).toContain("action:wagers");
    expect(callbackDataList).toContain("action:compare");
    expect(callbackDataList).toContain("action:awards");
    expect(callbackDataList).toContain("action:accounts");
    expect(callbackDataList).toContain("action:help");
  });

  it("generates persistent bottom reply keyboard with 1-tap quick navigation", () => {
    const replyKb = BotMenus.persistentReplyKeyboard();
    const buttons = replyKb.keyboard.flat();

    const texts = buttons.map((b: any) => typeof b === "string" ? b : b.text);

    expect(texts).toContain("🏆 Weekly League");
    expect(texts).toContain("👤 My Stats");
    expect(texts).toContain("🔥 Roast Me");
    expect(texts).toContain("⚔️ The Rival");
    expect(texts).toContain("🎲 Weekly Bets");
    expect(texts).toContain("⚖️ Compare");
    expect(texts).toContain("🕵️ Chat Footprint");
    expect(texts).toContain("🎖 Mini-Awards");
    expect(texts).toContain("➕ Add Competitor");
    expect(texts).toContain("⚙️ Choice Hub");
  });

  it("generates roast level picker with 4 intensity levels and account targets", () => {
    const mockAccounts = [
      { id: "acc1", accountId: "acc1", displayName: "Alice", username: "alice" },
      { id: "acc2", accountId: "acc2", displayName: "Bob", username: "bob" },
    ];

    const kb = BotMenus.roastPickerMenu(mockAccounts, "acc1", "brutal");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    // Verify intensity switches exist
    expect(callbackDataList).toContain("action:set_roast_lvl:friendly:acc1");
    expect(callbackDataList).toContain("action:set_roast_lvl:normal:acc1");
    expect(callbackDataList).toContain("action:set_roast_lvl:brutal:acc1");
    expect(callbackDataList).toContain("action:set_roast_lvl:nuclear:acc1");

    // Verify target account selection exists
    expect(callbackDataList).toContain("action:select_roast_acc:acc1");
    expect(callbackDataList).toContain("action:select_roast_acc:acc2");

    // Verify re-roast and return to menu exist
    expect(callbackDataList).toContain("action:re_roast:acc1:brutal");
    expect(callbackDataList).toContain("action:home");
  });

  it("generates rival showdown picker menu with designation actions", () => {
    const mockAccounts = [
      { id: "acc1", accountId: "acc1", displayName: "Alice", username: "alice" },
      { id: "acc2", accountId: "acc2", displayName: "Bob", username: "bob" },
    ];

    const kb = BotMenus.rivalPickerMenu(mockAccounts, "acc2");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("action:set_rival:acc1");
    expect(callbackDataList).toContain("action:set_rival:acc2");
    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:home");
  });

  it("generates wagers menu with navigation to league and rival", () => {
    const kb = BotMenus.wagersMenu();
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:rival_picker");
    expect(callbackDataList).toContain("action:home");
  });

  it("generates compare menu with switchable competitor options", () => {
    const mockAccounts = [
      { id: "acc1", accountId: "acc1", displayName: "Alice", username: "alice" },
      { id: "acc2", accountId: "acc2", displayName: "Bob", username: "bob" },
      { id: "acc3", accountId: "acc3", displayName: "Charlie", username: "charlie" },
    ];

    const kb = BotMenus.compareMenu(mockAccounts, "acc1", "acc2");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("action:compare_with:acc3");
    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:home");
  });

  it("generates account detail menu with overview, roast, rival, pause/resume, and delete", () => {
    const activeKb = BotMenus.accountMenu("acc1", true);
    const activeButtons = activeKb.inline_keyboard.flat();
    const activeCallbacks = activeButtons.map((b: any) => b.callback_data).filter(Boolean);

    expect(activeCallbacks).toContain("action:view_acc:acc1");
    expect(activeCallbacks).toContain("action:select_roast_acc:acc1");
    expect(activeCallbacks).toContain("action:set_rival:acc1");
    expect(activeCallbacks).toContain("action:toggle_track:acc1");
    expect(activeCallbacks).toContain("action:delete_acc:acc1");
    expect(activeCallbacks).toContain("action:accounts");

    const pausedKb = BotMenus.accountMenu("acc1", false);
    const pausedButtons = pausedKb.inline_keyboard.flat();
    const resumeBtn = pausedButtons.find((b: any) => b.text.includes("Resume"));
    expect(resumeBtn).toBeDefined();
  });

  it("instantiates the Grammy Bot instance with error handling", () => {
    const bot = getTelegramBot();
    expect(bot).toBeDefined();
    expect(bot.botInfo.username).toBe("lurkening_bot");
  });
});
