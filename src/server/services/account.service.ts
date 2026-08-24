import { AccountRepository } from "../repositories/account.repository";
import { UserRepository } from "../repositories/user.repository";
import { getTelegramClient } from "@/tracker/client/client-factory";
import { normalizeUsername } from "@/lib/utils";
import type { TrackingStatus } from "@/types";

export class AccountService {
  static async resolveUsername(rawUsername: string) {
    const username = normalizeUsername(rawUsername);
    if (!username) return null;

    const client = getTelegramClient();
    const target = await client.resolveUsername(username);
    return target;
  }

  static async addAccountToTrack(
    userId: string,
    rawUsername: string,
    label?: string,
    notes?: string
  ) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error("User not found");

    // Check account limits based on plan
    const currentAccounts = await AccountRepository.listByOwner(userId);
    const planLimits: Record<string, number> = {
      free: 1,
      pro: 10,
      enterprise: 50,
    };
    const maxAllowed = planLimits[user.plan] || 1;
    if (currentAccounts.length >= maxAllowed) {
      throw new Error(
        `Account limit reached for ${user.plan} plan (maximum ${maxAllowed} tracked account${maxAllowed > 1 ? "s" : ""}). Upgrade to track more.`
      );
    }

    const target = await this.resolveUsername(rawUsername);
    if (!target) {
      throw new Error(`Could not resolve Telegram account for "${rawUsername}". Please verify the username exists.`);
    }

    // Check if user already tracks this account
    const existing = await AccountRepository.findByOwnerAndTelegramUserId(
      userId,
      target.telegramUserId
    );
    if (existing) {
      if (existing.trackingStatus !== "active") {
        return await AccountRepository.updateStatus(existing.id, "active", null);
      }
      return existing;
    }

    const created = await AccountRepository.create({
      ownerUserId: userId,
      telegramUserId: target.telegramUserId,
      username: target.username,
      firstName: target.firstName,
      lastName: target.lastName,
      displayName: [target.firstName, target.lastName].filter(Boolean).join(" ") || target.username,
      label: label || "Other",
      notes,
    });

    return created;
  }

  static async stopTracking(accountId: string) {
    return await AccountRepository.updateStatus(accountId, "stopped", new Date());
  }

  static async resumeTracking(accountId: string) {
    return await AccountRepository.updateStatus(accountId, "active", null);
  }

  static async deleteAccount(accountId: string) {
    return await AccountRepository.delete(accountId);
  }
}
