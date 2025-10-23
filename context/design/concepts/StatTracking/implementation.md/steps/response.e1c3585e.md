---
timestamp: 'Thu Oct 23 2025 06:02:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_060206.4ab06e9b.md]]'
content_id: e1c3585ec35bed1aa7e88815d3f8bcbe8166cff4af80a6b915ea909f7c44a09f
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

// Define constants for stat names for clarity and maintainability
const HP = "HP";
const STAMINA = "Stamina";
const STRENGTH = "Strength";
const AGILITY = "Agility";
const INTELLIGENCE = "Intelligence";
const VALID_STATS = [HP, STAMINA, STRENGTH, AGILITY, INTELLIGENCE];

// Declare collection prefix, use concept name
const PREFIX = "StatTracking" + ".";

// Generic types of this concept
type User = ID;

/**
 * Represents the numerical progress within a stat.
 */
interface StatProgress {
  completed: Number;
  incompleted: Number;
}

/**
 * Represents the state for a specific user's stats.
 */
interface Stats {
  _id: User; // User ID as the document identifier
  hp: StatProgress;
  stamina: StatProgress;
  strength: StatProgress;
  agility: StatProgress;
  intelligence: StatProgress;
}

export default class StatTrackingConcept {
  private statsCollection: Collection<Stats>;

  constructor(private readonly db: Db) {
    this.statsCollection = this.db.collection(PREFIX + "stats");
  }

  /**
   * Updates a user's stat by increasing its completed task count.
   * @param user The ID of the user.
   * @param stat The name of the stat to update. Must be one of HP, Stamina, Strength, Agility, Intelligence.
   * @param delta The amount to increase the completed task count by.
   * @returns The updated stats for the user.
   */
  async updateStatWithCompletedTask({
    user,
    stat,
    delta,
  }: {
    user: User;
    stat: String;
    delta: Number;
  }): Promise<Partial<Stats>> {
    if (!VALID_STATS.includes(stat as string)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    const result = await this.statsCollection.findOneAndUpdate(
      { _id: user },
      {
        $inc: {
          [`${stat.toLowerCase()}.completed`]: delta as number,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return { error: `User with ID ${user} not found.` };
    }

    return result;
  }

  /**
   * Updates a user's stat by increasing its incompleted task count.
   * @param user The ID of the user.
   * @param stat The name of the stat to update. Must be one of HP, Stamina, Strength, Agility, Intelligence.
   * @param delta The amount to increase the incompleted task count by.
   * @returns The updated stats for the user.
   */
  async updateStatWithIncompleteTask({
    user,
    stat,
    delta,
  }: {
    user: User;
    stat: String;
    delta: Number;
  }): Promise<Partial<Stats>> {
    if (!VALID_STATS.includes(stat as string)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    const result = await this.statsCollection.findOneAndUpdate(
      { _id: user },
      {
        $inc: {
          [`${stat.toLowerCase()}.incompleted`]: delta as number,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return { error: `User with ID ${user} not found.` };
    }

    return result;
  }

  /**
   * Retrieves the current stat values for a given user.
   * @param user The ID of the user.
   * @returns The stats for the user, or an error if the user is not found.
   */
  async getStats({ user }: { user: User }): Promise<Partial<Stats>> {
    const stats = await this.statsCollection.findOne({ _id: user });
    if (!stats) {
      return { error: `User with ID ${user} not found.` };
    }
    return stats;
  }

  /**
   * Initializes stats for a new user with all counts set to 0.
   * @param user The ID of the user to initialize stats for.
   * @returns The newly created stats object for the user.
   */
  async initializeStats({ user }: { user: User }): Promise<Stats> {
    const initialStats: Stats = {
      _id: user,
      hp: { completed: 0, incompleted: 0 },
      stamina: { completed: 0, incompleted: 0 },
      strength: { completed: 0, incompleted: 0 },
      agility: { completed: 0, incompleted: 0 },
      intelligence: { completed: 0, incompleted: 0 },
    };

    // We assume initializeStats might be called multiple times,
    // so we use upsert to create if it doesn't exist or update if it does.
    // For a strict "initialization" that only works once, you'd check existence first.
    await this.statsCollection.updateOne(
      { _id: user },
      { $set: initialStats },
      { upsert: true }
    );

    return initialStats;
  }
}
```
