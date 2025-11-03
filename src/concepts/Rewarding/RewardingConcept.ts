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
  currentAvatar?: Avatar; // Stores the currently selected avatar ID
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
   * Gets the points for a user.
   * @param user The ID of the user.
   * @returns The user's points.
   */
  async getPoints({ user }: { user: User }): Promise<{ points: number; error?: string }> {
    const reward = await this.rewards.findOne({ _id: user });

    if (!reward) {
      return { points: 0, error: `User ${user} not found.` };
    }

    return { points: reward.points || 0 };
  }

  /**
   * Spends points from a user's balance.
   * @param user The ID of the user.
   * @param points The number of points to spend.
   * @returns Success or error.
   */
  async spendPoints({
    user,
    points,
  }: {
    user: User;
    points: number;
  }): Promise<Empty | { error?: string }> {
    if (points < 0) {
      return { error: "Cannot spend negative points." };
    }

    const reward = await this.rewards.findOne({ _id: user });
    
    if (!reward) {
      return { error: `User ${user} not found.` };
    }

    if (reward.points < points) {
      return { error: "Insufficient points." };
    }

    await this.rewards.updateOne(
      { _id: user },
      { $inc: { points: -points } }
    );

    return {};
  }

  /**
   * Adds an avatar to a user's owned avatars list.
   * @param user The ID of the user.
   * @param avatar The ID of the avatar to add.
   * @returns Success or error.
   */
  async addAvatar({
    user,
    avatar,
  }: {
    user: User;
    avatar: Avatar;
  }): Promise<Empty | { error?: string }> {
    const reward = await this.rewards.findOne({ _id: user });
    
    if (!reward) {
      return { error: `User ${user} not found.` };
    }

    // Check if avatar is already owned
    if (reward.ownedAvatars.includes(avatar)) {
      return {}; // Already owned, silently succeed
    }

    await this.rewards.updateOne(
      { _id: user },
      { $push: { ownedAvatars: avatar } }
    );

    return {};
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
      return { avatar: "" as ID, error: "No available avatars to pick from." };
    }
  
    // Fetch avatar definitions
    const avatarDefinitions = await this.avatarDefinitions
      .find({ _id: { $in: availableAvatarIds } })
      .toArray();
  
    if (avatarDefinitions.length === 0) {
      return { avatar: "" as ID, error: "None of the provided avatar IDs are valid definitions." };
    }
  
    // Step 1: Pick rarity based on global chances
    const randomRarity = (() => {
      const roll = Math.random() * 100; // total = 100%
      let cumulative = 0;
      for (const [rarity, chance] of Object.entries(this.RARITY_CHANCES)) {
        cumulative += chance;
        if (roll <= cumulative) return rarity as Rarity;
      }
      return "common"; // fallback
    })();
  
    // Step 2: Filter avatars of that rarity
    const candidates = avatarDefinitions.filter((a) => a.rarity === randomRarity);
  
    // If none of that rarity are available, fallback to next closest rarity group
    if (candidates.length === 0) {
      // fallback order: legendary → epic → rare → common
      const fallbackOrder: Rarity[] = ["legendary", "epic", "rare", "common"];
      for (const r of fallbackOrder) {
        const group = avatarDefinitions.filter((a) => a.rarity === r);
        if (group.length > 0) {
          return { avatar: group[Math.floor(Math.random() * group.length)]._id };
        }
      }
      return { avatar: "" as ID, error: "No valid avatars found for any rarity." };
    }
  
    // Step 3: Pick a random avatar from the chosen rarity
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    return { avatar: picked._id };
  }

  /**
   * Gets all available avatar IDs that the user has unlocked based on their stats.
   * This should be called from a sync that checks user stats.
   * For now, returns all avatar definitions (will be filtered by stats in sync/frontend).
   * @param user The ID of the user.
   * @returns An array of avatar IDs that are available.
   */
  async getAvailableAvatarIds({ user }: { user: User }): Promise<{ avatarIds: Avatar[]; error?: string }> {
    // Get all avatar definitions
    const allAvatars = await this.avatarDefinitions.find({}).toArray();
    // Return their IDs - frontend will filter based on user stats
    return { avatarIds: allAvatars.map(a => a._id) };
  }

  /**
   * Gets avatar definitions by their names (useful for mapping frontend names to backend IDs).
   * @param names An array of avatar names to look up.
   * @returns An array of avatar definitions matching the names.
   */
  async getAvatarsByName({ names }: { names: string[] }): Promise<{ avatars: AvatarDefinition[]; error?: string }> {
    const avatars = await this.avatarDefinitions
      .find({ name: { $in: names } })
      .toArray();
    return { avatars };
  }

  /**
   * Gets avatar definitions by their IDs (useful for mapping backend IDs to avatar names).
   * @param ids An array of avatar IDs to look up.
   * @returns An array of avatar definitions matching the IDs.
   */
  async getAvatarsByIds({ ids }: { ids: Avatar[] }): Promise<{ avatars: AvatarDefinition[]; error?: string }> {
    const avatars = await this.avatarDefinitions
      .find({ _id: { $in: ids } })
      .toArray();
    return { avatars };
  }

  /**
   * Sets the user's current/active avatar.
   * @param user The ID of the user.
   * @param avatar The ID of the avatar to set as current.
   * @returns Empty object on success, or error object.
   */
  async setCurrentAvatar({ user, avatar }: { user: User; avatar: Avatar }): Promise<Empty | { error?: string }> {
    const reward = await this.rewards.findOne({ _id: user });
    if (!reward) {
      return { error: `User ${user} not found.` };
    }
    
    // Verify the avatar is owned
    if (!reward.ownedAvatars.includes(avatar)) {
      return { error: "Avatar not owned by user." };
    }
    
    await this.rewards.updateOne({ _id: user }, { $set: { currentAvatar: avatar } });
    return {};
  }

  /**
   * Gets the user's current/active avatar.
   * @param user The ID of the user.
   * @returns The current avatar ID, or empty string if not set.
   */
  async getCurrentAvatar({ user }: { user: User }): Promise<{ avatar: Avatar; error?: string }> {
    const reward = await this.rewards.findOne({ _id: user });
    if (!reward) {
      return { avatar: "" as Avatar, error: `User ${user} not found.` };
    }
    
    return { avatar: reward.currentAvatar || (reward.ownedAvatars[0] || ("" as Avatar)) };
  }
  

  // --- Helper Queries (for verification and potential use by syncs) ---

  /**
   * Retrieves a user's reward details.
   * @param user The ID of the user.
   * @returns The reward details for the user.
   */
  async _getRewardDetails({ user }: { user: User }): Promise<Reward | null> {
    return this.rewards.findOne({ _id: user });
  }

  /**
   * Retrieves the definition of a specific avatar.
   * @param avatarId The ID of the avatar definition.
   * @returns The avatar definition.
   */
  async _getAvatarDefinition({ avatarId }: { avatarId: Avatar }): Promise<AvatarDefinition | null> {
    return this.avatarDefinitions.findOne({ _id: avatarId });
  }

  /**
   * Checks if a user exists in the rewards system.
   * @param user The ID of the user.
   * @returns True if the user exists, false otherwise.
   */
  async _userExists({ user }: { user: User }): Promise<boolean> {
    const reward = await this.rewards.findOne({ _id: user });
    return !!reward;
  }

  /**
   * Batch award points to multiple users.
   * Internal action for batch daily refresh processing.
   * @param awards Array of point awards with user ID and points
   */
  async batchAwardPoints({
    awards
  }: {
    awards: Array<{ user: User; points: number }>
  }): Promise<{ awarded: number }> {
    for (const award of awards) {
      await this.earnPoints({ user: award.user, points: award.points });
    }
    return { awarded: awards.length };
  }
}