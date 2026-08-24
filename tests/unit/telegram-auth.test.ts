import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyTelegramInitData } from "../../src/server/auth/telegram-auth";

describe("Telegram Mini App Auth Verification", () => {
  const testBotToken = "8813806141:AAFZiOIyUvIlrIJemSwQ6nbuqSozRALr5vI";

  function createValidInitData(userObj: Record<string, unknown>, authDate: number) {
    const userStr = JSON.stringify(userObj);
    const params = new URLSearchParams({
      auth_date: authDate.toString(),
      query_id: "AAGtest123",
      user: userStr,
    });

    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((key) => `${key}=${params.get(key)}`).join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(testBotToken)
      .digest();

    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    params.append("hash", hash);
    return params.toString();
  }

  it("successfully validates genuine Telegram initData signatures", () => {
    const user = {
      id: 99887766,
      first_name: "Alice",
      username: "alice_tg",
    };
    const authDate = Math.floor(Date.now() / 1000);
    const initData = createValidInitData(user, authDate);

    const result = verifyTelegramInitData(initData, testBotToken);
    expect(result).not.toBeNull();
    expect(result?.user.id).toBe(99887766);
    expect(result?.user.username).toBe("alice_tg");
  });

  it("rejects forged or tampered initData signatures", () => {
    const user = { id: 99887766, first_name: "Alice" };
    const authDate = Math.floor(Date.now() / 1000);
    let initData = createValidInitData(user, authDate);

    // Tamper with the user ID in the query string without updating hash
    initData = initData.replace("99887766", "11223344");

    const result = verifyTelegramInitData(initData, testBotToken);
    expect(result).toBeNull();
  });
});
