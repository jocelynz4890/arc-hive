---
timestamp: 'Thu Oct 23 2025 17:43:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_174334.bfe4d60d.md]]'
content_id: 0c398b7d92a5fac2fb2a31a6b6ad9668382a5113029b274da121a7242cc6650f
---

# response:

Let's implement the `ArcTracking` concept as requested. We'll create the TypeScript class, map the state to MongoDB collections, and implement the actions.

```typescript
// @utils/types.ts
export type ID = string & { __brand: "ID" };
export type Empty = Record<PropertyKey, never>;

// @utils/database.ts
import { MongoClient, Db } from "npm:mongodb";
import { ID } from "./types.ts";

const MONGO_URL = Deno.env.get("MONGO_URL") || "mongodb://localhost:27017";
const DB_NAME = Deno.env.get("DB_NAME") || "concept_db";

let db: Db | null = null;
let client: MongoClient | null = null;

export async function getDb(): Promise<[Db, MongoClient]> {
  if (db && client) {
    return [db, client];
  }
  client = new MongoClient(MONGO_URL);
  await client.connect();
  db = client.db(DB_NAME);
  return [db, client];
}

export function freshID(): ID {
  // In a real application, you'd use a proper UUID generator or MongoDB's ObjectId.
  // For simplicity and type branding, we'll use a simple string prefix.
  return crypto.randomUUID() as ID;
}

// @concepts/ArcTracking/ArcTrackingConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "ArcTracking" + ".";

// Generic types of this concept
type User = ID;
type Arc = ID;

// State definitions mapped to MongoDB collections
/**
 * a set of Arcs with
 *  a name String
 *  a stat String {HP, Stamina, Strength, Agility, Intelligence}
 *  a members Set of Users
 *  a streak Number
 *  a progress set with
 *      a user User
 *      a daily progress Boolean
 */
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
   * @param {name: String, members: Set of Users} args
   * @returns {arc: Arc}
   */
  createArc({ name, members }: { name: string; members: User[] }): { arc: Arc } {
    const arcId: Arc = freshID();
    const initialProgress = members.map((user) => ({
      user,
      dailyProgress: false,
    }));

    const newArc: ArcDocument = {
      _id: arcId,
      name: name,
      stat: "HP", // Default stat, as the spec doesn't specify how to choose one. In a real app, this would be an argument.
      members: members,
      streak: 0,
      progress: initialProgress,
    };

    this.arcs.insertOne(newArc);
    return { arc: arcId };
  }

  /**
   * Adds user to arc’s Members and progress map with initial progress set to false
   * @param {user: User, arc: Arc} args
   * @returns {Empty}
   */
  addMemberToArc({ user, arc }: { user: User; arc: Arc }): Empty {
    // Ensure user is not already a member
    const existingArc = this.arcs.findOne({ _id: arc });
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

    this.arcs.updateOne(
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
  markProgress({ user, arc }: { user: User; arc: Arc }): {
    progress: { user: User; dailyProgress: boolean }[];
  } {
    const result = this.arcs.findOneAndUpdate(
      { _id: arc, "progress.user": user },
      { $set: { "progress.$.dailyProgress": true } },
      { returnDocument: "after" }, // Return the updated document
    );

    if (!result) {
      throw new Error(`User ${user} not found in arc ${arc} or arc not found.`);
    }

    return { progress: result.value.progress };
  }

  /**
   * Sets user's progress for the day to false
   * @param {user: User, arc: Arc} args
   * @returns {progress: Progress Map<User, Boolean>}
   */
  markNoProgress({ user, arc }: { user: User; arc: Arc }): {
    progress: { user: User; dailyProgress: boolean }[];
  } {
    const result = this.arcs.findOneAndUpdate(
      { _id: arc, "progress.user": user },
      { $set: { "progress.$.dailyProgress": false } },
      { returnDocument: "after" }, // Return the updated document
    );

    if (!result) {
      throw new Error(`User ${user} not found in arc ${arc} or arc not found.`);
    }

    return { progress: result.value.progress };
  }

  /**
   * Returns current progress status of all members
   * @param {arc: Arc} args
   * @returns {status: Map<User, Boolean>}
   */
  getArcStatus({ arc }: { arc: Arc }): { status: { user: User; dailyProgress: boolean }[] } {
    const foundArc = this.arcs.findOne({ _id: arc }, { projection: { progress: 1, _id: 0 } });
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
  updateArcStreak({ arc }: { arc: Arc }): { newStreak: number } {
    const foundArc = this.arcs.findOne({ _id: arc });
    if (!foundArc) {
      throw new Error(`Arc with id ${arc} not found.`);
    }

    const allProgressed = foundArc.progress.every(
      (p) => p.dailyProgress === true,
    );

    let newStreak = foundArc.streak;
    if (allProgressed) {
      newStreak++;
    } else {
      newStreak = 0;
    }

    // Reset daily progress for all users for the new day
    const resetProgress = foundArc.progress.map((p) => ({
      ...p,
      dailyProgress: false,
    }));

    this.arcs.updateOne(
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
   * Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by alphabetical order
   * @param {user: User} args
   * @returns {arcs: Set of Arcs}
   */
  getArcs({ user }: { user: User }): { arcs: Arc[] } {
    const userArcs = this.arcs
      .find({ members: user })
      .sort({ streak: -1, name: 1 }) // Sort by streak descending, then name ascending
      .toArray();

    // The result should be a set of Arcs (IDs), not the full arc documents.
    const arcIds = userArcs.map((arc) => arc._id);
    return { arcs: arcIds };
  }
}
```

**Explanation of the Implementation:**

1. **File Structure and Imports**:
   * We assume helper utility files for `types.ts` and `database.ts` are available in the `@utils` directory.
   * The `ArcTrackingConcept.ts` file resides within `@concepts/ArcTracking/`.
   * We import necessary modules from `npm:mongodb`, and our utility types and functions.

2. **Constants and Types**:
   * `PREFIX`: Used to namespace MongoDB collection names to avoid collisions.
   * `User` and `Arc`: Type aliases for `ID` to improve readability.
   * `ArcDocument`: An interface defining the structure of documents in the `arcs` MongoDB collection, directly mapping the `state` of the `ArcTracking` concept.

3. **Constructor**:
   * The constructor takes a `Db` instance from MongoDB and initializes the `arcs` collection property.

4. **`createArc` Action**:
   * Generates a new `arcId` using `freshID()`.
   * Initializes the `progress` array with all members having `dailyProgress: false`.
   * Creates a new `ArcDocument` object.
   * Inserts the document into the `arcs` collection using `insertOne()`.
   * Returns the generated `arcId`.

5. **`addMemberToArc` Action**:
   * Retrieves the existing arc to check if the user is already a member and to get the current state.
   * If the user is not a member, it updates the `members` array and the `progress` array by adding the new user with `dailyProgress: false`.
   * Uses `updateOne` to modify the document in the `arcs` collection.
   * Returns an empty object as specified for actions that don't return specific data.

6. **`markProgress` and `markNoProgress` Actions**:
   * These actions use `findOneAndUpdate` to efficiently update a specific element within the `progress` array.
   * The `$set` operator with the positional `$` operator targets the correct `dailyProgress` field for the specified `user`.
   * `returnDocument: "after"` is crucial to get the updated document back, allowing us to return the modified `progress` array.
   * Includes error handling if the user or arc is not found.

7. **`getArcStatus` Action**:
   * Uses `findOne` with a `projection` to only retrieve the `progress` field for the specified `arc`.
   * Returns the `progress` array.

8. **`updateArcStreak` Action**:
   * Fetches the arc document.
   * Uses `every()` on the `progress` array to check if all members have `dailyProgress: true`.
   * Updates the `streak` based on the `allProgressed` condition.
   * Resets `dailyProgress` to `false` for all members.
   * Updates the document in the `arcs` collection.
   * Returns the `newStreak`.

9. **`getArcs` Action**:
   * Uses `find()` to filter arcs where the `user` is present in the `members` array.
   * Applies `sort({ streak: -1, name: 1 })` to order by streak count (descending) and then by name (ascending).
   * Converts the cursor to an array of documents using `toArray()`.
   * Maps the resulting documents to an array of `Arc` IDs.
   * Returns the array of arc IDs.

**To run this implementation:**

1. **Set up `.env`**: Create a `.env` file in your project root with your MongoDB connection string (or use the default).
   ```dotenv
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=concept_db
   ```
2. **Install dependencies**:
   ```bash
   deno task add npm:mongodb
   ```
3. **Create `utils` directory**:
   * Create `@utils/types.ts` and `@utils/database.ts` with the provided code.
4. **Create `concepts` directory**:
   * Create `@concepts/ArcTracking/ArcTrackingConcept.ts` with the provided code.
5. **Example Usage (in another file, e.g., `main.ts`)**:
   ```typescript
   import { getDb } from "@utils/database.ts";
   import ArcTrackingConcept from "@concepts/ArcTracking/ArcTrackingConcept.ts";
   import { ID } from "@utils/types.ts";

   async function runExample() {
     const [db, client] = await getDb();
     const arcTracker = new ArcTrackingConcept(db);

     // Example Users
     const userAlice = "user:Alice" as ID;
     const userBob = "user:Bob" as ID;
     const userCharlie = "user:Charlie" as ID;

     // 1. Create an Arc
     const { arc: myArc1 } = await arcTracker.createArc({
       name: "Daily Exercise",
       members: [userAlice, userBob],
     });
     console.log(`Created Arc: ${myArc1}`);

     // 2. Mark progress for Alice
     await arcTracker.markProgress({ user: userAlice, arc: myArc1 });
     let status = await arcTracker.getArcStatus({ arc: myArc1 });
     console.log("Status after Alice's progress:", status);

     // 3. Try to update streak (should not increment as Bob hasn't progressed)
     let streakResult = await arcTracker.updateArcStreak({ arc: myArc1 });
     console.log(`Streak after incomplete day: ${streakResult.newStreak}`);

     // 4. Mark progress for Bob
     await arcTracker.markProgress({ user: userBob, arc: myArc1 });
     status = await arcTracker.getArcStatus({ arc: myArc1 });
     console.log("Status after Bob's progress:", status);

     // 5. Update streak (should increment now)
     streakResult = await arcTracker.updateArcStreak({ arc: myArc1 });
     console.log(`Streak after complete day: ${streakResult.newStreak}`);

     // 6. Add another member and test streak reset
     await arcTracker.addMemberToArc({ user: userCharlie, arc: myArc1 });
     status = await arcTracker.getArcStatus({ arc: myArc1 });
     console.log("Status after adding Charlie:", status);

     // Update streak again (Charlie has not progressed today, so streak resets)
     streakResult = await arcTracker.updateArcStreak({ arc: myArc1 });
     console.log(`Streak after Charlie added and new day: ${streakResult.newStreak}`);

     // 7. Get arcs for a user
     const { arcs: aliceArcs } = await arcTracker.getArcs({ user: userAlice });
     console.log(`Arcs for Alice: ${aliceArcs}`);

     // Clean up (optional, for testing)
     await db.collection(PREFIX + "arcs").deleteMany({});
     await client.close();
   }

   runExample().catch(console.error);
   ```
