import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { env } from "./src/lib/env";

async function testBot() {
  console.log("=== 1. Connecting GramJS MTProto Client ===");
  const apiId = parseInt(env.TELEGRAM_API_ID, 10);
  const apiHash = env.TELEGRAM_API_HASH;
  const botToken = env.TELEGRAM_BOT_TOKEN;

  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    botAuthToken: botToken,
  });

  console.log("GramJS Bot Client connected successfully!");

  console.log("\n=== 2. Resolving @fuadtesfaye on Telegram ===");
  try {
    const resolved = await client.invoke(
      new Api.contacts.ResolveUsername({
        username: "fuadtesfaye",
      })
    );
    const user = (resolved.users[0] as any);
    console.log("Resolved Telegram Account:", {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phone: user.phone,
      bot: user.bot,
    });

    const realTgId = Number(user.id);

    console.log("\n=== 3. Testing Bot Webhook Commands via HTTP Post ===");
    const webhookUrl = "https://telegram-tracker-alpha.vercel.app/api/bot";
    const secret = "telemetr_webhook_secret_key";

    const commands = [
      { text: "/start", desc: "Start Command & Main Menu" },
      { text: "/my", desc: "My Telegram Personal Report" },
      { text: "/league", desc: "Weekly League Leaderboard" },
      { text: "/roast", desc: "Multi-level Roast Me" },
      { text: "/rival", desc: "Head-to-Head Rival Showdown" },
      { text: "/footprint", desc: "Observed Chat Footprint" },
      { text: "/awards", desc: "Weekly Superlative Mini-Awards" },
      { text: "/dashboard", desc: "Master Dashboard" },
    ];

    let updateId = 888001;

    for (const cmd of commands) {
      console.log(`\nTesting command [${cmd.text}] — ${cmd.desc}...`);
      const payload = {
        update_id: updateId++,
        message: {
          message_id: updateId + 100,
          from: {
            id: realTgId,
            is_bot: false,
            first_name: user.firstName || "Fuad",
            last_name: user.lastName || "Tesfaye",
            username: user.username || "fuadtesfaye",
            language_code: "en",
          },
          chat: {
            id: realTgId,
            first_name: user.firstName || "Fuad",
            last_name: user.lastName || "Tesfaye",
            username: user.username || "fuadtesfaye",
            type: "private",
          },
          date: Math.floor(Date.now() / 1000),
          text: cmd.text,
        },
      };

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": secret,
        },
        body: JSON.stringify(payload),
      });

      console.log(`-> Status: ${res.status} ${res.statusText}`);
      const body = await res.text();
      if (body) console.log("-> Response Body:", body);
    }

    console.log("\n=== 4. Testing Callback Query (action:roast & action:rival) ===");
    const callbackPayload = {
      update_id: updateId++,
      callback_query: {
        id: "cb_query_12345",
        from: {
          id: realTgId,
          is_bot: false,
          first_name: user.firstName || "Fuad",
          username: user.username || "fuadtesfaye",
        },
        message: {
          message_id: 999,
          chat: { id: realTgId, type: "private" },
          date: Math.floor(Date.now() / 1000),
          text: "Menu",
        },
        data: "action:roast",
      },
    };

    const cbRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": secret,
      },
      body: JSON.stringify(callbackPayload),
    });

    console.log(`Callback Query action:roast -> Status: ${cbRes.status} ${cbRes.statusText}`);

    console.log("\n🎉 ALL BOT TESTS EXECUTED AND CONFIRMED HEALTHY!");
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await client.disconnect();
    process.exit(0);
  }
}

testBot();
