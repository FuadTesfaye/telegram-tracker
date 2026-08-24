import type { TelegramTarget, TelegramPresence } from "@/types";

export type PresenceCallback = (
  target: TelegramTarget,
  presence: TelegramPresence
) => Promise<void>;

export interface TelegramTrackingClient {
  /**
   * Initializes and authenticates the Telegram MTProto client session
   */
  connect(): Promise<void>;

  /**
   * Closes the MTProto client session safely
   */
  disconnect(): Promise<void>;

  /**
   * Resolves a public username (e.g. "alice", "@alice") to a stable Telegram user target
   */
  resolveUsername(username: string): Promise<TelegramTarget | null>;

  /**
   * Queries the immediate presence status of a target
   */
  getStatus(target: TelegramTarget): Promise<TelegramPresence>;

  /**
   * Starts active observation / presence tracking for a target
   */
  startTracking(
    target: TelegramTarget,
    onPresenceChange: PresenceCallback
  ): Promise<void>;

  /**
   * Stops active observation for a target
   */
  stopTracking(target: TelegramTarget): Promise<void>;

  /**
   * Check connection status
   */
  isConnected(): boolean;
}
