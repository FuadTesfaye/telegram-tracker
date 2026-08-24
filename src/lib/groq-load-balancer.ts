import { env } from "./env";
import { retryWithBackoff } from "./resilience";

interface GroqKeyStatus {
  key: string;
  index: number;
  isAvailable: boolean;
  rateLimitedUntil: number;
  consecutiveErrors: number;
  totalCalls: number;
}

class GroqLoadBalancer {
  private keys: GroqKeyStatus[] = [];
  private currentKeyIndex = 0;

  constructor() {
    const rawKeys = [
      env.GROQ_API_KEY_1,
      env.GROQ_API_KEY_2,
      env.GROQ_API_KEY_3,
      env.GROQ_API_KEY_4,
    ].filter((k): k is string => Boolean(k && k.trim().length > 0));

    this.keys = rawKeys.map((key, index) => ({
      key,
      index,
      isAvailable: true,
      rateLimitedUntil: 0,
      consecutiveErrors: 0,
      totalCalls: 0,
    }));
  }

  /**
   * Retrieves the next active and healthy Groq API key.
   */
  public getNextKey(): string | null {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const availableKeys = this.keys.filter((k) => k.rateLimitedUntil <= now);

    if (availableKeys.length === 0) {
      // Find the one that resets soonest
      const soonest = [...this.keys].sort((a, b) => a.rateLimitedUntil - b.rateLimitedUntil)[0];
      return soonest?.key || null;
    }

    const selected = availableKeys[this.currentKeyIndex % availableKeys.length];
    this.currentKeyIndex++;
    selected.totalCalls++;
    return selected.key;
  }

  /**
   * Marks a key as rate-limited with a backoff cooldown.
   */
  public markRateLimited(key: string, cooldownMs = 60000) {
    const target = this.keys.find((k) => k.key === key);
    if (target) {
      target.rateLimitedUntil = Date.now() + cooldownMs;
      target.consecutiveErrors++;
    }
  }

  /**
   * Executes a Groq API completion request with multi-key failover and automatic retry.
   */
  public async executeWithFailover(
    prompt: string,
    systemPrompt = "You are a witty, analytical Telegram activity expert.",
    model = "llama-3.3-70b-versatile"
  ): Promise<string | null> {
    if (this.keys.length === 0) return null;

    return retryWithBackoff(
      async () => {
        const apiKey = this.getNextKey();
        if (!apiKey) {
          throw new Error("No available Groq API keys");
        }

        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
              ],
              temperature: 0.8,
              max_tokens: 300,
            }),
          });

          if (res.status === 429) {
            this.markRateLimited(apiKey, 45000);
            throw new Error("Groq API rate limit reached (HTTP 429)");
          }

          if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq API error HTTP ${res.status}: ${errText}`);
          }

          const data = await res.json();
          return data.choices?.[0]?.message?.content?.trim() || null;
        } catch (err: any) {
          if (err.message?.includes("429")) {
            this.markRateLimited(apiKey, 45000);
          }
          throw err;
        }
      },
      {
        maxRetries: Math.max(2, this.keys.length),
        initialDelayMs: 150,
        maxDelayMs: 2000,
      }
    );
  }

  public getStats() {
    const now = Date.now();
    return {
      totalKeysConfigured: this.keys.length,
      activeKeys: this.keys.filter((k) => k.rateLimitedUntil <= now).length,
      keys: this.keys.map((k) => ({
        index: k.index,
        isRateLimited: k.rateLimitedUntil > now,
        resetsInSecs: Math.max(0, Math.ceil((k.rateLimitedUntil - now) / 1000)),
        totalCalls: k.totalCalls,
      })),
    };
  }
}

export const groqLoadBalancer = new GroqLoadBalancer();
