import { Bot } from "grammy";
import { registerBotHandlers } from "../src/server/bot/handlers";
import { env } from "../src/lib/env";

interface OutgoingCall {
  method: string;
  payload: any;
}

async function runUserSimulation() {
  console.log("=================================================");
  console.log("🤖 SIMULATING REAL TELEGRAM USER INTERACTION WITH BOT");
  console.log("=================================================\n");

  const outgoingCalls: OutgoingCall[] = [];

  // Create isolated bot instance with outgoing call interceptor
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN, {
    botInfo: {
      id: 8594522566,
      is_bot: true,
      first_name: "The Lurkening",
      username: "lurkening_bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      supports_guest_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    },
  });

  // Intercept all outgoing Telegram API calls (sendMessage, editMessageText, answerCallbackQuery)
  bot.api.config.use(async (prev, method, payload, signal) => {
    outgoingCalls.push({ method, payload });
    if (method === "sendMessage") {
      return {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000),
          date: Math.floor(Date.now() / 1000),
          chat: { id: (payload as any).chat_id, type: "private" },
          text: (payload as any).text,
        },
      } as any;
    }
    if (method === "editMessageText") {
      return {
        ok: true,
        result: {
          message_id: (payload as any).message_id || 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: (payload as any).chat_id, type: "private" },
          text: (payload as any).text,
        },
      } as any;
    }
    if (method === "answerCallbackQuery") {
      return { ok: true, result: true } as any;
    }
    return { ok: true, result: true } as any;
  });

  registerBotHandlers(bot);

  const mockUser = {
    id: 5599179694,
    is_bot: false,
    first_name: "Fuad",
    last_name: "Tesfaye",
    username: "fuadtesfaye",
    language_code: "en",
  };

  const mockChat = {
    id: 5599179694,
    type: "private" as const,
    first_name: "Fuad",
    last_name: "Tesfaye",
    username: "fuadtesfaye",
  };

  let updateIdCounter = 1000;

  async function sendUserMessage(text: string) {
    console.log(`\n💬 [USER SENDS]: "${text}"`);
    outgoingCalls.length = 0;
    const update = {
      update_id: ++updateIdCounter,
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: mockUser,
        chat: mockChat,
        date: Math.floor(Date.now() / 1000),
        text: text,
      },
    };
    await bot.handleUpdate(update as any);

    for (const call of outgoingCalls) {
      if (call.method === "sendMessage") {
        console.log(`🤖 [BOT REPLIES]:\n${call.payload.text}\n`);
        if (call.payload.reply_markup?.inline_keyboard) {
          const btnLabels = call.payload.reply_markup.inline_keyboard
            .flat()
            .map((b: any) => b.text)
            .join(" | ");
          console.log(`   🔘 [INLINE BUTTONS]: [ ${btnLabels} ]`);
        }
        if (call.payload.reply_markup?.keyboard) {
          const kbLabels = call.payload.reply_markup.keyboard
            .flat()
            .map((b: any) => b.text || b)
            .join(" | ");
          console.log(`   ⌨️ [KEYBOARD]: [ ${kbLabels} ]`);
        }
      }
    }
  }

  async function sendCallbackQuery(callbackData: string) {
    console.log(`\n👆 [USER CLICKS BUTTON]: "${callbackData}"`);
    outgoingCalls.length = 0;
    const update = {
      update_id: ++updateIdCounter,
      callback_query: {
        id: `cb_${Date.now()}`,
        from: mockUser,
        message: {
          message_id: 1,
          from: { id: 8594522566, is_bot: true, first_name: "The Lurkening", username: "lurkening_bot" },
          chat: mockChat,
          date: Math.floor(Date.now() / 1000),
          text: "Previous screen content",
        },
        chat_instance: "instance_123",
        data: callbackData,
      },
    };
    await bot.handleUpdate(update as any);

    for (const call of outgoingCalls) {
      if (call.method === "editMessageText" || call.method === "sendMessage") {
        console.log(`🤖 [BOT UPDATES SCREEN]:\n${call.payload.text}\n`);
        if (call.payload.reply_markup?.inline_keyboard) {
          const btnLabels = call.payload.reply_markup.inline_keyboard
            .flat()
            .map((b: any) => b.text)
            .join(" | ");
          console.log(`   🔘 [INLINE BUTTONS]: [ ${btnLabels} ]`);
        }
      }
    }
  }

  // --- Step 1: User sends /start ---
  console.log("-------------------------------------------------");
  console.log("STEP 1: /start Choice Hub Initialization");
  console.log("-------------------------------------------------");
  await sendUserMessage("/start");

  // --- Step 2: User taps "1️⃣ 🏆 Weekly League Ranks" button ---
  console.log("-------------------------------------------------");
  console.log("STEP 2: View League Standings via Callback Button");
  console.log("-------------------------------------------------");
  await sendCallbackQuery("action:league");

  // --- Step 3: User sends /roast command ---
  console.log("-------------------------------------------------");
  console.log("STEP 3: Slash Command /roast");
  console.log("-------------------------------------------------");
  await sendUserMessage("/roast");

  // --- Step 4: User changes roast intensity to "💀 Brutal" ---
  console.log("-------------------------------------------------");
  console.log("STEP 4: Switch Roast Level to Brutal");
  console.log("-------------------------------------------------");
  await sendCallbackQuery("action:set_roast_lvl:brutal:top");

  // --- Step 5: User sends /rival command ---
  console.log("-------------------------------------------------");
  console.log("STEP 5: Slash Command /rival (Showdown)");
  console.log("-------------------------------------------------");
  await sendUserMessage("/rival");

  // --- Step 6: User sends /bets (or types "5") ---
  console.log("-------------------------------------------------");
  console.log("STEP 6: Number Shortcut '5' for Weekly Bets & Odds");
  console.log("-------------------------------------------------");
  await sendUserMessage("5");

  // --- Step 7: User sends /compare ---
  console.log("-------------------------------------------------");
  console.log("STEP 7: Slash Command /compare (Side-by-Side Table)");
  console.log("-------------------------------------------------");
  await sendUserMessage("/compare");

  // --- Step 8: User sends /footprint (or types "2") ---
  console.log("-------------------------------------------------");
  console.log("STEP 8: Number Shortcut '2' for My Stats & Footprint");
  console.log("-------------------------------------------------");
  await sendUserMessage("2");

  // --- Step 9: User sends /awards ---
  console.log("-------------------------------------------------");
  console.log("STEP 9: Slash Command /awards (Superlatives Shelf)");
  console.log("-------------------------------------------------");
  await sendUserMessage("/awards");

  // --- Step 10: User sends /accounts ---
  console.log("-------------------------------------------------");
  console.log("STEP 10: Slash Command /accounts (Slot Manager)");
  console.log("-------------------------------------------------");
  await sendUserMessage("/accounts");

  // --- Step 11: User sends a Telegram username directly ---
  console.log("-------------------------------------------------");
  console.log("STEP 11: Direct Username Entry '@fuadtesfaye'");
  console.log("-------------------------------------------------");
  await sendUserMessage("@fuadtesfaye");

  // --- Step 12: User sends /help ---
  console.log("-------------------------------------------------");
  console.log("STEP 12: Slash Command /help");
  console.log("-------------------------------------------------");
  await sendUserMessage("/help");

  console.log("=================================================");
  console.log("🎉 ALL USER SIMULATION INTERACTIONS COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
}

runUserSimulation().catch((err) => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});
