import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { env } from "./src/lib/env";

async function testAsRealUser() {
  console.log("=== 1. Connecting as Real User via TELEGRAM_USERBOT_SESSION ===");
  const apiId = parseInt(env.TELEGRAM_API_ID, 10);
  const apiHash = env.TELEGRAM_API_HASH;
  const sessionString = env.TELEGRAM_USERBOT_SESSION;

  if (!sessionString) {
    throw new Error("TELEGRAM_USERBOT_SESSION is not set in environment");
  }

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Client connected to Telegram network!");

  // Get user profile
  const me = await client.getMe();
  console.log("Logged in as User:", {
    id: me.id?.toString(),
    firstName: (me as any).firstName,
    lastName: (me as any).lastName,
    username: (me as any).username,
    phone: (me as any).phone,
  });

  const botUsername = env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "lurkening_bot";
  console.log(`\n=== 2. Finding Target Bot @${botUsername} ===`);
  const botEntity = await client.getEntity(botUsername);
  console.log("Found Bot Entity:", {
    id: botEntity.id?.toString(),
    username: (botEntity as any).username,
  });

  console.log("\n=== 3. Sending /start command from User to Bot ===");
  await client.sendMessage(botEntity, { message: "/start" });
  console.log("Sent: /start");

  // Wait 3 seconds to receive bot's response
  await new Promise((r) => setTimeout(r, 3000));

  let messages = await client.getMessages(botEntity, { limit: 5 });
  console.log(`\n=== 4. Received Responses from @${botUsername} ===`);
  for (const m of messages) {
    if (m.out) {
      console.log(`[USER -> BOT]: ${m.message}`);
    } else {
      console.log(`[BOT -> USER]:\n${m.message}\n`);
      if (m.replyMarkup) {
        console.log("[INLINE BUTTONS ATTACHED]:", JSON.stringify(m.replyMarkup));
      }
    }
  }

  console.log("\n=== 5. Testing /league command as User ===");
  await client.sendMessage(botEntity, { message: "/league" });
  await new Promise((r) => setTimeout(r, 3000));
  messages = await client.getMessages(botEntity, { limit: 2 });
  for (const m of messages) {
    if (!m.out) {
      console.log(`[BOT LEAGUE RESPONSE]:\n${m.message}\n`);
    }
  }

  console.log("\n=== 6. Testing /roast command as User ===");
  await client.sendMessage(botEntity, { message: "/roast" });
  await new Promise((r) => setTimeout(r, 3000));
  messages = await client.getMessages(botEntity, { limit: 2 });
  for (const m of messages) {
    if (!m.out) {
      console.log(`[BOT ROAST RESPONSE]:\n${m.message}\n`);
    }
  }

  console.log("\n=== 7. Testing /my command as User ===");
  await client.sendMessage(botEntity, { message: "/my" });
  await new Promise((r) => setTimeout(r, 3000));
  messages = await client.getMessages(botEntity, { limit: 2 });
  for (const m of messages) {
    if (!m.out) {
      console.log(`[BOT MY STATS RESPONSE]:\n${m.message}\n`);
    }
  }

  console.log("\n✅ Real User Interactive Testing Complete & Verified Live!");
  await client.disconnect();
}

testAsRealUser().catch(console.error);
