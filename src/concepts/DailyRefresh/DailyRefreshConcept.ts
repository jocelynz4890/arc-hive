import { Empty } from "@utils/types.ts";

/**
 * DailyRefresh concept - modular concept for triggering daily refresh.
 * This concept doesn't import other concepts - maintains modularity.
 */
export default class DailyRefreshConcept {
  constructor(db: unknown) {
    // This concept doesn't need database or collections - it's a trigger
  }

  /**
   * Trigger action for daily refresh.
   * This will be caught by syncs that orchestrate the refresh process.
   * Requires a secret for security.
   * @param secret The daily refresh secret from environment
   * @returns Empty or error
   */
  async trigger({ secret }: { secret: string }): Promise<{ success: boolean } | { error: string }> {
    const expectedSecret = Deno.env.get("DAILY_REFRESH_SECRET") || "change-me-in-production";
    
    if (secret !== expectedSecret) {
      return { error: "Invalid daily refresh secret" };
    }
    
    console.log("Daily refresh triggered");
    return { success: true };
  }
}
