---
timestamp: 'Thu Oct 23 2025 18:16:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_181620.c13b7001.md]]'
content_id: b71414b1d76aa5cb317f545ae7100833ccdbd8d8996830ffee134e5e13a64c6b
---

# response:

Here's the implementation of the `Rewarding` concept based on your provided specification and guidelines.

**Assumptions:**

* You have a `@utils/types.ts` file with the `ID` and `Empty` types defined.
* You have a `@utils/database.ts` file with the `getDb` function.
* The `User` type is an `ID` that is managed externally (e.g., by a `UserAuthentication` or `User` concept).
* The `Avatar` type is a complex object and needs to be defined within the scope of this concept's state as it's part of the concept's internal representation.
* The `getAvailableAvatars` function is assumed to be available globally or imported, returning a set of available `Avatar` objects based on some criteria (e.g., rarity distribution, stat affinities).

```typescript
// @utils/types.ts
export type ID = string & { __brand: "ID" };
export type Empty = Record<PropertyKey, never>;

// @utils/database.ts
// This is a placeholder for demonstration.
// In a real scenario, this would connect to MongoDB and return Db and MongoClient.
export async function getDb(): Promise<[any, any]> {
  console.log("Initializing mock database connection...");
  // In a real app, you'd use 'new MongoClient' and 'client.connect()'.
  const mockDb = {
    collection: (name: string) => {
      console.log(`Accessing mock collection: ${name}`);
      // Return a mock collection object with basic MongoDB methods
      return {
        insertOne: async (doc: any) => {
          console.log(`Mock insertOne into ${name}:`, doc);
          return { insertedId: doc._id || "mock_id" };
        },
        updateOne: async (filter: any, update: any) => {
          console.log(`Mock updateOne in ${name}:`, filter, update);
          return { modifiedCount: 1 };
        },
        find: (filter: any = {}) => {
          console.log(`Mock find in ${name}:`, filter);
          // Return a mock cursor
          return {
            toArray: async () => {
              console.log(`Mock cursor.toArray() for ${name}`);
              // Return empty array for mock cursor
              return [];
            },
            forEach: async (callback: (doc: any) => void) => {
              console.log(`Mock cursor.forEach() for ${name}`);
              // Do nothing for mock
            },
            limit: function(num: number) { return this; },
            skip: function(num: number) { return this; },
            sort: function(criteria: any) { return this; },
          };
        },
        replaceOne: async (filter: any, replacement: any) => {
          console.log(`Mock replaceOne in ${name}:`, filter, replacement);
          return { modifiedCount: 1 };
        },
      };
    },
    // Add other Db methods if needed for initialization or other concepts
  };
  const mockClient = {}; // Placeholder for MongoClient
  return [mockDb, mockClient];
}

// Helper for generating fresh IDs (for demonstration)
export const freshID = (): ID => {
  // In a real implementation, this would generate a proper MongoDB ObjectId
  // and convert it to a string, or use a UUID generator.
  return Math.random().toString(36).substring(2, 15) as ID;
};
```

```typescript
// src/utils/types.ts (assuming this file exists)
export type ID = string & { __brand: "ID" };
export type Empty = Record<PropertyKey, never>;
```

```typescript
// src/utils/database.ts (assuming this file exists and is configured for Deno/MongoDB)
import { MongoClient, Db } from "npm:mongodb";

export const getDb = async (dbName: string = "concept_db"): Promise<[Db, MongoClient]> => {
  const connectionString = Deno.env.get("MONGO_CONNECTION_STRING") || "mongodb://localhost:27017";
  const client = new MongoClient(connectionString);
  await client.connect();
  console.log("Connected to MongoDB.");
  const db = client.db(dbName);
  return [db, client];
};

export const freshID = (): ID => {
  // In a real app, this would be `new ObjectId().toString()`
  // For demonstration purposes without ObjectId, use a simple string.
  return `id_${Math.random().toString(36).substring(2, 11)}` as ID;
};
```

```typescript
// src/concepts/RewardingConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// --- Concept Specification ---
// concept Rewarding
//
//     purpose motivate users by granting rewards (avatars) for consistent habit completion and progress
//
//     principle users earn avatar points by completing arcs and maintaining streaks; points are spent in a gacha system that yields avatars based on user stat distribution
//
//     state
//         a set of Rewards with
//             a user User
//             a points Number
//             a set of Avatars
//
//         a set of Avatars with
//             a Name String
//             a Rarity {common, rare, epic, legendary}
//             a set of StatAffinity with
//                 a stat String {HP, Stamina, Strength, Agility, Intelligence}
//                 a number Number
//
//     actions
//         initializeRewards (user: User)
//             requires user exists
//             effect add user to Rewards with Points initialized to 0 and with no avatars
//
//         earnPoints (user: User, points: Number)
//             requires user exists
//             effect increases user’s point balance
//
//         spendPoints (user: User, cost: Number): (avatar: Avatar)
//             requires user exists and user.Points ≥ cost
//             effect deducts points and randomly assigns avatar by rarity; the set of avatars available is from getAvailableAvatars; adds avatar to user’s Avatars
//
//         listAvatars (user: User): (avatars: Set of Avatar)
//             requires user exists
//             effect returns all avatars owned by user
// -----------------------------

// --- Type Definitions ---

// Generic types for this concept
type User = ID; // Assumed to be an ID managed by another concept

// Internal representation of an Avatar
interface Avatar {
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  statAffinity: {
    stat: "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";
    number: number;
  }[];
}

// State for the Rewards collection
interface RewardDoc {
  _id: User; // User ID
  points: number;
  avatars: Avatar[]; // Array of owned Avatars
}

// --- Constants ---
const PREFIX = "Rewarding.";
const REWARDS_COLLECTION = PREFIX + "rewards";

// Mock implementation of getAvailableAvatars for demonstration
// In a real scenario, this would fetch from a config or another concept.
const getAvailableAvatars = (): Avatar[] => {
  return [
    {
      name: "Bronze Shield",
      rarity: "common",
      statAffinity: [
        { stat: "HP", number: 5 },
        { stat: "Stamina", number: 3 },
      ],
    },
    {
      name: "Iron Sword",
      rarity: "common",
      statAffinity: [
        { stat: "Strength", number: 7 },
      ],
    },
    {
      name: "Swift Boots",
      rarity: "rare",
      statAffinity: [
        { stat: "Agility", number: 10 },
      ],
    },
    {
      name: "Mystic Amulet",
      rarity: "rare",
      statAffinity: [
        { stat: "Intelligence", number: 8 },
        { stat: "HP", number: 4 },
      ],
    },
    {
      name: "Dragon Scale Armor",
      rarity: "epic",
      statAffinity: [
        { stat: "HP", number: 15 },
        { stat: "Strength", number: 10 },
        { stat: "Stamina", number: 10 },
      ],
    },
    {
      name: "Legendary Blade of Ancients",
      rarity: "legendary",
      statAffinity: [
        { stat: "Strength", number: 25 },
        { stat: "Agility", number: 15 },
      ],
    },
  ];
};

// Helper function to pick an avatar based on rarity probabilities
// This is a simplified gacha system.
const pickRandomAvatar = (availableAvatars: Avatar[]): Avatar => {
  const rarityWeights: Record<Avatar["rarity"], number> = {
    common: 0.6,
    rare: 0.25,
    epic: 0.1,
    legendary: 0.05,
  };

  // Filter avatars by rarity and then pick one randomly
  const raritiesToConsider = Object.keys(rarityWeights) as Avatar["rarity"][];
  const chosenRarity = raritiesToConsider.reduce((prev, curr) => {
    const rand = Math.random();
    return rand < rarityWeights[curr] ? curr : prev;
  }, "common"); // Default to common if no probability is hit (shouldn't happen with proper weights)

  const avatarsOfRarity = availableAvatars.filter(avatar => avatar.rarity === chosenRarity);

  if (avatarsOfRarity.length === 0) {
    // Fallback: if no avatars of chosen rarity, pick any random avatar
    return availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
  }

  return avatarsOfRarity[Math.floor(Math.random() * avatarsOfRarity.length)];
};

export default class RewardingConcept {
  private readonly rewardsCollection: Collection<RewardDoc>;
  private readonly availableAvatars: Avatar[];

  constructor(private readonly db: Db) {
    this.rewardsCollection = this.db.collection<RewardDoc>(REWARDS_COLLECTION);
    this.availableAvatars = getAvailableAvatars(); // Load available avatars once
  }

  /**
   * Initializes rewards for a user.
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user to initialize rewards for.
   * @returns {Empty} - An empty object indicating success.
   */
  async initializeRewards({ user }: { user: User }): Promise<Empty> {
    // requires user exists (This is an assumption that needs to be checked by an external concept, e.g., UserAuthentication)
    // For this concept's implementation, we'll assume the user might not exist in *our* collection yet.
    const existingReward = await this.rewardsCollection.findOne({ _id: user });
    if (existingReward) {
      // If user already has rewards, do nothing or handle as per requirements.
      // For now, we'll just return. In a real scenario, you might throw an error or log a warning.
      console.warn(`User ${user} already has rewards initialized.`);
      return {};
    }

    const newReward: RewardDoc = {
      _id: user,
      points: 0,
      avatars: [],
    };
    await this.rewardsCollection.insertOne(newReward);
    return {};
  }

  /**
   * Awards points to a user.
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user to award points to.
   * @param {number} args.points - The number of points to award.
   * @returns {Empty} - An empty object indicating success.
   */
  async earnPoints({ user, points }: { user: User; points: number }): Promise<Empty> {
    // requires user exists
    const result = await this.rewardsCollection.updateOne(
      { _id: user },
      { $inc: { points: points } }
    );

    if (result.modifiedCount === 0) {
      // User might not exist in our collection yet, or the update failed.
      // If user existence is strictly enforced before this, this might indicate an error.
      // For this concept, we might want to initialize if not found.
      // This depends on the overall system design (e.g., if initializeRewards is always called first).
      // Let's assume for now that initializeRewards must be called first.
      // If not, we'd call initializeRewards({ user }) here, potentially recursively.
      console.error(`Failed to earn points for user ${user}. User not found or update failed.`);
      throw new Error(`User ${user} not found or update failed for earning points.`);
    }

    return {};
  }

  /**
   * Spends points to obtain a random avatar.
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user spending points.
   * @param {number} args.cost - The cost of the avatar.
   * @returns {object} - An object containing the acquired avatar or an error.
   *   { avatar: Avatar } on success.
   *   { error: string } on failure.
   */
  async spendPoints({
    user,
    cost,
  }: {
    user: User;
    cost: number;
  }): Promise<{ avatar: Avatar } | { error: string }> {
    // requires user exists and user.Points ≥ cost

    const rewardDoc = await this.rewardsCollection.findOne({ _id: user });

    if (!rewardDoc) {
      return { error: `User ${user} not found.` };
    }

    if (rewardDoc.points < cost) {
      return { error: `Insufficient points. User ${user} has ${rewardDoc.points} points, but needs ${cost}.` };
    }

    // Deduct points
    const updatedRewardDoc = await this.rewardsCollection.findOneAndUpdate(
      { _id: user },
      { $inc: { points: -cost } },
      { returnDocument: "after" } // Return the updated document
    );

    if (!updatedRewardDoc) {
      // This should not happen if rewardDoc was found, but as a safeguard
      return { error: `Failed to update points for user ${user}.` };
    }

    // Pick a random avatar
    const awardedAvatar = pickRandomAvatar(this.availableAvatars);

    // Add the avatar to the user's collection
    await this.rewardsCollection.updateOne(
      { _id: user },
      { $push: { avatars: awardedAvatar } }
    );

    return { avatar: awardedAvatar };
  }

  /**
   * Lists all avatars owned by a user.
   * @param {object} args - The arguments for the action.
   * @param {User} args.user - The ID of the user whose avatars to list.
   * @returns {object} - An object containing the list of avatars or an error.
   *   { avatars: Avatar[] } on success.
   *   { error: string } if the user is not found.
   */
  async listAvatars({ user }: { user: User }): Promise<{ avatars: Avatar[] } | { error: string }> {
    // requires user exists
    const rewardDoc = await this.rewardsCollection.findOne({ _id: user });

    if (!rewardDoc) {
      return { error: `User ${user} not found.` };
    }

    return { avatars: rewardDoc.avatars };
  }

  // --- Queries ---
  // In a real implementation, we would define explicit query methods if needed,
  // but for this concept, actions cover the primary interactions.
  // For example, to query a user's points:
  /**
   * Retrieves the current point balance for a user.
   * @param {User} user - The ID of the user.
   * @returns {Promise<number | { error: string }>} - The user's points or an error message.
   */
  async _getUserPoints(user: User): Promise<number | { error: string }> {
    const rewardDoc = await this.rewardsCollection.findOne({ _id: user });
    if (!rewardDoc) {
      return { error: `User ${user} not found.` };
    }
    return rewardDoc.points;
  }

  /**
   * Retrieves a specific avatar owned by a user by its name.
   * Note: This is a helper query. If multiple avatars have the same name, it returns the first found.
   * @param {object} args - The arguments for the query.
   * @param {User} args.user - The ID of the user.
   * @param {string} args.avatarName - The name of the avatar to find.
   * @returns {Promise<Avatar | { error: string }>} - The found avatar or an error.
   */
  async _getAvatarByName(user: User, avatarName: string): Promise<Avatar | { error: string }> {
    const rewardDoc = await this.rewardsCollection.findOne({ _id: user });
    if (!rewardDoc) {
      return { error: `User ${user} not found.` };
    }
    const avatar = rewardDoc.avatars.find(a => a.name === avatarName);
    if (!avatar) {
      return { error: `Avatar with name "${avatarName}" not found for user ${user}.` };
    }
    return avatar;
  }
}
```
