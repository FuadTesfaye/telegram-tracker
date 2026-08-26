import { describe, it, expect } from "vitest";
import { BotMenus, getSafeWebAppUrl } from "../../src/server/bot/menus";
import { getTelegramBot } from "../../src/server/bot/bot";

describe("Telegram Bot Menus & Choice Hub", () => {
  it("ensures getSafeWebAppUrl always returns a valid HTTPS URL", () => {
    const url = getSafeWebAppUrl();
    expect(url.startsWith("https://")).toBe(true);
    expect(url).not.toContain("localhost");
  });

  it("generates the main menu with all 9 choice hub buttons and Mini App launch button", () => {
    const kb = BotMenus.mainMenu();
    const inlineButtons = kb.inline_keyboard.flat();

    // Verify Mini App Launch WebApp button exists
    const webAppBtn = inlineButtons.find((b: any) => b.web_app !== undefined);
    expect(webAppBtn).toBeDefined();
    expect((webAppBtn as any).text).toContain("Launch Full Mini App Dashboard");
    expect((webAppBtn as any).web_app.url.startsWith("https://")).toBe(true);

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

    // Ensure all callback data is <= 64 bytes
    for (const cb of callbackDataList) {
      expect(Buffer.byteLength(cb, "utf8")).toBeLessThanOrEqual(64);
    }
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

  it("generates roast level picker with 4 intensity levels and account targets within 64 byte limit", () => {
    const mockAccounts = [
      { id: "0de130c1-ee4c-4c32-9366-353e207e6446", accountId: "0de130c1-ee4c-4c32-9366-353e207e6446", displayName: "Alice", username: "alice" },
      { id: "1de130c1-ee4c-4c32-9366-353e207e6447", accountId: "1de130c1-ee4c-4c32-9366-353e207e6447", displayName: "Bob", username: "bob" },
    ];

    const kb = BotMenus.roastPickerMenu(mockAccounts, "0de130c1-ee4c-4c32-9366-353e207e6446", "brutal");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    // Verify intensity switches exist
    expect(callbackDataList).toContain("r_lvl:friendly:0de130c1-ee4c-4c32-9366-353e207e6446");
    expect(callbackDataList).toContain("r_lvl:normal:0de130c1-ee4c-4c32-9366-353e207e6446");
    expect(callbackDataList).toContain("r_lvl:brutal:0de130c1-ee4c-4c32-9366-353e207e6446");
    expect(callbackDataList).toContain("r_lvl:nuclear:0de130c1-ee4c-4c32-9366-353e207e6446");

    // Verify target account selection exists
    expect(callbackDataList).toContain("r_acc:0de130c1-ee4c-4c32-9366-353e207e6446");
    expect(callbackDataList).toContain("r_acc:1de130c1-ee4c-4c32-9366-353e207e6447");

    // Verify re-roast and return to menu exist
    expect(callbackDataList).toContain("r_again:0de130c1-ee4c-4c32-9366-353e207e6446:brutal");
    expect(callbackDataList).toContain("action:home");

    // Ensure all callback data is <= 64 bytes (strict Telegram Bot API constraint)
    for (const cb of callbackDataList) {
      expect(Buffer.byteLength(cb, "utf8")).toBeLessThanOrEqual(64);
    }
  });

  it("generates rival showdown picker menu with designation actions within 64 byte limit", () => {
    const mockAccounts = [
      { id: "0de130c1-ee4c-4c32-9366-353e207e6446", accountId: "0de130c1-ee4c-4c32-9366-353e207e6446", displayName: "Alice", username: "alice" },
      { id: "1de130c1-ee4c-4c32-9366-353e207e6447", accountId: "1de130c1-ee4c-4c32-9366-353e207e6447", displayName: "Bob", username: "bob" },
    ];

    const kb = BotMenus.rivalPickerMenu(mockAccounts, "1de130c1-ee4c-4c32-9366-353e207e6447");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("r_rival:0de130c1-ee4c-4c32-9366-353e207e6446");
    expect(callbackDataList).toContain("r_rival:1de130c1-ee4c-4c32-9366-353e207e6447");
    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:home");

    for (const cb of callbackDataList) {
      expect(Buffer.byteLength(cb, "utf8")).toBeLessThanOrEqual(64);
    }
  });

  it("generates wagers menu with navigation to league and rival", () => {
    const kb = BotMenus.wagersMenu();
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:rival_picker");
    expect(callbackDataList).toContain("action:home");
  });

  it("generates compare menu with switchable competitor options within 64 byte limit", () => {
    const mockAccounts = [
      { id: "0de130c1-ee4c-4c32-9366-353e207e6446", accountId: "0de130c1-ee4c-4c32-9366-353e207e6446", displayName: "Alice", username: "alice" },
      { id: "1de130c1-ee4c-4c32-9366-353e207e6447", accountId: "1de130c1-ee4c-4c32-9366-353e207e6447", displayName: "Bob", username: "bob" },
      { id: "2de130c1-ee4c-4c32-9366-353e207e6448", accountId: "2de130c1-ee4c-4c32-9366-353e207e6448", displayName: "Charlie", username: "charlie" },
    ];

    const kb = BotMenus.compareMenu(mockAccounts, "0de130c1-ee4c-4c32-9366-353e207e6446", "1de130c1-ee4c-4c32-9366-353e207e6447");
    const buttons = kb.inline_keyboard.flat();
    const callbackDataList = buttons.map((b: any) => b.callback_data).filter(Boolean);

    expect(callbackDataList).toContain("cmp_with:2de130c1-ee4c-4c32-9366-353e207e6448");
    expect(callbackDataList).toContain("action:league");
    expect(callbackDataList).toContain("action:home");

    for (const cb of callbackDataList) {
      expect(Buffer.byteLength(cb, "utf8")).toBeLessThanOrEqual(64);
    }
  });

  it("generates account detail menu with overview, roast, rival, pause/resume, and delete within 64 bytes", () => {
    const testId = "0de130c1-ee4c-4c32-9366-353e207e6446";
    const activeKb = BotMenus.accountMenu(testId, true);
    const activeButtons = activeKb.inline_keyboard.flat();
    const activeCallbacks = activeButtons.map((b: any) => b.callback_data).filter(Boolean);

    expect(activeCallbacks).toContain(`acc_v:${testId}`);
    expect(activeCallbacks).toContain(`r_acc:${testId}`);
    expect(activeCallbacks).toContain(`r_rival:${testId}`);
    expect(activeCallbacks).toContain(`acc_tog:${testId}`);
    expect(activeCallbacks).toContain(`acc_del:${testId}`);
    expect(activeCallbacks).toContain("action:accounts");

    for (const cb of activeCallbacks) {
      expect(Buffer.byteLength(cb, "utf8")).toBeLessThanOrEqual(64);
    }

    const pausedKb = BotMenus.accountMenu(testId, false);
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

