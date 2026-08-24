import { formatDuration } from "@/lib/utils";

export type RoastLevel = "friendly" | "normal" | "brutal" | "nuclear";

export type BehavioralArchetype =
  | "TELEGRAM_INFRASTRUCTURE"
  | "THE_OBSERVER"
  | "SPEED_TYPER"
  | "MESSAGE_MACHINE"
  | "SERIAL_CHECKER"
  | "CHAIR_RESIDENT"
  | "NIGHT_SHIFT"
  | "EARLY_BIRD"
  | "THE_GHOST"
  | "AGGRESSIVELY_NORMAL";

export interface RoastContext {
  targetName: string;
  totalActiveSeconds: number;
  sessionCount: number;
  longestSessionSeconds: number;
  messageCount?: number;
  nightActivitySeconds?: number;
  morningActivitySeconds?: number;
  topChatName?: string;
  topChatSeconds?: number;
  topChatMessageCount?: number;
  topChatType?: "group" | "private" | "channel";
  customChatLabel?: string;
  weeklyChangePercent?: number;
  roastLevel?: RoastLevel;
}

export interface GeneratedRoast {
  archetype: BehavioralArchetype;
  archetypeTitle: string;
  roastLevel: RoastLevel;
  headline: string;
  roastText: string;
  verdict: string;
  shareSnippet: string;
}

export class RoastEngineService {
  /**
   * Classifies user behavior into a deterministic behavioral archetype
   */
  static classifyArchetype(ctx: RoastContext): BehavioralArchetype {
    const hours = ctx.totalActiveSeconds / 3600;

    if (hours >= 40) return "TELEGRAM_INFRASTRUCTURE";

    // Chat specific archetype
    if (ctx.topChatSeconds && ctx.topChatSeconds > 2 * 3600 && (ctx.topChatMessageCount || 0) < 10) {
      return "THE_OBSERVER";
    }

    if (ctx.topChatMessageCount && ctx.topChatMessageCount >= 80 && (ctx.topChatSeconds || 0) < 3600) {
      return "SPEED_TYPER";
    }

    if (ctx.longestSessionSeconds >= 3.5 * 3600) return "CHAIR_RESIDENT";

    if (ctx.sessionCount >= 40 && ctx.totalActiveSeconds / Math.max(1, ctx.sessionCount) < 300) {
      return "SERIAL_CHECKER";
    }

    if ((ctx.nightActivitySeconds || 0) >= 6 * 3600) return "NIGHT_SHIFT";
    if ((ctx.morningActivitySeconds || 0) >= 4 * 3600) return "EARLY_BIRD";

    if (hours <= 2 && ctx.sessionCount <= 5) return "THE_GHOST";
    if (hours >= 4 && hours <= 15) return "AGGRESSIVELY_NORMAL";

    return "SERIAL_CHECKER";
  }

  /**
   * Generates a statistics-grounded roast across 4 selectable intensity levels
   */
  static generateRoast(ctx: RoastContext): GeneratedRoast {
    const level: RoastLevel = ctx.roastLevel || "normal";
    const archetype = this.classifyArchetype(ctx);
    const durationFormatted = formatDuration(ctx.totalActiveSeconds);
    const longestFormatted = formatDuration(ctx.longestSessionSeconds);

    let archetypeTitle = "📡 Signal Tower";
    let headline = "Telegram Activity Analysis";
    let roastText = "";
    let verdict = "";

    switch (archetype) {
      case "TELEGRAM_INFRASTRUCTURE":
        archetypeTitle = "🛰️ Telegram Infrastructure";
        headline = "👑 The Sovereign of Screen Time";
        if (level === "friendly") {
          roastText = `${durationFormatted} observed this week. You are easily the most dedicated member of the server. We salute your tireless commitment to the blue app!`;
          verdict = "⭐ VIP Community Pillar";
        } else if (level === "normal") {
          roastText = `${durationFormatted} logged this week. At this point Telegram isn't an application on your phone — you're an employee who forgot to clock out.`;
          verdict = "⚰️ You spent more time on Telegram this week than most people spend at full-time jobs.";
        } else if (level === "brutal") {
          roastText = `${durationFormatted} across ${ctx.sessionCount} sessions. People don't open Telegram anymore; they connect to the internet through your nervous system. Your charger has filed a human rights violation.`;
          verdict = "💀 Official residency established inside Telegram headquarters.";
        } else {
          // Nuclear
          roastText = `${durationFormatted} observed. If Pavel Durov shut down the servers tomorrow, your brain would experience a 404 error. The blue checkmark isn't a badge for you; it's a medical condition.`;
          verdict = "☠️ Human-to-Telegram ratio has reached catastrophic critical mass.";
        }
        break;

      case "THE_OBSERVER":
        archetypeTitle = "🕵️ The Field Researcher";
        headline = "👁️ Silent Reconnaissance Unit";
        const chatName = ctx.customChatLabel || ctx.topChatName || "that group chat";
        const msgCount = ctx.topChatMessageCount || 3;
        const chatDur = formatDuration(ctx.topChatSeconds || 2 * 3600);

        if (level === "friendly") {
          roastText = `You spent ${chatDur} in ${chatName} and sent ${msgCount} messages. A wonderful listener who lets everyone else take the spotlight!`;
          verdict = "👂 Elite Active Listener";
        } else if (level === "normal") {
          roastText = `You spent ${chatDur} in ${chatName} and sent ${msgCount} messages. Bro is not participating in the chat — bro is conducting field research. 🧪`;
          verdict = "📝 An impressive amount of sitting for an impressive lack of typing.";
        } else if (level === "brutal") {
          roastText = `${chatDur} observed in ${chatName} with only ${msgCount} messages sent. You're lurking so hard the CIA is taking notes on your surveillance techniques.`;
          verdict = "💀 Ghost mode enabled. Contribution to conversation: 0.01%.";
        } else {
          // Nuclear
          roastText = `You sat in ${chatName} for ${chatDur} without typing a single word. Archeologists have confirmed you were briefly mistaken for group chat wallpaper.`;
          verdict = "☠️ The human equivalent of a CCTV camera with no audio.";
        }
        break;

      case "SPEED_TYPER":
        archetypeTitle = "⚡ Speed Typer";
        headline = "💣 Rapid Deployment Unit";
        if (level === "friendly") {
          roastText = `${ctx.topChatMessageCount || 90} messages in ${formatDuration(ctx.topChatSeconds || 1800)}. Fast fingers, high energy, always keeping the chats alive!`;
          verdict = "⚡ Quick Draw Champion";
        } else if (level === "normal") {
          roastText = `You entered the chat, deployed ${ctx.topChatMessageCount || 90} messages in ${formatDuration(ctx.topChatSeconds || 1800)}, and vanished. You didn't chat; you unloaded a magazine.`;
          verdict = "💨 Hit-and-run conversation specialist.";
        } else {
          roastText = `${ctx.topChatMessageCount || 90} messages blasted in under 30 minutes. Your keyboard glass is currently undergoing thermal cooling.`;
          verdict = "💀 Bro treats group chats like an esports tournament.";
        }
        break;

      case "SERIAL_CHECKER":
        archetypeTitle = "🔄 The Serial Checker";
        headline = "🚪 Door → Telegram → Door";
        if (level === "friendly") {
          roastText = `${ctx.sessionCount} visits recorded! You never miss an update and always stay connected with your friends.`;
          verdict = "🔔 Most Responsive Friend";
        } else if (level === "normal") {
          roastText = `You opened Telegram ${ctx.sessionCount} times this week. You didn't use Telegram — you visited it repeatedly like checking the fridge hoping new food appeared.`;
          verdict = "👀 Compulsive refresh syndrome detected.";
        } else {
          roastText = `${ctx.sessionCount} sessions with an average duration under 2 minutes. Even your notification server is begging you to take a breath.`;
          verdict = "💀 The human push notification.";
        }
        break;

      case "CHAIR_RESIDENT":
        archetypeTitle = "🪑 The Chair Resident";
        headline = "🛋️ The Couch Luminary";
        if (level === "friendly") {
          roastText = `Longest continuous presence: ${longestFormatted}. Incredible focus and dedication to the conversation!`;
          verdict = "🧘 Deep Focus Master";
        } else if (level === "normal") {
          roastText = `One continuous session lasted ${longestFormatted}. You entered Telegram, the earth completed part of its orbit, and you were still in the exact same chat.`;
          verdict = "🪑 The chair has formed a permanent imprint of your posture.";
        } else {
          roastText = `${longestFormatted} in a single session without leaving. At this point, your sofa cushion should be declared a historical landmark.`;
          verdict = "💀 Emergency postural intervention required.";
        }
        break;

      case "NIGHT_SHIFT":
        archetypeTitle = "🌙 Lord of the Night Shift";
        headline = "🦇 2AM Dispatcher";
        if (level === "friendly") {
          roastText = `${formatDuration(ctx.nightActivitySeconds || 0)} logged after 22:00. A true night owl keeping the nocturnal conversations glowing!`;
          verdict = "🌟 Midnight Luminary";
        } else if (level === "normal") {
          roastText = `${formatDuration(ctx.nightActivitySeconds || 0)} logged past 10 PM. Normal humans: sleeping. You: "last seen just now" at 3:14 AM arguing about nothing.`;
          verdict = "🌙 The day is over. Apparently your chat is not.";
        } else {
          roastText = `Logging on at 3:45 AM. Your melatonin levels have officially handed in their two weeks notice.`;
          verdict = "💀 Sleep schedule: Error 500.";
        }
        break;

      case "EARLY_BIRD":
        archetypeTitle = "☀️ The 5AM Prophet";
        headline = "🌅 Dawn Patrol Leader";
        roastText = `Active before 8 AM. Sending memes before the birds have even woken up. We respect the grind, but also why?`;
        verdict = "☕ Coffee is optional; Telegram is mandatory.";
        break;

      case "THE_GHOST":
        archetypeTitle = "🫥 The Ghost Lurker";
        headline = "🌿 Touched Real Grass";
        roastText = `Only ${durationFormatted} observed this week. Did you lose your phone charger, or did you accidentally discover the real outside world?`;
        verdict = "🌱 Confirmed living in the physical universe.";
        break;

      default:
        archetypeTitle = "😐 Aggressively Normal";
        headline = "⚖️ Suspiciously Balanced";
        roastText = `${durationFormatted} observed across ${ctx.sessionCount} sessions. You have an entirely reasonable, healthy amount of Telegram usage. We find this deeply suspicious.`;
        verdict = "🧘 Balanced, stable, and completely boring.";
        break;
    }

    const shareSnippet = `🔥 Telegram League Roast\n\nTarget: ${ctx.targetName}\nTitle: ${archetypeTitle}\n\n"${roastText}"\n\n${verdict}\n\n🏆 Track. Compete. Get Roasted on Telegram League!`;

    return {
      archetype,
      archetypeTitle,
      roastLevel: level,
      headline,
      roastText,
      verdict,
      shareSnippet,
    };
  }
}
