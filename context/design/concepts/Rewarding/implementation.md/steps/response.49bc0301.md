---
timestamp: 'Thu Oct 23 2025 18:09:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_180926.91731fc9.md]]'
content_id: 49bc03011bad403bf8fe783984ec2a80b4e2f78049a55d6e4d6ebe906b655e7c
---

# response:

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

// Helper type for Avatar rarity
type Rarity = "common" | "rare" | "epic" | "legendary";

// Declare collection prefix, use concept name
const PREFIX = "Rewarding" + ".";

// Generic types of this concept
type User = ID;

/**
 * a set of Rewards with
 *     a user User
 *     a points Number
 *     a set of Avatars
 */
interface Rewards {
  _id: User; // Using User ID as the primary key for rewards
  points: number;
  avatars: Avatar[];
}

/**
 * a set of Avatars with
 *     a Name String
 *     a Rarity {common, rare, epic, legendary}
 *     a set of StatAffinity with
 *         a stat String {HP, Stamina, Strength, Agility, Intelligence}
 *         a number Number
 */
interface Avatar {
  name: string;
  rarity: Rarity;
  statAffinity: StatAffinity[];
}

interface StatAffinity {
  stat: "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";
  number: number;
}

// This would typically be managed by another concept, e.g., UserStatsConcept
// For the purpose of this example, we'll assume a mock function to get user stats.
// In a real scenario, you'd likely query a UserStatsConcept.
async function getUserStats(user: User): Promise<Record<string, number>> {
  // Mock implementation: return some stats.
  // In a real app, this would query a UserStatsConcept.
  console.log(`Mock: Getting stats for user ${user}`);
  return {
    HP: Math.floor(Math.random() * 100),
    Stamina: Math.floor(Math.random() * 100),
    Strength: Math.floor(Math.random() * 100),
    Agility: Math.floor(Math.random() * 100),
    Intelligence: Math.floor(Math.random() * 100),
  };
}

// This would typically be managed by another concept, e.g., AllAvatarsConcept
// For the purpose of this example, we'll assume a mock function to get all possible avatars.
async function getAllAvatars(): Promise<Avatar[]> {
  // Mock implementation: return a predefined list of avatars.
  // In a real app, this would query a concept that holds all defined avatars.
  console.log("Mock: Getting all available avatars");
  return [
    { name: "Beginner's Blade", rarity: "common", statAffinity: [{ stat: "Strength", number: 10 }] },
    { name: "Swift Boots", rarity: "common", statAffinity: [{ stat: "Agility", number: 15 }] },
    { name: "Iron Skin", rarity: "rare", statAffinity: [{ stat: "HP", number: 20 }] },
    { name: "Mystic Robe", rarity: "rare", statAffinity: [{ stat: "Intelligence", number: 25 }] },
    { name: "Berserker's Axe", rarity: "epic", statAffinity: [{ stat: "Strength", number: 30 }] },
    { name: "Dragon's Breath", rarity: "epic", statAffinity: [{ stat: "HP", number: 40 }, { stat: "Strength", number: 20 }] },
    { name: "Celestial Helm", rarity: "legendary", statAffinity: [{ stat: "Intelligence", number: 50 }, { stat: "Agility", number: 30 }] },
    { name: "Phoenix Feather", rarity: "legendary", statAffinity: [{ stat: "HP", number: 50 }, { stat: "Stamina", number: 40 }] },
  ];
}

export default class RewardingConcept {
  rewards: Collection<Rewards>;

  constructor(private readonly db: Db) {
    this.rewards = this.db.collection(PREFIX + "rewards");
  }

  /**
   * Initialize rewards for a new user.
   * @param user The user ID.
   */
  async initializeRewards({ user }: { user: User }): Promise<Empty> {
    // requires user exists
    // effect add user to Rewards with Points initialized to 0 and with no avatars
    await this.rewards.insertOne({
      _id: user,
      points: 0,
      avatars: [],
    });
    return {};
  }

  /**
   * Earn points for a user.
   * @param user The user ID.
   * @param points The number of points to earn.
   */
  async earnPoints({ user, points }: { user: User; points: number }): Promise<Empty> {
    // requires user exists
    // effect increases user’s point balance
    const result = await this.rewards.updateOne(
      { _id: user },
      { $inc: { points: points } }
    );

    if (result.matchedCount === 0) {
      // If user doesn't exist in rewards, initialize them first (or throw an error if user must exist elsewhere)
      console.warn(`User ${user} not found in rewards, initializing.`);
      await this.initializeRewards({ user });
      await this.rewards.updateOne(
        { _id: user },
        { $inc: { points: points } }
      );
    }

    return {};
  }

  /**
   * Spend points and get a random avatar.
   * @param user The user ID.
   * @param cost The cost of the avatar.
   * @returns The obtained avatar.
   */
  async spendPoints({ user, cost }: { user: User; cost: number }): Promise<{ avatar: Avatar } | { error: string }> {
    // requires user exists and user.Points ≥ cost
    const userReward = await this.rewards.findOne({ _id: user });

    if (!userReward) {
      return { error: "User not found in rewards." };
    }

    if (userReward.points < cost) {
      return { error: "Insufficient points." };
    }

    // effect deducts points and randomly assigns avatar by rarity;
    // the set of avatars available is from getAvailableAvatars;
    // adds avatar to user’s Avatars

    // Deduct points
    await this.rewards.updateOne(
      { _id: user },
      { $inc: { points: -cost } }
    );

    // Get available avatars based on user stats
    const userStats = await getUserStats(user); // Mock call
    const allAvailableAvatars = await getAllAvatars(); // Mock call

    const unlockedAvatars = allAvailableAvatars.filter(avatar => {
      for (const affinity of avatar.statAffinity) {
        if (userStats[affinity.stat] === undefined || userStats[affinity.stat] < affinity.number) {
          return false;
        }
      }
      return true;
    });

    if (unlockedAvatars.length === 0) {
      return { error: "No avatars available for current stats." };
    }

    // Select a random avatar from the unlocked ones
    const randomIndex = Math.floor(Math.random() * unlockedAvatars.length);
    const obtainedAvatar = unlockedAvatars[randomIndex];

    // Add the obtained avatar to the user's collection
    await this.rewards.updateOne(
      { _id: user },
      { $push: { avatars: obtainedAvatar } }
    );

    return { avatar: obtainedAvatar };
  }

  /**
   * List all avatars owned by a user.
   * @param user The user ID.
   * @returns A set of avatars owned by the user.
   */
  async listAvatars({ user }: { user: User }): Promise<{ avatars: Avatar[] }> {
    // requires user exists
    // effect returns all avatars owned by user
    const userReward = await this.rewards.findOne({ _id: user });

    if (!userReward) {
      return { avatars: [] };
    }

    return { avatars: userReward.avatars };
  }

  /**
   * Get avatars available for a user based on their stats.
   * @param user The user ID.
   * @returns A set of avatars the user has requirements met for.
   */
  async getAvailableAvatars({ user }: { user: User }): Promise<{ avatars: Avatar[] }> {
    // requires user exists
    // effect for each avatar that exists, add it to the set of avatars to be returned
    // if the user's stats indicate a completed number greater than or equal to the number in the corresponding StatAffinity map for each stat in that map;
    // this indicates that the user has met the requirements to unlock that avatar

    const userStats = await getUserStats(user); // Mock call
    const allAvatarsList = await getAllAvatars(); // Mock call

    const availableForUser = allAvatarsList.filter(avatar => {
      for (const affinity of avatar.statAffinity) {
        if (userStats[affinity.stat] === undefined || userStats[affinity.stat] < affinity.number) {
          return false;
        }
      }
      return true;
    });

    return { avatars: availableForUser };
  }
}
```
