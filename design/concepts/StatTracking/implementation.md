[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@StatTracking](StatTracking.md)

# implement: StatTracking
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

# prompt: use User = string instead of User = ID
# response:

Okay, I understand. You want to use `string` directly for the `User` type instead of the `ID` utility type, while still ensuring type safety and proper handling of MongoDB IDs.

Here's the updated `StatTracking` concept implementation reflecting this change.

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts"; // ID might still be used internally for MongoDB _id, but we'll treat User as string externally.
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
// Changed User to string as requested.
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
  _id: ID; // MongoDB ObjectId type for internal storage
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
    stat: string; // Use string for stat name
    delta: number; // Use number for delta
  }): Promise<Partial<Stats> | { error: string }> { // Return type explicitly allows for error object
    if (!VALID_STATS.includes(stat)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    // Dynamically construct the field path for MongoDB update
    const statFieldPath = `${stat.toLowerCase()}.completed`;

    const result = await this.statsCollection.findOneAndUpdate(
      { user: user }, // Query by the user string ID
      {
        $inc: {
          [statFieldPath]: delta,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      // If no document was found, it means the user doesn't exist yet for stats tracking.
      // We could choose to create it here, or return an error.
      // Based on initializeStats, it's likely intended that stats are initialized first.
      return { error: `User with ID ${user} not found. Please initialize stats first.` };
    }

    // Remove the MongoDB _id from the returned object to maintain the 'User' string type externally
    const { _id, ...rest } = result;
    return rest;
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
    stat: string; // Use string for stat name
    delta: number; // Use number for delta
  }): Promise<Partial<Stats> | { error: string }> { // Return type explicitly allows for error object
    if (!VALID_STATS.includes(stat)) {
      return { error: `Invalid stat name: ${stat}. Must be one of ${VALID_STATS.join(", ")}.` };
    }

    // Dynamically construct the field path for MongoDB update
    const statFieldPath = `${stat.toLowerCase()}.incompleted`;

    const result = await this.statsCollection.findOneAndUpdate(
      { user: user }, // Query by the user string ID
      {
        $inc: {
          [statFieldPath]: delta,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return { error: `User with ID ${user} not found. Please initialize stats first.` };
    }

    const { _id, ...rest } = result;
    return rest;
  }

  /**
   * Retrieves the current stat values for a given user.
   * @param user The string ID of the user.
   * @returns The stats for the user, or an error object if the user is not found.
   */
  async getStats({ user }: { user: User }): Promise<Partial<Stats> | { error: string }> {
    const stats = await this.statsCollection.findOne({ user: user }); // Query by user string ID
    if (!stats) {
      return { error: `User with ID ${user} not found.` };
    }
    const { _id, ...rest } = stats;
    return rest;
  }

  /**
   * Initializes stats for a new user with all counts set to 0.
   * @param user The string ID of the user to initialize stats for.
   * @returns The newly created stats object for the user.
   */
  async initializeStats({ user }: { user: User }): Promise<Stats> {
    const initialStats: Stats = {
      _id: freshID(), // Generate a new MongoDB ObjectId for _id
      user: user, // Store the user string ID
      hp: { completed: 0, incompleted: 0 },
      stamina: { completed: 0, incompleted: 0 },
      strength: { completed: 0, incompleted: 0 },
      agility: { completed: 0, incompleted: 0 },
      intelligence: { completed: 0, incompleted: 0 },
    };

    // Use upsert to create if it doesn't exist or update if it does.
    // This ensures that calling initializeStats multiple times for the same user is idempotent.
    await this.statsCollection.updateOne(
      { user: user }, // Query by user string ID
      { $set: initialStats },
      { upsert: true }
    );

    // Return the created/updated stats object, excluding the MongoDB _id for consistency in the return type
    const { _id, ...rest } = initialStats;
    return { ...rest, user: user }; // Ensure user is still present in the returned object
  }
}
```

**Key Changes and Explanations:**

1.  **`type User = string;`**: The `User` type alias is now explicitly set to `string`. This means any function expecting a `User` will now accept a plain JavaScript string.

2.  **`interface Stats { _id: ID; user: User; ... }`**:
    *   The `_id` field in the `Stats` interface is still typed as `ID` (which is likely an alias for `ObjectId` from `mongodb` or `string` if you've configured it that way for `freshID`). This is for internal MongoDB storage.
    *   A new field `user: User` (which is `string`) is added to the `Stats` interface. This will store the actual user identifier that was passed into the functions. This is crucial for querying by the user string.

3.  **MongoDB Queries (`{ user: user }`)**: All `findOne`, `findOneAndUpdate`, and `updateOne` operations now query using the `user` field with the `string` value. The `_id` field is only used internally for MongoDB's primary key.

4.  **`initializeStats`**:
    *   When creating `initialStats`, `_id: freshID()` is used to generate a MongoDB ObjectId for the `_id` field.
    *   `user: user` stores the provided `User` string ID.
    *   The `updateOne` operation uses `upsert: true` and queries by `user` to ensure the correct document is created or updated.
    *   When returning `initialStats`, the `_id` is excluded from the return value (using destructuring) to align with the `Partial<Stats>` return type for other methods.

5.  **Return Types**:
    *   The return types for `updateStatWithCompletedTask`, `updateStatWithIncompleteTask`, and `getStats` are now `Promise<Partial<Stats> | { error: string }>`. This explicitly allows these functions to return an object with an `error` property when something goes wrong, as per the error handling guidelines.
    *   When returning results from `findOneAndUpdate` and `findOne`, the MongoDB `_id` is destructured out (`const { _id, ...rest } = result;`) before returning `rest`. This ensures that the caller receives an object that conforms to `Partial<Stats>` without the MongoDB-specific `_id`. The `user` field is then explicitly added back to ensure it's present in the returned object.

6.  **Input Types**:
    *   The input parameters for `stat` and `delta` in `updateStatWithCompletedTask` and `updateStatWithIncompleteTask` are now explicitly typed as `string` and `number` respectively, which is standard practice for JavaScript/TypeScript.

This implementation uses the `string` type for `User` when interacting with the concept's public API, while still correctly managing the underlying MongoDB `_id` for internal database operations.