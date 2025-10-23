import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

const PREFIX = "Rewarding" + ".";

// Generic types of this concept
type User = ID;
export type Avatar = ID;

// Rarity enum for convenience
export type Rarity = "common" | "rare" | "epic" | "legendary";

/**
 * a set of Rewards with
 *   a user User
 *   a points Number
 *   a set of Avatars
 */
interface Reward {
  _id: User; // User ID is the primary key for rewards
  points: number;
  ownedAvatars: Avatar[]; // Stores IDs of owned avatars
}

/**
 * a set of Avatars with
 *   a Name String
 *   a Rarity {common, rare, epic, legendary}
 *   a set of StatAffinity with
 *     a stat String {HP, Stamina, Strength, Agility, Intelligence}
 *     a number Number
 */
interface AvatarDefinition {
  _id: Avatar; // Avatar definition ID
  name: string;
  rarity: Rarity;
  statAffinity: {
    stat: "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";
    value: number;
  }[];
}

export default class RewardingConcept {
  rewards: Collection<Reward>;
  avatarDefinitions: Collection<AvatarDefinition>;

  // Predefined chances for rarities
  private readonly RARITY_CHANCES: Record<Rarity, number> = {
    common: 65,
    rare: 25,
    epic: 9.5,
    legendary: 0.5,
  };

  constructor(private readonly db: Db) {
    this.rewards = this.db.collection(PREFIX + "rewards");
    this.avatarDefinitions = this.db.collection(PREFIX + "avatarDefinitions");
  }

  /**
   * Initializes rewards for a user.
   * @param user The ID of the user to initialize rewards for.
   */
  async initializeRewards({ user }: { user: User }): Promise<Empty> {
    // Check if user already exists to avoid duplicates (conceptually, user exists)
    const existingReward = await this.rewards.findOne({ _id: user });
    if (existingReward) {
      console.warn(`Rewards already initialized for user: ${user}`);
      return {};
    }

    await this.rewards.insertOne({
      _id: user,
      points: 0,
      ownedAvatars: [],
    });
    return {};
  }

  /**
   * Awards points to a user.
   * @param user The ID of the user to award points to.
   * @param points The number of points to award.
   */
  async earnPoints({
    user,
    points,
  }: {
    user: User;
    points: number;
  }): Promise<Empty| {error?: string}> {
    if (points < 0) {
      return { error: "Cannot earn negative points." };
    }

    const result = await this.rewards.updateOne(
      { _id: user },
      { $inc: { points: points } },
    );

    if (result.matchedCount === 0) {
      return { error: `User ${user} not found.` };
    }

    return {};
  }

  /**
   * Lists all avatars owned by a user.
   * @param user The ID of the user.
   * @returns A dictionary containing an array of owned avatar IDs.
   */
  async listAvatars({ user }: { user: User }): Promise<{ avatars: Avatar[]; error?: string }> {
    const reward = await this.rewards.findOne({ _id: user });

    if (!reward) {
      return { avatars: [], error: `User ${user} not found.` };
    }

    // We return the IDs of owned avatars. To get full avatar details,
    // another concept or a query on avatarDefinitions would be needed.
    return { avatars: reward.ownedAvatars };
  }

  /**
   * Returns the percentage chance associated with a given rarity.
   * @param rarity The rarity level.
   * @returns A dictionary containing the chance percentage.
   */
  async getRarity({
    rarity,
  }: {
    rarity: Rarity;
  }): Promise<{ chance: number; error?: string }> {
    if (!(rarity in this.RARITY_CHANCES)) {
      return { chance: 0, error: `Invalid rarity: ${rarity}` };
    }
    return { chance: this.RARITY_CHANCES[rarity] };
  }

  /**
   * Picks a random avatar from a list of available avatar definitions, weighted by rarity.
   * The action receives avatar *definitions* or their IDs and fetches them.
   * We'll fetch definitions based on the provided IDs.
   *
   * @param availableAvatarIds An array of IDs of available avatar definitions.
   * @returns A dictionary containing the ID of the randomly picked avatar.
   */
  async pickRandomAvatar({
    availableAvatarIds,
  }: {
    availableAvatarIds: Avatar[];
  }): Promise<{ avatar: Avatar; error?: string }> {
    if (!availableAvatarIds || availableAvatarIds.length === 0) {
      return { avatar: "" as ID, error: "No available avatars to pick from." }; // Return a zero-value ID or handle appropriately
    }

    const avatarDefinitions = await this.avatarDefinitions
      .find({ _id: { $in: availableAvatarIds } })
      .toArray();

    if (avatarDefinitions.length === 0) {
      return { avatar: "" as ID, error: "None of the provided avatar IDs are valid definitions." };
    }

    // Calculate total weight for normalization
    let totalWeight = 0;
    const weightedAvatars = avatarDefinitions.map((def) => {
      const chance = this.RARITY_CHANCES[def.rarity];
      totalWeight += chance;
      return { avatarId: def._id, chance: chance };
    });

    if (totalWeight === 0) {
      return { avatar: "" as ID, error: "No valid rarities found for available avatars." };
    }

    // Pick a random number between 0 and totalWeight
    const randomPick = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const weightedAvatar of weightedAvatars) {
      cumulativeWeight += weightedAvatar.chance;
      if (randomPick <= cumulativeWeight) {
        return { avatar: weightedAvatar.avatarId };
      }
    }

    // Fallback: If somehow no avatar was picked (should not happen with correct logic)
    // return the last avatar definition's ID as a fallback.
    return { avatar: weightedAvatars[weightedAvatars.length - 1].avatarId };
  }

  // --- Helper Queries (for verification and potential use by syncs) ---

  /**
   * Retrieves a user's reward details.
   * @param user The ID of the user.
   * @returns The reward details for the user.
   */
  async _getRewardDetails(user: User): Promise<Reward | null> {
    return this.rewards.findOne({ _id: user });
  }

  /**
   * Retrieves the definition of a specific avatar.
   * @param avatarId The ID of the avatar definition.
   * @returns The avatar definition.
   */
  async _getAvatarDefinition(avatarId: Avatar): Promise<AvatarDefinition | null> {
    return this.avatarDefinitions.findOne({ _id: avatarId });
  }

  /**
   * Checks if a user exists in the rewards system.
   * @param user The ID of the user.
   * @returns True if the user exists, false otherwise.
   */
  async _userExists(user: User): Promise<boolean> {
    const reward = await this.rewards.findOne({ _id: user });
    return !!reward;
  }
}