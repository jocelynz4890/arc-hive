import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "ArcTracking" + ".";

// Generic types of this concept
type User = ID;
type Arc = ID;

interface ArcDocument {
  _id: Arc;
  name: string;
  stat: "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";
  members: User[];
  streak: number;
  progress: {
    user: User;
    dailyProgress: boolean;
  }[];
}

export default class ArcTrackingConcept {
  arcs: Collection<ArcDocument>;

  constructor(private readonly db: Db) {
    this.arcs = this.db.collection(PREFIX + "arcs");
  }

  /**
   * Creates a new arc with given name and stat, and adds the members to Members and to the progress map with initial progress set to false and initial streak set to 0; members may be empty
   * @param {name: String, stat: String, members: Set of Users} args
   * @returns {arc: Arc}
   */
  async createArc({ name, stat, members }: { name: string; stat?: string; members: User[] }): Promise<{ arc: Arc }> {
    const arcId: Arc = freshID();
    const initialProgress = members.map((user) => ({
      user,
      dailyProgress: false,
    }));

    const finalStat = (stat as "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence") || "HP";

    const newArc: ArcDocument = {
      _id: arcId,
      name: name,
      stat: finalStat,
      members: members,
      streak: 0,
      progress: initialProgress,
    };

    await this.arcs.insertOne(newArc);
    return { arc: arcId };
  }

  /**
   * Adds user to arc’s Members and progress map with initial progress set to false
   * @param {user: User, arc: Arc} args
   * @returns {Empty}
   */
  async addMemberToArc({ user, arc }: { user: User; arc: Arc }): Promise<Empty> {
    // Ensure user is not already a member
    const existingArc = await this.arcs.findOne({ _id: arc });
    if (!existingArc) {
      throw new Error(`Arc with id ${arc} not found.`);
    }

    if (existingArc.members.includes(user)) {
      // User is already a member, no action needed.
      return {};
    }

    const updatedMembers = [...existingArc.members, user];
    const updatedProgress = [
      ...existingArc.progress,
      { user: user, dailyProgress: false },
    ];

    await this.arcs.updateOne(
      { _id: arc },
      {
        $set: {
          members: updatedMembers,
          progress: updatedProgress,
        },
      },
    );

    return {};
  }

  /**
   * Sets user’s progress for the day to true
   * @param {user: User, arc: Arc} args
   * @returns {progress: Progress Map<User, Boolean>}
   */
  async markProgress({ user, arc }: { user: User; arc: Arc }): Promise<{
    progress: { user: User; dailyProgress: boolean }[];
  }> {
    const result = await this.arcs.findOneAndUpdate(
      { _id: arc, "progress.user": user },
      { $set: { "progress.$.dailyProgress": true } },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`User ${user} not found in arc ${arc} or arc not found.`);
    }

    return { progress: result.progress };
  }

  /**
   * Sets user's progress for the day to false
   * @param {user: User, arc: Arc} args
   * @returns {progress: Progress Map<User, Boolean>}
   */
  async markNoProgress({ user, arc }: { user: User; arc: Arc }): Promise<{
    progress: { user: User; dailyProgress: boolean }[];
  }> {
    const result = await this.arcs.findOneAndUpdate(
      { _id: arc, "progress.user": user },
      { $set: { "progress.$.dailyProgress": false } },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`User ${user} not found in arc ${arc} or arc not found.`);
    }

    return { progress: result.progress };
  }

  /**
   * Returns current progress status of all members
   * @param {arc: Arc} args
   * @returns {status: Map<User, Boolean>}
   */
  async getArcStatus({ arc }: { arc: Arc }): Promise<{ status: { user: User; dailyProgress: boolean }[] }> {
    const foundArc = await this.arcs.findOne({ _id: arc }, { projection: { progress: 1, _id: 0 } });
    if (!foundArc) {
      throw new Error(`Arc with id ${arc} not found.`);
    }
    return { status: foundArc.progress };
  }

  /**
   * Gets the progress map of the arc, and if any member has not made progress, the streak resets to 0, otherwise it is incremented by 1, then daily progress is reset to false for all users to indicate a new day
   * @param {arc: Arc} args
   * @returns {newStreak: Number}
   */
  async updateArcStreak({ arc }: { arc: Arc }): Promise<{ newStreak: number }> {
    const foundArc = await this.arcs.findOne({ _id: arc });
    if (!foundArc) {
      throw new Error(`Arc with id ${arc} not found.`);
    }

    const allProgressed = foundArc.progress.every(
      (p: { user: User; dailyProgress: boolean }) => p.dailyProgress === true,
    );

    let newStreak = foundArc.streak;
    if (allProgressed) {
      newStreak++;
    } else {
      newStreak = 0;
    }

    // Reset daily progress for all users for the new day
    const resetProgress = foundArc.progress.map((p: { user: User; dailyProgress: boolean }) => ({
      ...p,
      dailyProgress: false,
    }));

    await this.arcs.updateOne(
      { _id: arc },
      {
        $set: {
          streak: newStreak,
          progress: resetProgress,
        },
      },
    );

    return { newStreak: newStreak };
  }

  /**
   * Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by creation order (order by id)
   * @param {user: User} args
   * @returns {arcs: Set of Arcs}
   */
  async getArcs({ user }: { user: User }): Promise<{ arcs: Arc[] }> {
    // Find arcs where the user is in the members array (not that members only contains user)
    const userArcs = await this.arcs
      .find({ members: { $in: [user] } })
      .sort({ streak: -1, _id: -1 }) // Sort by streak descending, then name ascending
      .toArray();

    // The result should be a set of Arcs (IDs), not the full arc documents.
    const arcIds = userArcs.map((arc) => arc._id);
    return { arcs: arcIds };
  }

  /**
   * Returns the full arc document for a given arc id.
   * @param {arc: Arc} args
   * @returns {arc: ArcDocument}
   */
  async getArc({ arc }: { arc: Arc }): Promise<{ arc: ArcDocument }> {
    const found = await this.arcs.findOne({ _id: arc });
    if (!found) {
      throw new Error(`Arc with id ${arc} not found.`);
    }
    return { arc: found };
  }

  /**
   * Refresh all arcs - processes all arcs and returns aggregated results.
   * Internal action for batch daily refresh processing.
   * @returns Object with stat updates and rewards to be applied
   */
  async refreshAllArcs({}: {}): Promise<{ 
    statUpdates: Array<{ user: User; stat: string; completed: boolean }>;
    rewards: Array<{ user: User; points: number }>
  }> {
    const allArcs = await this.arcs.find({}).toArray();
    
    const statUpdates: Array<{ user: User; stat: string; completed: boolean }> = [];
    const rewards: Array<{ user: User; points: number }> = [];
    
    for (const arcDoc of allArcs) {
      const oldStreak = arcDoc.streak;
      
      // Get progress status BEFORE updating
      const statusResult = await this.getArcStatus({ arc: arcDoc._id });
      const progress = statusResult.status || [];
      
      // Build user progress info
      const userProgress = arcDoc.members.map((member: User) => {
        const memberProgress = progress.find((p: any) => p.user === member);
        return {
          user: member,
          stat: arcDoc.stat || 'HP',
          completed: memberProgress?.dailyProgress || false,
        };
      });
      
      // Update the arc streak
      await this.updateArcStreak({ arc: arcDoc._id });
      
      // Check if all completed (streak extended)
      const arcResult = await this.arcs.findOne({ _id: arcDoc._id });
      const allCompleted = (arcResult?.streak || 0) > oldStreak;
      
      // Collect stat updates for all users in this arc
      for (const progress of userProgress) {
        statUpdates.push(progress);
      }
      
      // If all members completed, award points to all members
      if (allCompleted) {
        for (const progress of userProgress) {
          rewards.push({
            user: progress.user,
            points: 1,
          });
        }
      }
    }
    
    console.log(`[ArcTracking.refreshAllArcs] Complete: ${statUpdates.length} stat updates, ${rewards.length} rewards`)
    return { statUpdates, rewards };
  }

}
