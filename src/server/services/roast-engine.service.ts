import { formatDuration } from "@/lib/utils";

export type RoastLevel = "friendly" | "normal" | "brutal" | "nuclear";

export type RoastCategory =
  | "WEEKLY_WINNER"
  | "RUNNER_UP"
  | "THIRD_PLACE"
  | "LONG_SESSION"
  | "MANY_SESSIONS"
  | "MANY_SHORT_SESSIONS"
  | "HIGH_MESSAGES"
  | "CHAOTIC_BURSTS"
  | "LOW_MESSAGES_HIGH_TIME"
  | "TOP_PRIVATE_CHAT"
  | "GIRL_GROUP"
  | "BOY_GROUP"
  | "NIGHT_OWL"
  | "EARLY_BIRD"
  | "HIGH_GROWTH"
  | "MASSIVE_DECREASE"
  | "LOW_ACTIVITY"
  | "CONSISTENT"
  | "GENERAL_MENACE"
  | "UNHINGED"
  | "AGGRESSIVELY_NORMAL";

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
  | "HUMAN_CRON_JOB"
  | "DIPLOMAT"
  | "BRO_PARLIAMENT"
  | "FAVORITE_HUMAN"
  | "AGGRESSIVELY_NORMAL";

export interface RoastContext {
  targetName: string;
  rank?: number;
  totalCompetitors?: number;
  totalActiveSeconds: number;
  sessionCount: number;
  longestSessionSeconds: number;
  averageSessionSeconds?: number;
  messageCount?: number;
  burstMessageCount?: number;
  nightActivitySeconds?: number;
  morningActivitySeconds?: number;
  topChatName?: string;
  topChatSeconds?: number;
  topChatMessageCount?: number;
  topChatType?: "group" | "supergroup" | "private" | "channel";
  topChatPercent?: number;
  customChatLabel?: string;
  weeklyChangePercent?: number;
  dailyVarianceSeconds?: number;
  roastLevel?: RoastLevel;
}

export interface GeneratedRoast {
  category: RoastCategory;
  archetype: BehavioralArchetype;
  title: string;
  roastLevel: RoastLevel;
  headline: string;
  roastText: string;
  verdict: string;
  shareSnippet: string;
}

export interface RoastRule {
  id: string;
  category: RoastCategory;
  archetype: BehavioralArchetype;
  priority: number;
  condition: (ctx: RoastContext) => boolean;
  titles: string[];
  friendlyRoasts: (ctx: RoastContext) => string[];
  normalRoasts: (ctx: RoastContext) => string[];
  brutalRoasts: (ctx: RoastContext) => string[];
  nuclearRoasts: (ctx: RoastContext) => string[];
  verdicts: string[];
}

export class RoastEngineService {
  /**
   * Master Catalog of Data-Driven Roast Rules
   */
  static readonly RULES: RoastRule[] = [
    // 1. Weekly Winner (#1)
    {
      id: "rule_weekly_winner",
      category: "WEEKLY_WINNER",
      archetype: "TELEGRAM_INFRASTRUCTURE",
      priority: 100,
      condition: (ctx) => ctx.rank === 1 && (ctx.totalCompetitors || 1) > 1,
      titles: [
        "👑 Telegram Emperor",
        "👑 Telegram Supreme",
        "👑 Blue Crown Monarch",
        "👑 Lord of the Blue Dot",
        "👑 Sultan of Seen",
        "👑 King of the Keyboard",
        "👑 Emperor of Online",
        "👑 Chairman of Telegram",
        "👑 Supreme Commander of Group Chats",
        "👑 The Final Boss of Telegram",
        "👑 Grandmaster of \"Seen\"",
        "👑 CEO of Being Online",
        "👑 President of Telegram Affairs",
        "👑 The Notification Overlord",
      ],
      friendlyRoasts: (ctx) => [
        `🥇 1st Place! ${formatDuration(ctx.totalActiveSeconds)} logged. You led the entire league with unmatched dedication!`,
        `Congratulations on taking the crown this week with ${formatDuration(ctx.totalActiveSeconds)}! A true champion of staying connected.`,
      ],
      normalRoasts: (ctx) => [
        `🥇 YOU WON with ${formatDuration(ctx.totalActiveSeconds)}. There was no competition. There was an employee shortage.\n\nCongratulations. You are officially: CEO OF BEING ONLINE (Salary: $0, Hours worked: ${Math.round(ctx.totalActiveSeconds / 3600)}).`,
        `${formatDuration(ctx.totalActiveSeconds)} this week. You didn't just win the league; you made everyone else look like they actually have hobbies.`,
        `👑 1st Place. ${formatDuration(ctx.totalActiveSeconds)} observed. The blue crown is yours, though your charger deserves at least 40% of the credit.`,
      ],
      brutalRoasts: (ctx) => [
        `🥇 1st Place with ${formatDuration(ctx.totalActiveSeconds)}. You spent more time on Telegram this week than most full-time workers spend at their jobs.`,
        `${formatDuration(ctx.totalActiveSeconds)} across ${ctx.sessionCount} sessions. You crushed the competition because the competition went outside and saw sunlight.`,
      ],
      nuclearRoasts: (ctx) => [
        `🥇 YOU WON (${formatDuration(ctx.totalActiveSeconds)}). If Pavel Durov shut down the servers tomorrow, your brain would experience an unrecoverable 404.`,
        `Your weekly Telegram activity is ${formatDuration(ctx.totalActiveSeconds)}. Congratulations. You have successfully turned "free time" into an unpaid corporate internship.`,
      ],
      verdicts: [
        "🏆 Crown safely secured. Physical world successfully ignored.",
        "👑 Certified Sovereign of Screen Time.",
        "⚰️ The blue crown is heavy, but your charger is heavier.",
      ],
    },

    // 2. Second Place (#2)
    {
      id: "rule_runner_up",
      category: "RUNNER_UP",
      archetype: "CHAIR_RESIDENT",
      priority: 90,
      condition: (ctx) => ctx.rank === 2 && (ctx.totalCompetitors || 1) > 1,
      titles: [
        "🥈 Perpetual Runner-Up",
        "🥈 Almost Emperor",
        "🥈 The Crown Snatcher's Victim",
        "🥈 Second Place Specialist",
        "🥈 Silver Sufferer",
        "🥈 Professional Almost-Winner",
        "🥈 The \"So Close\" Department",
      ],
      friendlyRoasts: (ctx) => [
        `🥈 2nd Place! ${formatDuration(ctx.totalActiveSeconds)} observed. An incredible performance, right on the leader's heels!`,
        `Silver medal finish! ${formatDuration(ctx.totalActiveSeconds)} logged. You gave the leader a real run for their money.`,
      ],
      normalRoasts: (ctx) => [
        `🥈 2nd Place with ${formatDuration(ctx.totalActiveSeconds)}. You were so close to greatness. Unfortunately, 1st place apparently has zero outside commitments.`,
        `${formatDuration(ctx.totalActiveSeconds)} logged. Silver medal honors for putting in overtime without securing the championship.`,
      ],
      brutalRoasts: (ctx) => [
        `🥈 2nd Place (${formatDuration(ctx.totalActiveSeconds)}). You wasted all that battery just to be the first person who didn't win.`,
        `All those hours on Telegram and you still ended up holding the silver. Tragic.`,
      ],
      nuclearRoasts: (ctx) => [
        `🥈 ${formatDuration(ctx.totalActiveSeconds)} spent staring at a screen just to end up as the leader's emotional support runner-up.`,
      ],
      verdicts: [
        "🥈 So close to the throne, yet so far from productivity.",
        "🥈 Second place: the first loser of screen time.",
      ],
    },

    // 3. Third Place (#3)
    {
      id: "rule_third_place",
      category: "THIRD_PLACE",
      archetype: "AGGRESSIVELY_NORMAL",
      priority: 85,
      condition: (ctx) => ctx.rank === 3 && (ctx.totalCompetitors || 1) >= 3,
      titles: [
        "🥉 Bronze Menace",
        "🥉 Honorable Yapper",
        "🥉 Professional Supporting Character",
        "🥉 The Podium Resident",
        "🥉 Third Place & Proud",
        "🥉 Almost Relevant",
      ],
      friendlyRoasts: (ctx) => [
        `🥉 3rd Place with ${formatDuration(ctx.totalActiveSeconds)}. Made the podium with great consistency!`,
      ],
      normalRoasts: (ctx) => [
        `🥉 Third place (${formatDuration(ctx.totalActiveSeconds)}). Not first. Not second. But hey: you got pixels on the podium.`,
        `${formatDuration(ctx.totalActiveSeconds)} logged. You participated, you competed, and you took home bronze dignity.`,
      ],
      brutalRoasts: (ctx) => [
        `🥉 3rd Place. You're the background character in everyone else's tournament arc.`,
      ],
      nuclearRoasts: (ctx) => [
        `🥉 Third place with ${formatDuration(ctx.totalActiveSeconds)}. Just enough Telegram to be unproductive, not enough to win anything.`,
      ],
      verdicts: [
        "🥉 Bronze medal secured. Real life still waiting.",
      ],
    },

    // 4. Girl Group Diplomatic Activity (Custom labeled)
    {
      id: "rule_girl_group",
      category: "GIRL_GROUP",
      archetype: "DIPLOMAT",
      priority: 80,
      condition: (ctx) =>
        Boolean(
          ctx.customChatLabel?.toLowerCase().includes("girl") ||
          ctx.topChatName?.toLowerCase().includes("girl")
        ),
      titles: [
        "🚨 Diplomatic Mission",
        "🕊️ Foreign Affairs Department",
        "🇺🇳 UN Peacekeeping Observer",
        "🕵️ Ambassador of \"Just Looking\"",
        "🌐 International Relations Department",
        "🧳 The Tourist",
        "🎓 Visiting Scholar",
        "🤝 Group Chat Diplomat",
        "🗺️ Cultural Exchange Officer",
        "🏛️ Permanent Observer Status",
      ],
      friendlyRoasts: (ctx) => [
        `You spent ${formatDuration(ctx.topChatSeconds || 3600)} in ${ctx.topChatName || "the chat"}. A wonderful diplomatic presence!`,
      ],
      normalRoasts: (ctx) => [
        `🚨 DIPLOMATIC ACTIVITY: You spent ${formatDuration(ctx.topChatSeconds || 7200)} in ${ctx.topChatName || "the group"} with ${ctx.topChatMessageCount || 6} messages. Bro is not involved — bro has diplomatic immunity.`,
        `You stayed in ${ctx.topChatName || "the group"} for ${formatDuration(ctx.topChatSeconds || 7200)}. Bro has accepted a posting abroad.`,
        `${formatDuration(ctx.topChatSeconds || 7200)} active with ${ctx.topChatMessageCount || 3} messages. The ambassador has spoken.`,
      ],
      brutalRoasts: (ctx) => [
        `Your embassy in ${ctx.topChatName || "the group"} has been open all night. Total contribution: 4 sentences and a sticker.`,
        `${formatDuration(ctx.topChatSeconds || 7200)}. I won't ask questions. The international community is watching.`,
      ],
      nuclearRoasts: (ctx) => [
        `You've been lurking in this chat so long without talking that Telegram is considering granting you honorary furniture status.`,
      ],
      verdicts: [
        "🚨 Diplomatic immunity officially invoked.",
        "🕊️ International observation mission complete.",
      ],
    },

    // 5. Boy Group / Bro Parliament (Custom labeled)
    {
      id: "rule_boy_group",
      category: "BOY_GROUP",
      archetype: "BRO_PARLIAMENT",
      priority: 80,
      condition: (ctx) =>
        Boolean(
          ctx.customChatLabel?.toLowerCase().includes("boy") ||
          ctx.customChatLabel?.toLowerCase().includes("bro") ||
          ctx.topChatName?.toLowerCase().includes("boys") ||
          ctx.topChatName?.toLowerCase().includes("bros")
        ),
      titles: [
        "🗣️ Brotherhood Affairs Minister",
        "🏛️ Council of Unnecessary Opinions",
        "🧪 Department of Bro Science",
        "🤦 Ministry of Bad Decisions",
        "🏛️ The Bro Parliament",
        "🗳️ Underground Male Congress",
        "📢 Council of Yappers",
      ],
      friendlyRoasts: (ctx) => [
        `${formatDuration(ctx.topChatSeconds || 7200)} in the boys chat. Brotherhood is thriving!`,
      ],
      normalRoasts: (ctx) => [
        `You spent ${formatDuration(ctx.topChatSeconds || 14400)} in ${ctx.topChatName || "the boys chat"}. You held a parliamentary session with zero legislation.`,
        `${ctx.topChatMessageCount || 186} messages sent. The Bro Parliament was apparently in session discussing absolutely nothing.`,
        `${formatDuration(ctx.topChatSeconds || 9600)} discussing theories that violate every law of physics. Democracy is thriving.`,
      ],
      brutalRoasts: (ctx) => [
        `Hours of debate recorded in ${ctx.topChatName || "the boys chat"}. Total productive output: 0.00%.`,
      ],
      nuclearRoasts: (ctx) => [
        `A multi-hour session of pure, unadulterated bro science that would cause academic institutions to revoke degrees.`,
      ],
      verdicts: [
        "🏛️ Bro Parliament adjourned with zero actionable takeaways.",
      ],
    },

    // 6. One Private Chat Dominates (The Favorite Human)
    {
      id: "rule_top_private_chat",
      category: "TOP_PRIVATE_CHAT",
      archetype: "FAVORITE_HUMAN",
      priority: 75,
      condition: (ctx) =>
        Boolean(
          ctx.topChatType === "private" && (ctx.topChatPercent || 0) >= 30
        ),
      titles: [
        "❤️ The Favorite Human",
        "💼 Unofficial Co-Worker",
        "🏢 Communication Department",
        "📞 Two-Person Call Center",
        "🏰 Private Chat Headquarters",
        "⭐ The Main Character Connection",
        "🎟️ Exclusive Subscriber",
        "🔑 Conversation Tenant",
        "⌨️ The Other Half of the Keyboard",
        "☎️ Personal Hotline",
        "💌 The Dedicated Correspondent",
        "🎧 One-Man Support Desk",
        "🤝 Human Notification Partner",
      ],
      friendlyRoasts: (ctx) => [
        `${ctx.topChatPercent || 38}% of your Telegram activity happened with ${ctx.topChatName || "one person"}! True friendship and great connection.`,
      ],
      normalRoasts: (ctx) => [
        `${ctx.topChatPercent || 38}% of your Telegram activity happened in one private chat. You have 400 contacts and apparently one customer.`,
        `Your top private chat consumed ${formatDuration(ctx.topChatSeconds || 14400)} this week. The friendship is running on enterprise infrastructure.`,
        `${formatDuration(ctx.topChatSeconds || 14400)} in one conversation. That's not messaging. That's a remote office.`,
        `One chat generated ${ctx.topChatMessageCount || 214} messages. Congratulations on founding a small company.`,
        `Your most active private chat beat all other chats combined. The rest of your contacts are purely decorative.`,
      ],
      brutalRoasts: (ctx) => [
        `${ctx.topChatPercent || 45}% of your battery was sacrificed to one human being. We hope the replies were at least in full sentences.`,
        `You and this one contact are basically sharing a single shared brain cell across MTProto.`,
      ],
      nuclearRoasts: (ctx) => [
        `One conversation has achieved full economic and operational control over your life.`,
      ],
      verdicts: [
        "📞 Two-person hotline operating at 99.99% uptime.",
        "🏢 Enterprise friendship contract successfully renewed.",
      ],
    },

    // 7. Low Message, High Time (The Observer / Field Researcher)
    {
      id: "rule_low_msg_high_time",
      category: "LOW_MESSAGES_HIGH_TIME",
      archetype: "THE_OBSERVER",
      priority: 70,
      condition: (ctx) =>
        Boolean(
          (ctx.topChatSeconds || 0) >= 2 * 3600 &&
          (ctx.topChatMessageCount || 0) <= 8
        ),
      titles: [
        "🕵️ The Observer",
        "🫥 Silent Tenant",
        "🏺 Digital Archaeologist",
        "🧪 Field Researcher",
        "👁️ Professional Lurker",
        "🦜 Group Chat Ornithologist",
        "🎖️ Spectator General",
        "📜 Certified Lurker",
        "🧿 The Watcher",
        "📸 Group Chat Wildlife Photographer",
        "🤫 Silent Committee Member",
        "👤 Background NPC",
        "📹 Human Surveillance Camera",
        "🪑 Chair of Silent Observation",
        "📊 Low-Output High-Commitment Specialist",
      ],
      friendlyRoasts: (ctx) => [
        `Spent ${formatDuration(ctx.topChatSeconds || 7200)} in ${ctx.topChatName || "the chat"} and sent ${ctx.topChatMessageCount || 4} messages. An incredible listener!`,
      ],
      normalRoasts: (ctx) => [
        `${formatDuration(ctx.topChatSeconds || 8200)} in the group. ${ctx.topChatMessageCount || 4} messages. Bro is not participating — bro is gathering evidence. 🕵️`,
        `You spent ${formatDuration(ctx.topChatSeconds || 10800)} in this group and sent ${ctx.topChatMessageCount || 6} messages. What exactly were you auditing?`,
        `${formatDuration(ctx.topChatSeconds || 9600)} active. ${ctx.topChatMessageCount || 7} messages. Excellent surveillance work.`,
        `You were in this group for 97% of the time. You contributed the equivalent of a nod.`,
        `3 hours watching people talk. Bro discovered Telegram cinema.`,
        `You weren't chatting. You were conducting field research. 🧪`,
      ],
      brutalRoasts: (ctx) => [
        `${formatDuration(ctx.topChatSeconds || 7200)} logged with ${ctx.topChatMessageCount || 3} messages. You have the exact conversational output of a potted plant.`,
        `Lurking so quietly that group members assumed you were a decorative bot.`,
      ],
      nuclearRoasts: (ctx) => [
        `You sat in this group so long without speaking that historians are classifying your presence as an ancient archaeological fixture.`,
      ],
      verdicts: [
        "📝 An impressive amount of sitting for an impressive lack of typing.",
        "📹 Elite passive surveillance unit.",
      ],
    },

    // 8. Too Much Talking (Message Machine / Yapper)
    {
      id: "rule_high_messages",
      category: "HIGH_MESSAGES",
      archetype: "MESSAGE_MACHINE",
      priority: 70,
      condition: (ctx) =>
        Boolean((ctx.messageCount || 0) >= 200 || (ctx.topChatMessageCount || 0) >= 150),
      titles: [
        "🗣️ Conversation Engine",
        "🏭 Human Typing Department",
        "🤖 Message Machine",
        "📄 The Paragraph Factory",
        "💼 Chief Texting Officer",
        "⌨️ Keyboard Menace",
        "📢 Certified Yapper",
        "🎓 Yapologist",
        "👑 Supreme Yapper",
        "💬 The Human Comment Section",
        "🏢 Chairman of Typing",
        "🏭 Message Manufacturing Plant",
        "🚀 Textual Weapons Manufacturer",
        "👨🏫 Professor of Unsolicited Sentences",
        "👔 CEO of \"Bro Another Thing\"",
      ],
      friendlyRoasts: (ctx) => [
        `${ctx.messageCount || 300} messages sent! The vibrant heartbeat of every group chat.`,
      ],
      normalRoasts: (ctx) => [
        `${ctx.messageCount || 500} messages this week. Bro isn't in the conversation. Bro IS the conversation.`,
        `${ctx.messageCount || 312} messages logged. Did your keyboard file for overtime?`,
        `Telegram has recorded ${ctx.messageCount || 782} messages from you. We have contacted the keyboard's family.`,
        `Your typing speed is no longer impressive. It is a workplace incident.`,
        `${ctx.messageCount || 1000}+ messages. At this point the send button owes you commission.`,
      ],
      brutalRoasts: (ctx) => [
        `You typed ${ctx.messageCount || 400} messages this week. Not a single one of them was essential to the human experience.`,
        `The group didn't need a conversation; it received a full unedited autobiography.`,
      ],
      nuclearRoasts: (ctx) => [
        `${ctx.messageCount || 900} messages. The chat didn't need a moderator; it needed a publishing house with an active printing press.`,
      ],
      verdicts: [
        "📢 Keyboard requires urgent thermal cooldown.",
        "🏭 High-capacity paragraph producer.",
      ],
    },

    // 9. Chaotic Message Bursts (Yapnado)
    {
      id: "rule_chaotic_bursts",
      category: "CHAOTIC_BURSTS",
      archetype: "SPEED_TYPER",
      priority: 68,
      condition: (ctx) => Boolean((ctx.burstMessageCount || 0) >= 25),
      titles: [
        "🌪️ Yapnado",
        "🚀 Message Artillery",
        "⌨️ Keyboard Machine Gun",
        "🌊 Message Tsunami",
        "🌀 Typing Hurricane",
        "💥 Paragraph Cannon",
        "⚡ Keyboard Berserker",
        "🎯 Message Missile",
        "⚠️ The Human Keyboard Error",
      ],
      friendlyRoasts: (ctx) => [
        `${ctx.burstMessageCount || 40} messages fired off in rapid succession! Lightning fast replies.`,
      ],
      normalRoasts: (ctx) => [
        `41 messages in 6 minutes. Yapnado detected. 🌪️`,
        `You sent 23 messages before anyone replied. You were having a conversation with yourself and winning.`,
        `${ctx.burstMessageCount || 67} messages in one burst. The keyboard didn't consent to this workload.`,
      ],
      brutalRoasts: (ctx) => [
        `You unloaded a 30-message burst into a peaceful chat. That's not communication; that's textual artillery.`,
      ],
      nuclearRoasts: (ctx) => [
        `Rapid-fire texting at speeds that could legally trigger a DDoS mitigation warning.`,
      ],
      verdicts: [
        "🌪️ Category 5 Yapnado touchdown confirmed.",
      ],
    },

    // 10. Longest Session (Chair Resident / Couch Commander)
    {
      id: "rule_longest_session",
      category: "LONG_SESSION",
      archetype: "CHAIR_RESIDENT",
      priority: 65,
      condition: (ctx) => ctx.longestSessionSeconds >= 2.5 * 3600,
      titles: [
        "🪑 Chair Resident",
        "👾 Session Monster",
        "🛋️ The Couch Commander",
        "⛺ Telegram Squatter",
        "🏠 Permanent Group Chat Resident",
        "🗿 One Sitting Wonder",
        "🐻 Digital Hibernator",
        "📜 The Endless Scroll",
        "👑 Chairman of Telegram",
        "🚛 The Long Haul",
        "👹 Session Final Boss",
        "👁️ The Unblinking User",
        "🏃 Telegram Marathoner",
        "🏔️ Blue App Hermit",
        "⚙️ The Human Background Process",
      ],
      friendlyRoasts: (ctx) => [
        `Longest session: ${formatDuration(ctx.longestSessionSeconds)}. Incredible focus and endurance!`,
      ],
      normalRoasts: (ctx) => [
        `${formatDuration(ctx.longestSessionSeconds)} in one session. Bro didn't open Telegram. Bro moved in. 🪑`,
        `${formatDuration(ctx.longestSessionSeconds)}. You entered Telegram, the earth completed part of its orbit, and you were still in the exact same chat.`,
        `Longest session: ${formatDuration(ctx.longestSessionSeconds)}. That's not a session. That's a full work shift.`,
        `3 hours continuously online. Payroll has been notified.`,
        `You stayed in Telegram for so long that the session qualifies for annual paid leave.`,
        `You didn't leave Telegram. Telegram eventually decided you had done enough.`,
      ],
      brutalRoasts: (ctx) => [
        `${formatDuration(ctx.longestSessionSeconds)} in a single sitting. Your chair has permanently molded itself around your skeletal structure.`,
        `That wasn't browsing. That was a hostage situation between you and your screen.`,
      ],
      nuclearRoasts: (ctx) => [
        `${formatDuration(ctx.longestSessionSeconds)} uninterrupted. Your phone screen is begging for a union representative.`,
      ],
      verdicts: [
        "🪑 Sofa cushion officially designated as a historic monument.",
        "🛋️ Shift complete. Overtime approved.",
      ],
    },

    // 11. Most Sessions (Serial Checker / Door Knocker)
    {
      id: "rule_many_sessions",
      category: "MANY_SESSIONS",
      archetype: "SERIAL_CHECKER",
      priority: 60,
      condition: (ctx) => ctx.sessionCount >= 35,
      titles: [
        "🔄 Serial Checker",
        "🚪 Professional Re-Opener",
        "🚪 Telegram Door Knocker",
        "🔍 Blue Dot Inspector",
        "🏺 Notification Archaeologist",
        "🛍️ App Refresh Merchant",
        "🙋 Certified \"Just Checking\"",
        "✈️ Frequent Flyer of Telegram",
        "🚶 Telegram Hallway Walker",
        "🔔 Digital Doorbell Operator",
        "🔁 The Reincarnated User",
        "🔄 Human Refresh Button",
        "🛂 Notification Border Patrol",
        "👮 Seen Patrol Officer",
        "🕵️ Last-Seen Detective",
        "🩺 App Opening Specialist",
        "🔁 Telegram Habitual",
        "👀 Professional Peeker",
        "🧮 Blue Dot Accountant",
        "👔 Chief \"Let Me Just Check\" Officer",
      ],
      friendlyRoasts: (ctx) => [
        `${ctx.sessionCount} sessions logged! Always responsive, always on top of every update.`,
      ],
      normalRoasts: (ctx) => [
        `You opened Telegram ${ctx.sessionCount} times. At this point you're not checking messages; you're checking that Telegram is still there.`,
        `${ctx.sessionCount} sessions. Bro has an electronic punch card.`,
        `You opened Telegram so often that the app stopped welcoming you and started saying "you're back."`,
        `You don't use Telegram. You commute to Telegram. 🚌`,
        `Telegram was not opened today. It was visited. Repeatedly.`,
        `You checked Telegram ${ctx.sessionCount} times. You and the notification badge are in a toxic relationship.`,
      ],
      brutalRoasts: (ctx) => [
        `${ctx.sessionCount} opens. The app knows more about the exact fingerprint of your thumb than the FBI.`,
        `Opening Telegram every 4 minutes hoping someone texted back. Tragic commitment.`,
      ],
      nuclearRoasts: (ctx) => [
        `${ctx.sessionCount} sessions. Your lock screen is filing for emancipation.`,
      ],
      verdicts: [
        "🔄 Compulsive refresh syndrome verified by observation.",
        "🚪 Door knocker badge permanently pinned.",
      ],
    },

    // 12. Many Short Sessions (Drive-By User)
    {
      id: "rule_short_sessions",
      category: "MANY_SHORT_SESSIONS",
      archetype: "SERIAL_CHECKER",
      priority: 58,
      condition: (ctx) =>
        Boolean(
          ctx.sessionCount >= 25 &&
          (ctx.averageSessionSeconds || (ctx.totalActiveSeconds / Math.max(1, ctx.sessionCount))) < 120
        ),
      titles: [
        "🏎️ Drive-By User",
        "🎯 Hit-and-Run Texter",
        "🔭 Notification Sniper",
        "🍔 Drive-Thru Telegram",
        "⚡ The Speed Visitor",
        "⏱️ Two-Minute Menace",
        "👀 Blink-and-You're-Online",
        "🚨 Emergency Checker",
        "🚒 Rapid Response Unit",
        "💬 The Human Pop-up Notification",
      ],
      friendlyRoasts: (ctx) => [
        `${ctx.sessionCount} quick check-ins with fast response times!`,
      ],
      normalRoasts: (ctx) => [
        `${ctx.sessionCount} sessions. Average: 94 seconds. Bro logs into Telegram like he's defusing a bomb. 💣`,
        `Average session: 2 minutes. Your commitment to leaving is stronger than your commitment to staying.`,
        `2 minutes average session. Commitment issues detected.`,
      ],
      brutalRoasts: (ctx) => [
        `You enter, read two words, panic, and close the app. Fascinating behavior.`,
      ],
      nuclearRoasts: (ctx) => [
        `The digital equivalent of sticking your head through a doorway, gasping, and slamming the door.`,
      ],
      verdicts: [
        "🎯 Precision hit-and-run presence.",
      ],
    },

    // 13. Night Owl (Lord of the Last Seen / 2AM Department Head)
    {
      id: "rule_night_owl",
      category: "NIGHT_OWL",
      archetype: "NIGHT_SHIFT",
      priority: 55,
      condition: (ctx) => (ctx.nightActivitySeconds || 0) >= 3 * 3600,
      titles: [
        "🌙 Lord of the Last Seen",
        "🦇 Midnight Minister",
        "🏢 Night Shift Employee",
        "🌕 Moonlit Menace",
        "🦉 2AM Department Head",
        "📢 The Nocturnal Yapper",
        "🧛 Vampire With Wi-Fi",
        "🌑 Night Mode Citizen",
        "⚖️ Sleep's Legal Opponent",
        "🌅 Dawn's Worst Enemy",
      ],
      friendlyRoasts: (ctx) => [
        `${formatDuration(ctx.nightActivitySeconds || 0)} logged after hours. Keeping the nocturnal chats warm and active!`,
      ],
      normalRoasts: (ctx) => [
        `Active at 2:47 AM. Everyone else: 😴. You: "Seen 2:47 AM" arguing about nonsense.`,
        `${formatDuration(ctx.nightActivitySeconds || 0)} between midnight and 5 AM. Your sleep schedule has filed for divorce.`,
        `Telegram at 3 AM? The moon is online and somehow so are you. 🌕`,
        `You weren't awake late. You were on night shift at Telegram Inc.`,
      ],
      brutalRoasts: (ctx) => [
        `Active at 03:14 AM. Sleep has been officially removed from your system requirements.`,
        `Your circadian rhythm has collapsed and been replaced by blue app notifications.`,
      ],
      nuclearRoasts: (ctx) => [
        `You were active at 02:58 AM. The moon filed a formal noise complaint.`,
      ],
      verdicts: [
        "🦉 Nocturnal shift logged. Melatonin: 0%.",
        "🌙 Sleep schedule: HTTP 500 Internal Server Error.",
      ],
    },

    // 14. Early Morning (5AM Prophet / Digital Rooster)
    {
      id: "rule_early_bird",
      category: "EARLY_BIRD",
      archetype: "EARLY_BIRD",
      priority: 55,
      condition: (ctx) => (ctx.morningActivitySeconds || 0) >= 2.5 * 3600,
      titles: [
        "🌅 5AM Prophet",
        "🦅 Dawn Patrol",
        "☀️ Sunrise Supervisor",
        "🐓 Early-Bird Menace",
        "🍳 Breakfast Before Telegram",
        "🌄 Morning Shift",
        "🐓 Digital Rooster",
        "🚨 First Responder",
        "🔭 Pre-Sunrise Specialist",
      ],
      friendlyRoasts: (ctx) => [
        `Active before sunrise! First on the scene, greeting the morning with unmatched energy.`,
      ],
      normalRoasts: (ctx) => [
        `Active at 05:12 AM. The sun wasn't even loaded yet. You were already online. ☀️`,
        `5:03 AM. Who on earth are you reporting to? Bro said: "Sleep? I have notifications."`,
        `Online before the rooster. Sending memes to people who won't wake up for another 4 hours.`,
      ],
      brutalRoasts: (ctx) => [
        `Waking up at 5 AM just to read messages sent at 2 AM. Tragic dedication.`,
      ],
      nuclearRoasts: (ctx) => [
        `Up before the Telegram backend engineers have even started their coffee.`,
      ],
      verdicts: [
        "🌅 Dawn patrol officer on active duty.",
      ],
    },

    // 15. Consistent Daily Activity (Human Cron Job)
    {
      id: "rule_consistent",
      category: "CONSISTENT",
      archetype: "HUMAN_CRON_JOB",
      priority: 50,
      condition: (ctx) =>
        Boolean(
          ctx.dailyVarianceSeconds !== undefined &&
          ctx.dailyVarianceSeconds < 600 &&
          ctx.totalActiveSeconds > 5 * 3600
        ),
      titles: [
        "⏰ Human Cron Job",
        "📅 Scheduled Human",
        "🔧 Daily Maintenance",
        "📐 Reliability Engineer",
        "🕰️ The Clock",
        "🤖 Consistency Machine",
        "🧟 Routine Goblin",
        "🎯 Predictable Menace",
        "📅 Human Scheduler",
        "⚙️ Cron Job With Feelings",
      ],
      friendlyRoasts: (ctx) => [
        `Remarkable consistency! Your Telegram activity is dependable and stable every single day.`,
      ],
      normalRoasts: (ctx) => [
        `2h 31m every single day. You are frighteningly consistent. Monday: 2h 30m, Tuesday: 2h 29m, Wednesday: 2h 32m. Bro runs on cron. ⏰`,
        `Your Telegram activity is more stable than most production web services.`,
        `Your activity was almost identical every day. You're not spontaneous. You're scheduled.`,
      ],
      brutalRoasts: (ctx) => [
        `A machine would admire your routine. A human would find it deeply concerning.`,
      ],
      nuclearRoasts: (ctx) => [
        `You have achieved 99.999% uptime of sitting in Telegram at the exact same hour daily.`,
      ],
      verdicts: [
        "⚙️ 99.99% cron job reliability achieved.",
      ],
    },

    // 16. Very Low Activity (Telegram Ghost / Rare Pokémon)
    {
      id: "rule_low_activity",
      category: "LOW_ACTIVITY",
      archetype: "THE_GHOST",
      priority: 45,
      condition: (ctx) => ctx.totalActiveSeconds < 1800,
      titles: [
        "👻 Telegram Ghost",
        "✨ Rare Pokémon",
        "🦄 Urban Legend",
        "🏺 Last Seen Archaeology",
        "❓ The Missing Person",
        "🗣️ Rumor",
        "🐉 Mythical User",
        "👣 Digital Sasquatch",
        "👑 Offline Royalty",
        "🧍 The Occasionally Real Person",
      ],
      friendlyRoasts: (ctx) => [
        `Only ${formatDuration(ctx.totalActiveSeconds)} on Telegram this week. Living life in the real world!`,
      ],
      normalRoasts: (ctx) => [
        `19 minutes this week. Are you using Telegram or visiting it as a tourist? 🧳`,
        `We found activity. It was brief. Your weekly usage is so low that the tracker had to verify you weren't fictional.`,
        `You disappeared for 18 hours and came back. The missing person report has been canceled.`,
      ],
      brutalRoasts: (ctx) => [
        `So rarely online that your friends assume your profile picture is an oil painting.`,
      ],
      nuclearRoasts: (ctx) => [
        `Logging into Telegram once a week like checking a physical postal mailbox in 1994.`,
      ],
      verdicts: [
        "🌱 Confirmed touching actual physical grass.",
      ],
    },

    // 17. General Unhinged Menace (Default Fallback)
    {
      id: "rule_general_menace",
      category: "GENERAL_MENACE",
      archetype: "TELEGRAM_INFRASTRUCTURE",
      priority: 10,
      condition: () => true,
      titles: [
        "📡 Telegram Infrastructure",
        "🛰️ Human Server Rack",
        "🏢 Unpaid Telegram Employee",
        "🪑 Chair Resident",
        "🧍 Professionally Online",
        "📱 Full-Time Thumb Worker",
        "🧠 Chief Messaging Officer",
        "🫡 Minister of Being Online",
        "🧎 Devoted Servant of the Blue App",
        "🗿 Statue of Online Presence",
        "🏠 Telegram Homeowner",
        "🪪 Telegram Citizen",
        "🚪 Permanent Tenant of Telegram",
        "🛜 Wi-Fi With a Pulse",
        "🔌 Emotionally Plugged In",
        "📶 Walking Signal Tower",
        "🛰️ Orbital Telegram Asset",
        "🧪 Telegram Lab Rat",
        "🐀 Certified Notification Rat",
        "🗃️ Government Department of Telegram",
        "🏛️ Ministry of Group Chat Affairs",
        "🧑💼 Senior Telegram Associate",
        "💼 Telegram Middle Management",
        "👨💻 Senior Online Engineer",
        "🧑🔧 Telegram Maintenance Crew",
        "📞 Human Call Center",
        "🔋 Battery's Worst Enemy",
        "🫠 Battery Health's Final Boss",
        "🌐 The Internet Has Claimed You",
        "🧿 The One Who Is Always Watching",
        "👁️ Keeper of the Blue Dot",
        "🧛 Lord of the Last Seen",
        "🪦 Resident of the Online Afterlife",
        "🏴☠️ Captain of SS Telegram",
        "🚢 The Group Chat Pirate",
        "🌪️ Human Notification Storm",
        "🦠 Telegram Contamination Event",
        "☢️ Critical Messaging Exposure",
        "🚨 Public Safety Hazard",
        "🧯 Telegram Fire Risk",
        "📜 Ancient Scroll of Online History",
        "🪦 Buried Alive in Telegram",
        "🧟 The Undead Online",
        "🫥 Person Who Forgot the Outside World Exists",
        "🧬 Telegram Evolutionary Dead End",
        "🧠 Last Neuron Standing",
        "🧎 Kneecaps Sponsored by Telegram",
        "👴 Retired From Real Life",
        "🥴 Digitally Unwell",
        "🪑 Furniture With Telegram",
        "🧍♂️ Human Loading Screen",
        "🧪 Clinical Trial Participant #001",
        "📱 Phone's Favorite Tenant",
        "🛌 Bedside Telegram Analyst",
        "🫵 The Reason Your Battery Is Crying",
        "🧯 Emergency Notification Department",
        "📡 Human Wi-Fi Extender",
        "👻 Ghost With a Data Plan",
        "🐸 Chronically Connected Frog",
        "🦴 Skeleton With Telegram Installed",
        "⚰️ The Offline Cemetery",
        "🗿 Online Monument",
        "🫠 Liquid Human",
        "🧱 Brick With Notifications",
        "🧠 Brain.exe Has Left Telegram Open",
        "🪦 Last Seen: Unfortunately Never",
        "🛌 Bedroom Network Administrator",
        "🛰️ Low-Earth Telegram Object",
        "🌀 The Scrolling Vortex",
        "🕳️ Telegram Black Hole",
        "☠️ Notification Necromancer",
        "🧛 Bloodsucker of Group Chats",
        "🦹 The Blue Check Villain",
        "🐍 Serpent of the Group Chat",
        "🐸 Amphibian of the Online Marsh",
        "🗿 First of His Name, Last of His Offline Time",
      ],
      friendlyRoasts: (ctx) => [
        `${formatDuration(ctx.totalActiveSeconds)} observed this week across ${ctx.sessionCount} sessions. A steady presence!`,
      ],
      normalRoasts: (ctx) => [
        `You spent ${formatDuration(ctx.totalActiveSeconds)} on Telegram this week. That's basically a part-time job with worse benefits.`,
        `You checked Telegram ${ctx.sessionCount} times. You and the notification badge are in an intense relationship.`,
        `${formatDuration(ctx.totalActiveSeconds)} logged. You don't have Telegram installed — Telegram has you installed.`,
      ],
      brutalRoasts: (ctx) => [
        `Your phone spent ${formatDuration(ctx.totalActiveSeconds)} holding Telegram open. It deserves financial compensation.`,
        `Your activity has been analyzed. The committee has decided you're thoroughly cooked. 🍳`,
      ],
      nuclearRoasts: (ctx) => [
        `${formatDuration(ctx.totalActiveSeconds)} observed. Uninstalling Telegram at this point would require a full public ceremony and a military escort.`,
        `We reviewed your Telegram week. There will be no appeal.`,
      ],
      verdicts: [
        "📱 Official citizenship in Telegram verified.",
        "🔋 Battery life: permanently degraded.",
      ],
    },
  ];

  /**
   * Generates a data-driven roast matching the highest priority rule
   */
  static generateRoast(ctx: RoastContext): GeneratedRoast {
    const level: RoastLevel = ctx.roastLevel || "normal";
    const matchedRule =
      this.RULES.find((rule) => rule.condition(ctx)) || this.RULES[this.RULES.length - 1];

    // Select random title and roasts from the matched rule
    const title = this.getRandomItem(matchedRule.titles);
    let roastList: string[];

    switch (level) {
      case "friendly":
        roastList = matchedRule.friendlyRoasts(ctx);
        break;
      case "normal":
        roastList = matchedRule.normalRoasts(ctx);
        break;
      case "brutal":
        roastList = matchedRule.brutalRoasts(ctx);
        break;
      case "nuclear":
        roastList = matchedRule.nuclearRoasts(ctx);
        break;
    }

    const roastText = this.getRandomItem(roastList.length ? roastList : matchedRule.normalRoasts(ctx));
    const verdict = this.getRandomItem(matchedRule.verdicts);
    const headline = `🔥 ${matchedRule.category.replace(/_/g, " ")}`;

    const shareSnippet =
      `🏆 Telegram League Roast\n\n` +
      `Target: ${ctx.targetName}\n` +
      `Title: ${title}\n` +
      `Level: ${level.toUpperCase()}\n\n` +
      `"${roastText}"\n\n` +
      `${verdict}\n\n` +
      `👉 Track. Compete. Get Roasted on Telegram League!`;

    return {
      category: matchedRule.category,
      archetype: matchedRule.archetype,
      title,
      roastLevel: level,
      headline,
      roastText,
      verdict,
      shareSnippet,
    };
  }

  /**
   * Generates the single legendary "Roast of the Week" for the League Leaderboard
   */
  static generateRoastOfTheWeek(
    leaderName: string,
    leaderDurationSeconds: number,
    leaderSessionCount: number,
    topChatName?: string,
    topChatMsgCount?: number
  ): string {
    const durFormatted = formatDuration(leaderDurationSeconds);
    const templates = [
      `🏆 ROAST OF THE WEEK\n\n*${leaderName}* spent \`${durFormatted}\` on Telegram this week.\nThe app is now legally allowed to ask why you're late to work.`,
      `🏆 ROAST OF THE WEEK\n\n*${leaderName}* logged \`${durFormatted}\` across ${leaderSessionCount} sessions.\nBro's relationship status with Telegram is "it's complicated."`,
      `🏆 ROAST OF THE WEEK\n\n*${leaderName}* spent \`${durFormatted}\` online.\nPayroll has been notified that an unauthorized second job has commenced.`,
      topChatName
        ? `🏆 ROAST OF THE WEEK\n\n*${leaderName}* spent \`${durFormatted}\` in *${topChatName}* with only ${topChatMsgCount || 5} messages.\nNobody knows what they were doing there, including ${leaderName}.`
        : `🏆 ROAST OF THE WEEK\n\n*${leaderName}* opened Telegram ${leaderSessionCount} times this week.\nWe checked: Telegram was indeed still there every single time.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Three-Account System Triumvirate Group Title
   */
  static getThreeAccountTriumvirateTitle(): string {
    const titles = [
      "🏛️ THE BLUE COUNCIL",
      "🐴 The Three Horsemen of Telegram",
      "✨ The Holy Trinity of Online",
      "🤦 The Three Musketeers of Bad Decisions",
      "👑 The Telegram Triumvirate",
      "🦸 The Group Chat Avengers",
      "🌌 The Three Body Problem",
      "🏛️ The Online Council",
      "🔥 The Unholy Trinity",
    ];
    return this.getRandomItem(titles);
  }

  private static getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
