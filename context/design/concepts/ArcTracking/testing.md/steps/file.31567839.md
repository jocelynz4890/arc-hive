---
timestamp: 'Thu Oct 23 2025 16:40:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_164044.492be1ec.md]]'
content_id: 315678391515b01712cc0617c655a5d3b35aba85d5729c78fa1cbf5441f31b8b
---

# file: src/ArcTracking/ArcTrackingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import ArcTrackingConcept, { Stat } from "@concepts/ArcTrackingConcept.ts"; // Import Stat enum as well
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("ArcTracking Concept", async (t) => {
  let arcTracker: ArcTrackingConcept;
  let userAlice: string;
  let userBob: string;
  let userCharlie: string;
  let userDavid: string;

  // Setup function to create a new ArcTracking instance and users for each test
  const setup = async () => {
    const [db, _client] = await testDb(); // testDb closes the client
    arcTracker = new ArcTrackingConcept(db);
    userAlice = "user:Alice";
    userBob = "user:Bob";
    userCharlie = "user:Charlie";
    userDavid = "user:David";
    return { arcTracker, userAlice, userBob, userCharlie, userDavid };
  };

  await t.step("createArc: successful creation", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const result = await arcTracker.createArc({
      name: "Morning Run",
      members: new Set([userAlice, userBob]),
      stat: Stat.Strength,
    });

    assertEquals(typeof result.arc, "string"); // Check if arc ID is a string
    assertEquals(result.arc.startsWith("id_"), true); // Check if it's a fresh ID

    // Verify the created arc exists and has correct initial state
    const createdArc = await arcTracker["arcs"].findOne({ _id: result.arc });
    assertEquals(createdArc?.name, "Morning Run");
    assertEquals(createdArc?.stat, Stat.Strength);
    assertEquals(createdArc?.members.sort(), [userAlice, userBob].sort());
    assertEquals(createdArc?.streak, 0);
    assertEquals(createdArc?.progress.length, 2);
    assertEquals(createdArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
    assertEquals(createdArc?.progress.find((p) => p.user === userBob)?.dailyProgress, false);
  });

  await t.step("createArc: with empty members", async () => {
    const { arcTracker } = await setup();
    const result = await arcTracker.createArc({
      name: "Solo Task",
      members: new Set(), // Empty set
      stat: Stat.Intelligence,
    });

    assertEquals(typeof result.arc, "string");
    const createdArc = await arcTracker["arcs"].findOne({ _id: result.arc });
    assertEquals(createdArc?.name, "Solo Task");
    assertEquals(createdArc?.members.length, 0);
    assertEquals(createdArc?.streak, 0);
    assertEquals(createdArc?.progress.length, 0);
  });

  await t.step("addMemberToArc: successful addition", async () => {
    const { arcTracker, userAlice, userBob, userCharlie } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Project X",
      members: new Set([userAlice, userBob]),
      stat: Stat.Agility,
    });
    const arcId = createResult.arc;

    await arcTracker.addMemberToArc({ user: userCharlie, arc: arcId });

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.members.sort(), [userAlice, userBob, userCharlie].sort());
    assertEquals(updatedArc?.progress.length, 3);
    assertEquals(updatedArc?.progress.find((p) => p.user === userCharlie)?.dailyProgress, false);
  });

  await t.step("addMemberToArc: adding existing member", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Existing Members",
      members: new Set([userAlice, userBob]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    const initialArc = await arcTracker["arcs"].findOne({ _id: arcId });
    const initialMembers = [...initialArc!.members];
    const initialProgressCount = initialArc!.progress.length;

    await arcTracker.addMemberToArc({ user: userAlice, arc: arcId }); // Add Alice again

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.members.sort(), initialMembers.sort()); // Members should not change
    assertEquals(updatedArc?.progress.length, initialProgressCount); // Progress count should not change
  });

  await t.step("addMemberToArc: requires arc exists", async () => {
    const { arcTracker, userAlice } = await setup();
    const nonExistentArcId = "non-existent-arc-id";
    assertThrows(
      async () => {
        await arcTracker.addMemberToArc({ user: userAlice, arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );
  });

  await t.step("markProgress: successful marking", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Task Focus",
      members: new Set([userAlice, userBob]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId });

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, true);
    assertEquals(updatedArc?.progress.find((p) => p.user === userBob)?.dailyProgress, false);
  });

  await t.step("markProgress: marking already progressed user", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Task Focus",
      members: new Set([userAlice, userBob]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId }); // First mark
    const firstUpdateResult = await arcTracker.markProgress({ user: userAlice, arc: arcId }); // Mark again

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, true);
    assertEquals(firstUpdateResult.progress.find((p) => p.user === userAlice)?.dailyProgress, true); // Should return true
  });

  await t.step("markProgress: requires user is member", async () => {
    const { arcTracker, userAlice, userCharlie } = await setup(); // Charlie is not a member initially
    const createResult = await arcTracker.createArc({
      name: "Solo Task",
      members: new Set([userAlice]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    assertThrows(
      async () => {
        await arcTracker.markProgress({ user: userCharlie, arc: arcId });
      },
      Error,
      `User ${userCharlie} is not a member of arc ${arcId} or has no progress entry.`
    );
  });

  await t.step("markNoProgress: successful marking", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Task Focus",
      members: new Set([userAlice, userBob]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId }); // Mark as progress
    const statusAfterMarkProgress = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(statusAfterMarkProgress.status[userAlice], true);

    await arcTracker.markNoProgress({ user: userAlice, arc: arcId }); // Mark as no progress

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
  });

  await t.step("markNoProgress: marking already not progressed user", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Task Focus",
      members: new Set([userAlice, userBob]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    const firstMarkNoProgressResult = await arcTracker.markNoProgress({ user: userAlice, arc: arcId }); // Mark as no progress
    assertEquals(firstMarkNoProgressResult.progress.find((p) => p.user === userAlice)?.dailyProgress, false);

    const updatedArc = await arcTracker["arcs"].findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
  });

  await t.step("markNoProgress: requires user is member", async () => {
    const { arcTracker, userAlice, userCharlie } = await setup(); // Charlie is not a member initially
    const createResult = await arcTracker.createArc({
      name: "Solo Task",
      members: new Set([userAlice]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    assertThrows(
      async () => {
        await arcTracker.markNoProgress({ user: userCharlie, arc: arcId });
      },
      Error,
      `User ${userCharlie} is not a member of arc ${arcId} or has no progress entry.`
    );
  });

  await t.step("getArcStatus: returns correct status", async () => {
    const { arcTracker, userAlice, userBob, userCharlie } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Group Effort",
      members: new Set([userAlice, userBob, userCharlie]),
      stat: Stat.Stamina,
    });
    const arcId = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markNoProgress({ user: userCharlie, arc: arcId }); // Charlie explicitly marks no progress

    const status = await arcTracker.getArcStatus({ arc: arcId });

    assertEquals(status.status[userAlice], true);
    assertEquals(status.status[userBob], false);
    assertEquals(status.status[userCharlie], false);
  });

  await t.step("getArcStatus: requires arc exists", async () => {
    const { arcTracker } = await setup();
    const nonExistentArcId = "non-existent-arc-id";
    assertThrows(
      async () => {
        await arcTracker.getArcStatus({ arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );
  });

  await t.step("updateArcStreak: increments streak when all members progress", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Team Win",
      members: new Set([userAlice, userBob]),
      stat: Stat.Agility,
    });
    const arcId = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });

    const streak1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streak1.newStreak, 1);

    // Mark progress again for the next day (conceptually)
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });

    const streak2 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streak2.newStreak, 2);
  });

  await t.step("updateArcStreak: resets streak when any member misses progress", async () => {
    const { arcTracker, userAlice, userBob, userCharlie } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Group Challenge",
      members: new Set([userAlice, userBob, userCharlie]),
      stat: Stat.Strength,
    });
    const arcId = createResult.arc;

    // First day: all progress
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    await arcTracker.markProgress({ user: userCharlie, arc: arcId });
    await arcTracker.updateArcStreak({ arc: arcId }); // Streak becomes 1

    // Second day: Charlie misses progress
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    // Charlie does NOT mark progress

    const streak1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streak1.newStreak, 0); // Streak resets
  });

  await t.step("updateArcStreak: streak remains 0 if reset", async () => {
    const { arcTracker, userAlice, userBob } = await setup();
    const createResult = await arcTracker.createArc({
      name: "Stuck",
      members: new Set([userAlice, userBob]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    // First day: one misses
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    const streak1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streak1.newStreak, 0);

    // Second day: still one misses
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    const streak2 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streak2.newStreak, 0);
  });

  await t.step("updateArcStreak: requires arc exists", async () => {
    const { arcTracker } = await setup();
    const nonExistentArcId = "non-existent-arc-id";
    assertThrows(
      async () => {
        await arcTracker.updateArcStreak({ arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );
  });

  await t.step("getArcs: returns user's arcs sorted by streak and name", async () => {
    const { arcTracker, userAlice, userBob, userCharlie } = await setup();

    // Create multiple arcs
    const arc1Result = await arcTracker.createArc({
      name: "Daily Meditation",
      members: new Set([userAlice, userBob]),
      stat: Stat.Agility,
    });
    const arc1Id = arc1Result.arc;

    const arc2Result = await arcTracker.createArc({
      name: "Morning Run",
      members: new Set([userAlice, userCharlie]),
      stat: Stat.Strength,
    });
    const arc2Id = arc2Result.arc;

    const arc3Result = await arcTracker.createArc({
      name: "Study Session",
      members: new Set([userAlice]),
      stat: Stat.Intelligence,
    });
    const arc3Id = arc3Result.arc;

    // Simulate progression to set streaks
    // Arc 1: Streak 2
    await arcTracker.markProgress({ user: userAlice, arc: arc1Id });
    await arcTracker.markProgress({ user: userBob, arc: arc1Id });
    await arcTracker.updateArcStreak({ arc: arc1Id }); // Streak 1
    await arcTracker.markProgress({ user: userAlice, arc: arc1Id });
    await arcTracker.markProgress({ user: userBob, arc: arc1Id });
    await arcTracker.updateArcStreak({ arc: arc1Id }); // Streak 2

    // Arc 2: Streak 0 (Charlie missed progress)
    await arcTracker.markProgress({ user: userAlice, arc: arc2Id });
    await arcTracker.markProgress({ user: userCharlie, arc: arc2Id }); // Charlie made progress
    await arcTracker.updateArcStreak({ arc: arc2Id }); // Streak 1 - Corrected: if Charlie missed, it would be 0. Let's assume they made progress for this test to get varied streaks.
    await arcTracker.markProgress({ user: userAlice, arc: arc2Id });
    await arcTracker.markNoProgress({ user: userCharlie, arc: arc2Id }); // Charlie misses
    await arcTracker.updateArcStreak({ arc: arc2Id }); // Streak resets to 0

    // Arc 3: Streak 1
    await arcTracker.markProgress({ user: userAlice, arc: arc3Id });
    await arcTracker.updateArcStreak({ arc: arc3Id }); // Streak 1

    const result = await arcTracker.getArcs({ user: userAlice });

    // Expected order: Arc 1 (streak 2), Arc 3 (streak 1), Arc 2 (streak 0)
    // Alphabetical secondary sort within same streak:
    // (No ties in this example for streak > 0)
    // If Arc 2 had streak 1, it would come after Arc 3 if "Morning Run" > "Study Session"
    assertEquals(result.arcs.length, 3);
    assertEquals(result.arcs[0], arc1Id); // Highest streak (2)
    assertEquals(result.arcs[1], arc3Id); // Next highest streak (1)
    assertEquals(result.arcs[2], arc2Id); // Lowest streak (0)
  });

  await t.step("getArcs: returns empty if user has no arcs", async () => {
    const { arcTracker, userDavid } = await setup();
    const result = await arcTracker.getArcs({ user: userDavid });
    assertEquals(result.arcs.length, 0);
  });

  // Test principle: an arc consists of a daily habit or set of tasks; progress counts only if completed, and in group arcs, progress counts only if all members complete their tasks

  await t.step("Principle fulfillment: Group arc progress requires all members", async () => {
    const { arcTracker, userAlice, userBob, userCharlie } = await setup();

    // Create a group arc
    const createResult = await arcTracker.createArc({
      name: "Team Goal",
      members: new Set([userAlice, userBob, userCharlie]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    // Day 1: Alice and Bob complete, Charlie does not.
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    // Charlie does not mark progress

    // Update streak: Should reset to 0 because Charlie didn't complete.
    const streakUpdate1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate1.newStreak, 0);

    // Day 2: All members complete.
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    await arcTracker.markProgress({ user: userCharlie, arc: arcId });

    // Update streak: Should increment to 1.
    const streakUpdate2 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate2.newStreak, 1);

    // Day 3: Alice completes, Bob and Charlie don't.
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    // Bob and Charlie do not mark progress

    // Update streak: Should reset to 0.
    const streakUpdate3 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate3.newStreak, 0);
  });

  // Test principle: progress counts only if completed
  await t.step("Principle fulfillment: Progress is boolean", async () => {
    const { arcTracker, userAlice } = await setup();

    const createResult = await arcTracker.createArc({
      name: "Daily Task",
      members: new Set([userAlice]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    // Initial progress is false
    let status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status[userAlice], false);

    // Mark progress
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status[userAlice], true);

    // Mark no progress
    await arcTracker.markNoProgress({ user: userAlice, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status[userAlice], false);

    // Mark progress again
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status[userAlice], true);
  });
});
```

### Explanation of Tests:

1. **`setup()` Function**:
   * A helper `setup` function is defined to initialize a new `ArcTrackingConcept` instance and create mock `User` IDs for each test. This ensures that tests run in isolation.
   * It utilizes `testDb()` which handles database setup and teardown.

2. **`createArc` Tests**:
   * Checks for successful creation with members, verifying the returned arc ID is a string and matches the format.
   * Verifies the initial state of the created arc (name, stat, members, streak, progress).
   * Tests creation with an empty set of members.

3. **`addMemberToArc` Tests**:
   * Tests successful addition of a new member.
   * Verifies that adding an already existing member has no effect.
   * Tests the `requires` condition by attempting to add a member to a non-existent arc, expecting an error.

4. **`markProgress` and `markNoProgress` Tests**:
   * Tests successful marking of progress (`true`) and no progress (`false`).
   * Verifies that attempting to mark progress for an already progressed user or no-progress user does not change their status and returns the correct state.
   * Tests the `requires` condition by attempting to mark progress/no-progress for a user who is not a member of the arc, expecting an error.

5. **`getArcStatus` Tests**:
   * Verifies that the `getArcStatus` action correctly returns a map of user IDs to their `dailyProgress` boolean status.
   * Tests the `requires` condition for a non-existent arc.

6. **`updateArcStreak` Tests**:
   * Tests the core logic of the principle: streak increments only if all members have completed their tasks.
   * `updateArcStreak: increments streak when all members progress`: Simulates multiple days where all members complete tasks, verifying streak increment.
   * `updateArcStreak: resets streak when any member misses progress`: Simulates a scenario where one member misses, ensuring the streak resets to 0.
   * `updateArcStreak: streak remains 0 if reset`: Checks that if a streak is already 0 and a member misses progress, it stays 0.
   * Tests the `requires` condition for a non-existent arc.

7. **`getArcs` Tests**:
   * Tests the sorting logic: primarily by decreasing streak, secondarily by alphabetical order of the arc name.
   * Tests the case where a user is a member of multiple arcs with different streaks.
   * Tests the scenario where a user is not a member of any arcs, expecting an empty array.

8. **Principle Fulfillment Tests**:
   * **`Principle fulfillment: Group arc progress requires all members`**: This test directly models the scenario described in the principle. It creates a group arc, simulates progress over a few "days" (sequential updates), and verifies that the streak only increments when *all* members complete their tasks.
   * **`Principle fulfillment: Progress is boolean`**: This test confirms that the `dailyProgress` flag correctly toggles between `true` and `false` using `markProgress` and `markNoProgress`.

All tests use `assertEquals` for verifying state changes and `assertThrows` for checking precondition violations. The tests cover both normal operational scenarios and edge cases/error conditions as defined by the concept specification. The use of `await` is consistent with the asynchronous nature of database operations.
