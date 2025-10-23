---
timestamp: 'Thu Oct 23 2025 17:40:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_174057.e8f741cf.md]]'
content_id: f67abcd521529052a9cad600d58b8c643a996518647e6834ab473d320c963ecc
---

# file: src/ArcTracking/ArcTrackingConcept.ts

```typescript
import { Collection, Db, ObjectId } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type User = ID;
type Arc = ID;

// The stat type can be represented as an enum or a set of strings
type Stat = "HP" | "Stamina" | "Strength" | "Agility" | "Intelligence";

interface ArcDocument {
  _id: Arc;
  name: string;
  stat: Stat;
  members: User[];
  streak: number;
  progress: Record<User, boolean>; // Mapping from User ID to daily progress
}

export default class ArcTrackingConcept {
  arcs: Collection<ArcDocument>;

  constructor(private readonly db: Db) {
    this.arcs = this.db.collection("ArcTracking.arcs");
  }

  /**
   * Creates a new arc with the given name and stat, and adds the current user and members to Members
   * and to the progress map with initial progress set to false and initial streak set to 0.
   * Members may be empty.
   *
   * @param name The name of the arc.
   * @param members A set of user IDs to be added as members.
   * @param stat The stat associated with the arc.
   * @returns The newly created arc ID.
   */
  createArc({
    name,
    members,
    stat,
  }: {
    name: string;
    members: User[];
    stat: Stat;
  }): { arc: Arc } {
    // Ensure the current user is part of the members
    const currentUser = "current_user_id_placeholder" as User; // This should ideally be passed in or managed by a Session concept
    const allMembers = [currentUser, ...members].filter(
      (value, index, self) => self.indexOf(value) === index,
    ); // Deduplicate

    const newArcId = freshID();
    const initialProgress: Record<User, boolean> = {};
    allMembers.forEach((member) => {
      initialProgress[member] = false;
    });

    this.arcs.insertOne({
      _id: newArcId,
      name,
      stat,
      members: allMembers,
      streak: 0,
      progress: initialProgress,
    });

    return { arc: newArcId };
  }

  /**
   * Adds a user to an existing arc.
   *
   * @param user The user ID to add.
   * @param arc The arc ID to add the user to.
   * @returns An empty object indicating success.
   */
  addMemberToArc({ user, arc }: { user: User; arc: Arc }): {} {
    const arcDoc = this.arcs.findOne({ _id: arc });
    if (!arcDoc) {
      // In a real scenario, you might throw an error or return an error object
      // For now, we'll assume operations on existing arcs.
      console.error(`Arc with ID ${arc} not found.`);
      return {};
    }

    if (!arcDoc.members.includes(user)) {
      const newMembers = [...arcDoc.members, user];
      const newProgress = { ...arcDoc.progress, [user]: false };
      this.arcs.updateOne(
        { _id: arc },
        {
          $set: {
            members: newMembers,
            progress: newProgress,
          },
        },
      );
    }
    return {};
  }

  /**
   * Marks a user's progress for the day as true for a given arc.
   *
   * @param user The user ID.
   * @param arc The arc ID.
   * @returns The updated progress map.
   */
  markProgress({ user, arc }: { user: User; arc: Arc }): {
    progress: Record<User, boolean>;
  } {
    const arcDoc = this.arcs.findOne({ _id: arc });
    if (!arcDoc) {
      console.error(`Arc with ID ${arc} not found.`);
      return { progress: {} };
    }
    if (!arcDoc.members.includes(user)) {
      console.error(`User ${user} is not a member of arc ${arc}.`);
      return { progress: {} };
    }

    const updatedProgress = { ...arcDoc.progress, [user]: true };
    this.arcs.updateOne(
      { _id: arc },
      { $set: { progress: updatedProgress } },
    );
    return { progress: updatedProgress };
  }

  /**
   * Marks a user's progress for the day as false for a given arc.
   *
   * @param user The user ID.
   * @param arc The arc ID.
   * @returns The updated progress map.
   */
  markNoProgress({ user, arc }: { user: User; arc: Arc }): {
    progress: Record<User, boolean>;
  } {
    const arcDoc = this.arcs.findOne({ _id: arc });
    if (!arcDoc) {
      console.error(`Arc with ID ${arc} not found.`);
      return { progress: {} };
    }
    if (!arcDoc.members.includes(user)) {
      console.error(`User ${user} is not a member of arc ${arc}.`);
      return { progress: {} };
    }

    const updatedProgress = { ...arcDoc.progress, [user]: false };
    this.arcs.updateOne(
      { _id: arc },
      { $set: { progress: updatedProgress } },
    );
    return { progress: updatedProgress };
  }

  /**
   * Returns the current progress status of all members for a given arc.
   *
   * @param arc The arc ID.
   * @returns The status map.
   */
  getArcStatus({ arc }: { arc: Arc }): { status: Record<User, boolean> } {
    const arcDoc = this.arcs.findOne({ _id: arc });
    if (!arcDoc) {
      console.error(`Arc with ID ${arc} not found.`);
      return { status: {} };
    }
    return { status: arcDoc.progress };
  }

  /**
   * Updates the arc's streak. If any member has not made progress, the streak resets to 0.
   * Otherwise, it is incremented by 1. Daily progress is then reset to false for all users.
   *
   * @param arc The arc ID.
   * @returns The new streak count.
   */
  updateArcStreak({ arc }: { arc: Arc }): { newStreak: number } {
    const arcDoc = this.arcs.findOne({ _id: arc });
    if (!arcDoc) {
      console.error(`Arc with ID ${arc} not found.`);
      return { newStreak: 0 };
    }

    const allProgressMade = Object.values(arcDoc.progress).every(
      (progress) => progress === true,
    );

    let newStreak = 0;
    if (allProgressMade) {
      newStreak = arcDoc.streak + 1;
    }

    // Reset progress for the next day
    const resetProgress: Record<User, boolean> = {};
    arcDoc.members.forEach((member) => {
      resetProgress[member] = false;
    });

    this.arcs.updateOne(
      { _id: arc },
      {
        $set: {
          streak: newStreak,
          progress: resetProgress,
        },
      },
    );

    return { newStreak };
  }

  /**
   * Returns all arcs that the user is a member of, ordered by streak count (descending)
   * and then by name (alphabetical).
   *
   * @param user The user ID.
   * @returns A set of arcs.
   */
  getArcs({ user }: { user: User }): { arcs: Arc[] } {
    const userArcs = this.arcs
      .find({ members: user })
      .toArray()
      .then((docs) => {
        // Sort by streak (descending), then by name (alphabetical)
        docs.sort((a, b) => {
          if (b.streak !== a.streak) {
            return b.streak - a.streak;
          }
          return a.name.localeCompare(b.name);
        });
        return docs.map((doc) => doc._id);
      });

    return { arcs: userArcs };
  }

  // Helper to simulate getting the current user. In a real application, this
  // would come from a session or authentication concept.
  private getCurrentUser(): User {
    // Placeholder for actual current user retrieval
    return "user:Alice" as User;
  }

  // You might also want a query to get an arc by its ID
  _getArcById({ arc }: { arc: Arc }): ArcDocument | null {
    return this.arcs.findOne({ _id: arc });
  }
}
```
