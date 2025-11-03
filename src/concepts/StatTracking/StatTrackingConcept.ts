import { Collection, Db } from "npm:mongodb";
import { freshID } from "@utils/database.ts"; // For generating MongoDB _ids

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
type User = string;

/**
 * Represents the numerical progress within a stat.
 */
interface StatProgress {
  completed: number; // Changed to number for clarity, assuming backend uses JS numbers
  incompleted: number; // Changed to number for clarity
}

/**
 * Represents the state for a specific user's stats.
 * The _id will be a MongoDB ObjectId but treated as string externally for User.
 */
interface Stats {
  _id: string; // MongoDB ObjectId type for internal storage
  user: User; // Explicitly store the user string ID
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
   * @param user The string ID of the user.
   * @param stat The name of the stat to update. Must be one of HP, Stamina, Strength, Agility, Intelligence.
   * @param delta The amount to increase the completed task count by.
   * @returns The updated stats for the user, or an error object if something goes wrong.
   */
  async updateStatWithCompletedTask({
    user,
    stat,
    delta,
  }: {
    user: User;
    stat: string;
    delta: number;
  }): Promise<Stats | { error: string }> {
    if (!VALID_STATS.includes(stat)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    // Dynamically construct the field path for MongoDB update
    const statFieldPath = `${stat.toLowerCase()}.completed`;

    const result = await this.statsCollection.findOneAndUpdate(
      { user },
      { $inc: { [statFieldPath]: delta } },
      { returnDocument: "after" }
    );

    if (!result) return { error: `User with ID ${user} not found. Please initialize stats first.` };
    return result; 

  }

  /**
   * Updates a user's stat by increasing its incompleted task count.
   * @param user The string ID of the user.
   * @param stat The name of the stat to update. Must be one of HP, Stamina, Strength, Agility, Intelligence.
   * @param delta The amount to increase the incompleted task count by.
   * @returns The updated stats for the user, or an error object if something goes wrong.
   */
  async updateStatWithIncompleteTask({
    user,
    stat,
    delta,
  }: {
    user: User;
    stat: string;
    delta: number;
  }): Promise<Stats | { error: string }> {
    if (!VALID_STATS.includes(stat)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    const statFieldPath = `${stat.toLowerCase()}.incompleted`;

    const result = await this.statsCollection.findOneAndUpdate(
      { user },
      { $inc: { [statFieldPath]: delta } },
      { returnDocument: "after" }
    );

    if (!result) return { error: `User with ID ${user} not found. Please initialize stats first.` };
    return result; 
  }

  /**
   * Retrieves the current stat values for a given user.
   * @param user The string ID of the user.
   * @returns The stats for the user, or an error object if the user is not found.
   */
  async getStats({ user }: { user: User }): Promise<Stats | { error: string }> {
    const stats = await this.statsCollection.findOne({ user });
    if (!stats) {
      return { error: `User with ID ${user} not found.` };
    }
    return stats;
  }

  /**
   * Initializes stats for a new user with all counts set to 0.
   * @param user The string ID of the user to initialize stats for.
   * @returns The newly created stats object for the user.
   */
  async initializeStats({ user }: { user: User }): Promise<Stats> {
    const initialStats: Omit<Stats, "_id"> = {
      user,
      hp: { completed: 0, incompleted: 0 },
      stamina: { completed: 0, incompleted: 0 },
      strength: { completed: 0, incompleted: 0 },
      agility: { completed: 0, incompleted: 0 },
      intelligence: { completed: 0, incompleted: 0 },
    };

    const result = await this.statsCollection.updateOne(
      { user },
      {
        $setOnInsert: { _id: freshID() }, // only set _id if inserting
        $set: initialStats,               // set the rest of the fields
      },
      { upsert: true }
    );

    // Retrieve the stats after upsert
    const stats = await this.statsCollection.findOne({ user });
    return stats!;
  }

  /**
   * Batch update stats for multiple users based on completion status.
   * Internal action for batch daily refresh processing.
   * @param updates Array of stat updates with user ID, stat name, and whether completed
   */
  async batchUpdateStats({
    updates
  }: {
    updates: Array<{ user: User; stat: string; completed: boolean }>
  }): Promise<{ updated: number }> {
    for (const update of updates) {
      if (update.completed) {
        await this.updateStatWithCompletedTask({ user: update.user, stat: update.stat, delta: 1 });
      } else {
        await this.updateStatWithIncompleteTask({ user: update.user, stat: update.stat, delta: 1 });
      }
    }
    return { updated: updates.length };
  }

}
