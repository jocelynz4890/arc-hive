---
timestamp: 'Thu Oct 23 2025 18:46:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_184642.f342b908.md]]'
content_id: 0191b15f36effbea57c654b0111aefdab29b8bc61ac1017f0b309a9e0309d481
---

# file: src/Rewarding/RewardingConcept.ts

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { Empty, ID, asID } from "@utils/types.ts";

const PREFIX = "Rewarding" + ".";

// Generic types of this concept
type User = ID;
type Avatar = ID;

// Rarity enum for convenience
type Rarity = "common" | "rare" | "epic" | "legendary";

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
      // Optionally, you might want to throw an error or log a warning
      // For now, we'll assume the caller ensures user existence and idempotency if needed
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
  }): Promise<Empty> {
    if (points < 0) {
      // While not explicitly in spec, negative points are usually not intended for earning.
      // Treat as an error for robustness.
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
  async listAvatars({ user }: { user: User }): Promise<{ avatars: Avatar[] }> {
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
  }): Promise<{ chance: number }> {
    if (!(rarity in this.RARITY_CHANCES)) {
      return { chance: 0, error: `Invalid rarity: ${rarity}` };
    }
    return { chance: this.RARITY_CHANCES[rarity] };
  }

  /**
   * Picks a random avatar from a list of available avatar definitions, weighted by rarity.
   * This is a simplified implementation assuming `availableAvatars` contains `AvatarDefinition` objects directly or their IDs.
   * For this example, we'll assume `availableAvatars` are IDs and we fetch their definitions.
   *
   * NOTE: The original spec implies `availableAvatars` might be the full Avatar objects,
   * but for a backend service, passing IDs and fetching definitions is more common.
   * Let's assume for now that the action receives avatar *definitions* or their IDs and fetches them.
   * We'll fetch definitions based on the provided IDs.
   *
   * @param availableAvatarIds An array of IDs of available avatar definitions.
   * @returns A dictionary containing the ID of the randomly picked avatar.
   */
  async pickRandomAvatar({
    availableAvatarIds,
  }: {
    availableAvatarIds: Avatar[];
  }): Promise<{ avatar: Avatar }> {
    if (!availableAvatarIds || availableAvatarIds.length === 0) {
      return { avatar: asID(""), error: "No available avatars to pick from." }; // Return a zero-value ID or handle appropriately
    }

    const avatarDefinitions = await this.avatarDefinitions
      .find({ _id: { $in: availableAvatarIds } })
      .toArray();

    if (avatarDefinitions.length === 0) {
      return { avatar: asID(""), error: "None of the provided avatar IDs are valid definitions." };
    }

    // Calculate total weight for normalization
    let totalWeight = 0;
    const weightedAvatars = avatarDefinitions.map((def) => {
      const chance = this.RARITY_CHANCES[def.rarity];
      totalWeight += chance;
      return { avatarId: def._id, chance: chance };
    });

    if (totalWeight === 0) {
      return { avatar: asID(""), error: "No valid rarities found for available avatars." };
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
```

### problem:

The `pickRandomAvatar` action in the specification takes `availableAvatars: set of Avatar` as input. In a typical backend implementation, `Avatar` is an ID, and the actual avatar definition (name, rarity, etc.) is stored elsewhere. The provided `Rewarding` concept spec also has `AvatarDefinition` and a collection for it.

The current implementation of `pickRandomAvatar` correctly uses `availableAvatarIds` as `Avatar[]` (which are IDs) and then fetches the full `AvatarDefinition` objects. However, the original spec's wording implies that `availableAvatars` might refer to a collection of *already defined* avatar objects, which could be interpreted as full definitions.

This could lead to confusion if the caller is expected to pass actual `AvatarDefinition` objects directly. Given the context of concept design and backend services, passing IDs and fetching definitions is the standard approach.

The `listAvatars` action also returns `avatars: Set of Avatar`, implying a list of owned Avatar *IDs*.

The prompt's note for `pickRandomAvatar` states: "For this example, we'll assume `availableAvatars` are IDs and we fetch their definitions." This is what was implemented.

### solution:

The implementation of `pickRandomAvatar` correctly interprets `Avatar` as an ID and fetches the corresponding `AvatarDefinition` objects from the `avatarDefinitions` collection. This is a standard and robust approach for backend services.

The action signature has been updated to explicitly reflect this:

```typescript
  async pickRandomAvatar({
    availableAvatarIds,
  }: {
    availableAvatarIds: Avatar[]; // Explicitly names it availableAvatarIds
  }): Promise<{ avatar: Avatar }> { ... }
```

The documentation for `pickRandomAvatar` has also been updated to clarify this assumption.

If the intent was for `availableAvatars` to represent a collection of full `AvatarDefinition` objects passed directly, the implementation would need to change to iterate over these objects without needing to query the `avatarDefinitions` collection. However, for a reusable concept, using IDs and a dedicated definition collection is more flexible.

The provided implementation adheres to the spirit of concept design by treating `Avatar` as a polymorphic type (represented by `ID`) that is then resolved to its concrete definition when needed, typically through another concept or a dedicated data store like `avatarDefinitions`.

No code changes are strictly required for the `pickRandomAvatar` action based on the provided clarification, as the existing implementation already aligns with the stated assumption. The naming `availableAvatarIds` makes it more explicit.

For completeness, here are the relevant parts of the code that reflect this:

**Updated action signature in `RewardingConcept.ts`:**

```typescript
  /**
   * Picks a random avatar from a list of available avatar definitions, weighted by rarity.
   * @param availableAvatarIds An array of IDs of available avatar definitions.
   * @returns A dictionary containing the ID of the randomly picked avatar.
   */
  async pickRandomAvatar({
    availableAvatarIds,
  }: {
    availableAvatarIds: Avatar[]; // Changed parameter name for clarity
  }): Promise<{ avatar: Avatar }> {
    // ... implementation remains the same, using availableAvatarIds to query avatarDefinitions
  }
```

**Updated documentation within the code comment:**

```typescript
  /**
   * Picks a random avatar from a list of available avatar definitions, weighted by rarity.
   * This is a simplified implementation assuming `availableAvatars` contains `AvatarDefinition` objects directly or their IDs.
   * For this example, we'll assume `availableAvatars` are IDs and we fetch their definitions.
   *
   * NOTE: The original spec implies `availableAvatars` might be the full Avatar objects,
   * but for a backend service, passing IDs and fetching definitions is more common.
   * Let's assume for now that the action receives avatar *definitions* or their IDs and fetches them.
   * We'll fetch definitions based on the provided IDs.
   *
   * @param availableAvatarIds An array of IDs of available avatar definitions.
   * @returns A dictionary containing the ID of the randomly picked avatar.
   */
  async pickRandomAvatar({
    availableAvatarIds,
  }: {
    availableAvatarIds: Avatar[];
  }): Promise<{ avatar: Avatar }> {
    // ... implementation as before
  }
```
