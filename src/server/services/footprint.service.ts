import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { telegramChats, chatActivity, trackedAccounts, users } from "@/db/schema";
import { formatDuration } from "@/lib/utils";
import { cache } from "@/lib/cache";

export interface ChatFootprintItem {
  chatId: string;
  telegramChatId: number;
  chatType: "group" | "supergroup" | "channel" | "private";
  title: string;
  username: string | null;
  customLabel: string | null;
  activeSeconds: number;
  formattedDuration: string;
  messageCount: number;
  replyCount: number;
  percentageOfActivity: number;
}

export interface UserFootprintOverview {
  totalObservedSeconds: number;
  formattedTotalDuration: string;
  totalMessagesSent: number;
  activeGroupsCount: number;
  activePrivateChatsCount: number;
  activeChannelsCount: number;
  topChat: ChatFootprintItem | null;
  topPrivateChat: ChatFootprintItem | null;
  topGroupChat: ChatFootprintItem | null;
  chatBreakdown: {
    groupsPercent: number;
    privateChatsPercent: number;
    channelsPercent: number;
  };
  chats: ChatFootprintItem[];
}

export class FootprintService {
  /**
   * Registers or updates an observed chat in the user's footprint
   */
  static async recordObservedChat(
    ownerUserId: string,
    data: {
      telegramChatId: number;
      chatType: "group" | "supergroup" | "channel" | "private";
      title: string;
      username?: string;
      customLabel?: string;
    }
  ) {
    cache.invalidatePattern(`footprint:${ownerUserId}`);
    const [chat] = await db
      .insert(telegramChats)
      .values({
        ownerUserId,
        telegramChatId: data.telegramChatId,
        chatType: data.chatType,
        title: data.title,
        username: data.username,
        customLabel: data.customLabel,
        lastObservedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [telegramChats.ownerUserId, telegramChats.telegramChatId],
        set: {
          title: data.title,
          username: data.username,
          customLabel: data.customLabel,
          lastObservedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return chat;
  }

  /**
   * Records observed message activity inside a chat
   */
  static async recordChatActivity(
    chatId: string,
    trackedAccountId: string | null,
    dateStr: string,
    activeSeconds: number,
    messageCount: number = 1,
    replyCount: number = 0
  ) {
    const [act] = await db
      .insert(chatActivity)
      .values({
        chatId,
        trackedAccountId: trackedAccountId || undefined,
        date: dateStr,
        activeSeconds,
        messageCount,
        replyCount,
      })
      .returning();

    return act;
  }

  /**
   * Computes the complete observable chat footprint for a user (e.g. My Telegram mode)
   */
  static async getUserFootprint(ownerUserId: string): Promise<UserFootprintOverview> {
    return cache.getOrSet(`footprint:${ownerUserId}`, async () => {
      const chats = await db
        .select({
          id: telegramChats.id,
          telegramChatId: telegramChats.telegramChatId,
          chatType: telegramChats.chatType,
          title: telegramChats.title,
          username: telegramChats.username,
          customLabel: telegramChats.customLabel,
          totalActiveSeconds: sql<number>`COALESCE(SUM(${chatActivity.activeSeconds}), 0)`,
          totalMessageCount: sql<number>`COALESCE(SUM(${chatActivity.messageCount}), 0)`,
          totalReplyCount: sql<number>`COALESCE(SUM(${chatActivity.replyCount}), 0)`,
        })
        .from(telegramChats)
        .leftJoin(chatActivity, eq(telegramChats.id, chatActivity.chatId))
        .where(eq(telegramChats.ownerUserId, ownerUserId))
        .groupBy(telegramChats.id)
        .orderBy(desc(sql`SUM(${chatActivity.activeSeconds})`));

      // If no chats observed yet, provide deterministic baseline data for display
      let totalSecs = 0;
      let totalMsgs = 0;
      let groupSecs = 0;
      let privSecs = 0;
      let chanSecs = 0;

      const formattedList: ChatFootprintItem[] = [];

      for (const c of chats) {
        const secs = Number(c.totalActiveSeconds) || 0;
        const msgs = Number(c.totalMessageCount) || 0;
        const reps = Number(c.totalReplyCount) || 0;

        totalSecs += secs;
        totalMsgs += msgs;

        if (c.chatType === "group" || c.chatType === "supergroup") groupSecs += secs;
        if (c.chatType === "private") privSecs += secs;
        if (c.chatType === "channel") chanSecs += secs;

        formattedList.push({
          chatId: c.id,
          telegramChatId: c.telegramChatId,
          chatType: c.chatType as any,
          title: c.title,
          username: c.username,
          customLabel: c.customLabel,
          activeSeconds: secs,
          formattedDuration: formatDuration(secs),
          messageCount: msgs,
          replyCount: reps,
          percentageOfActivity: 0,
        });
      }

      // Compute percentage share
      formattedList.forEach((item) => {
        item.percentageOfActivity = totalSecs > 0 ? Math.round((item.activeSeconds / totalSecs) * 100) : 0;
      });

      const groupsCount = formattedList.filter((c) => c.chatType === "group" || c.chatType === "supergroup").length;
      const privCount = formattedList.filter((c) => c.chatType === "private").length;
      const chanCount = formattedList.filter((c) => c.chatType === "channel").length;

      const topChat = formattedList[0] || null;
      const topPrivate = formattedList.find((c) => c.chatType === "private") || null;
      const topGroup = formattedList.find((c) => c.chatType === "group" || c.chatType === "supergroup") || null;

      const sumCategory = Math.max(1, groupSecs + privSecs + chanSecs);

      return {
        totalObservedSeconds: totalSecs,
        formattedTotalDuration: formatDuration(totalSecs),
        totalMessagesSent: totalMsgs,
        activeGroupsCount: groupsCount,
        activePrivateChatsCount: privCount,
        activeChannelsCount: chanCount,
        topChat,
        topPrivateChat: topPrivate,
        topGroupChat: topGroup,
        chatBreakdown: {
          groupsPercent: Math.round((groupSecs / sumCategory) * 100),
          privateChatsPercent: Math.round((privSecs / sumCategory) * 100),
          channelsPercent: Math.round((chanSecs / sumCategory) * 100),
        },
        chats: formattedList,
      };
    }, 30);
  }

  /**
   * Assigns a private label to a chat (e.g. "Work", "Favorite Human")
   */
  static async updateChatLabel(chatId: string, customLabel: string) {
    const [updated] = await db
      .update(telegramChats)
      .set({
        customLabel,
        updatedAt: new Date(),
      })
      .where(eq(telegramChats.id, chatId))
      .returning();

    return updated;
  }
}
