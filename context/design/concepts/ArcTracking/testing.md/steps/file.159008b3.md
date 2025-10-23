---
timestamp: 'Thu Oct 23 2025 17:06:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_170607.bf8fec4f.md]]'
content_id: 159008b3d300474651139daadaaad0f167122936843fc0257a5ed4d3c5e91705
---

# file: src/ArcTracking/ArcTrackingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assert, assertThrows } from "@jsr:@std/assert";
import ArcTrackingConcept, { Stat } from "../../src/ArcTracking/ArcTrackingConcept.ts"; // Adjust import path as necessary
import { ID } from "@utils/types.ts";

Deno.test("ArcTrackingConcept", async (t) => {
  await t.step("createArc", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;

    // Test case 1: Create an arc with members
    const result1 = await arcTracker.createArc({
      name: "Morning Run",
      members: new Set([userA, userB]),
      stat: Stat.Stamina,
    });
    assert(result1.arc, "createArc should return an arc ID");
    const arcId1 = result1.arc;

    const createdArc1 = await db.collection("ArcTracking.arcs").findOne({ _id: arcId1 });
    assertEquals(createdArc1?.name, "Morning Run");
    assertEquals(createdArc1?.stat, Stat.Stamina);
    assertEquals(createdArc1?.members.length, 2);
    assert(createdArc1?.members.includes(userA));
    assert(createdArc1?.members.includes(userB));
    assertEquals(createdArc1?.streak, 0);
    assertEquals(createdArc1?.progress.length, 2);
    assertEquals(createdArc1?.progress[0].user, userA);
    assertEquals(createdArc1?.progress[0].dailyProgress, false);
    assertEquals(createdArc1?.progress[1].user, userB);
    assertEquals(createdArc1?.progress[1].dailyProgress, false);

    // Test case 2: Create an arc with no members (individual arc)
    const result2 = await arcTracker.createArc({
      name: "Learn Guitar",
      members: new Set(),
      stat: Stat.Strength,
    });
    assert(result2.arc, "createArc should return an arc ID for individual arc");
    const arcId2 = result2.arc;

    const createdArc2 = await db.collection("ArcTracking.arcs").findOne({ _id: arcId2 });
    assertEquals(createdArc2?.name, "Learn Guitar");
    assertEquals(createdArc2?.stat, Stat.Strength);
    assertEquals(createdArc2?.members.length, 0);
    assertEquals(createdArc2?.streak, 0);
    assertEquals(createdArc2?.progress.length, 0);

    await client.close();
  });

  await t.step("addMemberToArc", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;
    const userC = "user:Charlie" as ID;

    // Create an initial arc
    const createResult = await arcTracker.createArc({
      name: "Group Project",
      members: new Set([userA, userB]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    // Test case 1: Add a new member
    await arcTracker.addMemberToArc({ user: userC, arc: arcId });
    const arcAfterAdd = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(arcAfterAdd?.members.length, 3);
    assert(arcAfterAdd?.members.includes(userC));
    assertEquals(arcAfterAdd?.progress.length, 3);
    const charlieProgress = arcAfterAdd?.progress.find((p) => p.user === userC);
    assertEquals(charlieProgress?.dailyProgress, false);

    // Test case 2: Add an existing member (should not duplicate)
    await arcTracker.addMemberToArc({ user: userB, arc: arcId });
    const arcAfterAddingExisting = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(arcAfterAddingExisting?.members.length, 3); // Length should remain the same
    assertEquals(arcAfterAddingExisting?.progress.length, 3); // Progress entries should remain the same

    // Test case 3: Add member to a non-existent arc (should throw)
    const nonExistentArcId = "arc:nonexistent" as ID;
    assertThrows(
      async () => {
        await arcTracker.addMemberToArc({ user: userC, arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );

    await client.close();
  });

  await t.step("markProgress and markNoProgress", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;

    // Create an arc with two members
    const createResult = await arcTracker.createArc({
      name: "Daily Workout",
      members: new Set([userA, userB]),
      stat: Stat.HP,
    });
    const arcId = createResult.arc;

    // Test case 1: Mark progress for user A
    let markProgressResult = await arcTracker.markProgress({ user: userA, arc: arcId });
    assertEquals(markProgressResult.progress.length, 2);
    let aliceProgress = markProgressResult.progress.find(p => p.user === userA);
    let bobProgress = markProgressResult.progress.find(p => p.user === userB);
    assertEquals(aliceProgress?.dailyProgress, true);
    assertEquals(bobProgress?.dailyProgress, false);

    // Test case 2: Mark progress for user B
    markProgressResult = await arcTracker.markProgress({ user: userB, arc: arcId });
    assertEquals(markProgressResult.progress.length, 2);
    aliceProgress = markProgressResult.progress.find(p => p.user === userA);
    bobProgress = markProgressResult.progress.find(p => p.user === userB);
    assertEquals(aliceProgress?.dailyProgress, true);
    assertEquals(bobProgress?.dailyProgress, true);

    // Test case 3: Mark progress again for user A (should not change state)
    const initialProgressState = JSON.stringify(markProgressResult.progress);
    markProgressResult = await arcTracker.markProgress({ user: userA, arc: arcId });
    assertEquals(JSON.stringify(markProgressResult.progress), initialProgressState);

    // Test case 4: Mark no progress for user A
    let markNoProgressResult = await arcTracker.markNoProgress({ user: userA, arc: arcId });
    assertEquals(markNoProgressResult.progress.length, 2);
    aliceProgress = markNoProgressResult.progress.find(p => p.user === userA);
    bobProgress = markNoProgressResult.progress.find(p => p.user === userB);
    assertEquals(aliceProgress?.dailyProgress, false);
    assertEquals(bobProgress?.dailyProgress, true);

    // Test case 5: Mark no progress again for user A (should not change state)
    const initialStateAfterNoProgress = JSON.stringify(markNoProgressResult.progress);
    markNoProgressResult = await arcTracker.markNoProgress({ user: userA, arc: arcId });
    assertEquals(JSON.stringify(markNoProgressResult.progress), initialStateAfterNoProgress);

    // Test case 6: Mark progress for user A again to test streak logic later
    await arcTracker.markProgress({ user: userA, arc: arcId });

    // Test case 7: Mark progress for non-existent user (should throw)
    const nonMemberUser = "user:David" as ID;
    assertThrows(
      async () => {
        await arcTracker.markProgress({ user: nonMemberUser, arc: arcId });
      },
      Error,
      `User ${nonMemberUser} is not a member of arc ${arcId} or has no progress entry.`
    );

    // Test case 8: Mark progress for non-existent arc (should throw)
    const nonExistentArcId = "arc:nonexistent" as ID;
    assertThrows(
      async () => {
        await arcTracker.markProgress({ user: userA, arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );

    await client.close();
  });

  await t.step("getArcStatus", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;

    // Create an arc
    const createResult = await arcTracker.createArc({
      name: "Read Book",
      members: new Set([userA, userB]),
      stat: Stat.Intelligence,
    });
    const arcId = createResult.arc;

    // Initial status
    let statusResult = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(statusResult.status, { [userA]: false, [userB]: false });

    // Mark progress for user A
    await arcTracker.markProgress({ user: userA, arc: arcId });
    statusResult = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(statusResult.status, { [userA]: true, [userB]: false });

    // Mark progress for user B
    await arcTracker.markProgress({ user: userB, arc: arcId });
    statusResult = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(statusResult.status, { [userA]: true, [userB]: true });

    // Mark no progress for user A
    await arcTracker.markNoProgress({ user: userA, arc: arcId });
    statusResult = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(statusResult.status, { [userA]: false, [userB]: true });

    // Test getting status for a non-existent arc (should throw)
    const nonExistentArcId = "arc:nonexistent" as ID;
    assertThrows(
      async () => {
        await arcTracker.getArcStatus({ arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );

    await client.close();
  });

  await t.step("updateArcStreak", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;
    const userC = "user:Charlie" as ID;

    // Create an arc with three members
    const createResult = await arcTracker.createArc({
      name: "Team Goal",
      members: new Set([userA, userB, userC]),
      stat: Stat.Strength,
    });
    const arcId = createResult.arc;

    // Test case 1: Initial streak update (should be 0 as no one progressed)
    let streakUpdate1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate1.newStreak, 0);

    // Mark progress for A and B
    await arcTracker.markProgress({ user: userA, arc: arcId });
    await arcTracker.markProgress({ user: userB, arc: arcId });
    // Charlie hasn't progressed

    // Test case 2: Streak update after partial progress (should reset to 0)
    let streakUpdate2 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate2.newStreak, 0);

    // Mark progress for Charlie too
    await arcTracker.markProgress({ user: userC, arc: arcId });

    // Test case 3: Streak update after all members progress (should increment)
    let streakUpdate3 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate3.newStreak, 1); // Initial streak was 0, now it's 1

    // Test case 4: Another increment if all progress again
    await arcTracker.updateArcStreak({ arc: arcId }); // This should increment again from 1 to 2
    const finalStreak = await db.collection("ArcTracking.arcs").findOne({_id: arcId});
    assertEquals(finalStreak?.streak, 2);


    // Test case 5: Reset streak by marking no progress
    await arcTracker.markNoProgress({ user: userA, arc: arcId });
    let streakUpdate4 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakUpdate4.newStreak, 0); // Streak resets to 0

    // Test case 6: Update streak for non-existent arc (should throw)
    const nonExistentArcId = "arc:nonexistent" as ID;
    assertThrows(
      async () => {
        await arcTracker.updateArcStreak({ arc: nonExistentArcId });
      },
      Error,
      `Arc with ID ${nonExistentArcId} not found.`
    );

    await client.close();
  });

  await t.step("getArcs", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userA = "user:Alice" as ID;
    const userB = "user:Bob" as ID;
    const userC = "user:Charlie" as ID;

    // Create some arcs
    const arc1Result = await arcTracker.createArc({ name: "Arc Alpha", members: new Set([userA, userB]), stat: Stat.Agility });
    const arc1Id = arc1Result.arc;
    const arc2Result = await arcTracker.createArc({ name: "Arc Beta", members: new Set([userA, userC]), stat: Stat.Intelligence });
    const arc2Id = arc2Result.arc;
    const arc3Result = await arcTracker.createArc({ name: "Arc Gamma", members: new Set([userA]), stat: Stat.Strength });
    const arc3Id = arc3Result.arc;

    // Manually set streaks to test sorting
    await db.collection("ArcTracking.arcs").updateOne({ _id: arc1Id }, { $set: { streak: 5 } });
    await db.collection("ArcTracking.arcs").updateOne({ _id: arc2Id }, { $set: { streak: 10 } });
    await db.collection("ArcTracking.arcs").updateOne({ _id: arc3Id }, { $set: { streak: 5 } });

    // Test case 1: Get arcs for user A (should be sorted)
    // Expected order: Arc Beta (streak 10), Arc Alpha (streak 5, alphabetical), Arc Gamma (streak 5)
    let arcsForA = await arcTracker.getArcs({ user: userA });
    assertEquals(arcsForA.arcs.length, 3);
    assertEquals(arcsForA.arcs, [arc2Id, arc1Id, arc3Id]); // Sorted by streak DESC, then name ASC

    // Test case 2: Get arcs for user B (only Arc Alpha)
    let arcsForB = await arcTracker.getArcs({ user: userB });
    assertEquals(arcsForB.arcs.length, 1);
    assertEquals(arcsForB.arcs, [arc1Id]);

    // Test case 3: Get arcs for user C (only Arc Beta)
    let arcsForC = await arcTracker.getArcs({ user: userC });
    assertEquals(arcsForC.arcs.length, 1);
    assertEquals(arcsForC.arcs, [arc2Id]);

    // Test case 4: Get arcs for a user not in any arc
    const userD = "user:David" as ID;
    let arcsForD = await arcTracker.getArcs({ user: userD });
    assertEquals(arcsForD.arcs.length, 0);

    // Test case 5: Get arcs for a user that doesn't "exist" in the system (still returns empty as they won't be found in any arc)
    const nonExistentUser = "user:NonExistent" as ID;
    let arcsForNonExistent = await arcTracker.getArcs({ user: nonExistentUser });
    assertEquals(arcsForNonExistent.arcs.length, 0);

    await client.close();
  });
});

// Mocking Stat enum for import if it's not globally available or exported from ArcTrackingConcept
// In a real setup, you'd ensure Stat is properly exported.
// For this standalone test file, we can redefine it if the concept export doesn't include it directly.
// However, the provided implementation exports Stat, so this should work.
// If the import `from "../../src/ArcTracking/ArcTrackingConcept.ts"` fails for Stat, uncomment this:
/*
enum Stat {
  HP = "HP",
  Stamina = "Stamina",
  Strength = "Strength",
  Agility = "Agility",
  Intelligence = "Intelligence",
}
*/
```

### Test Implementation Details:

1. **`testDb` Utility**: The `testDb` function from `@utils/database.ts` is used to set up a clean MongoDB instance for each test file. This ensures tests are isolated.
2. **`Deno.test` Structure**: Tests are organized using `Deno.test` and `t.step` for logical grouping of tests for each action.
3. **Concept Instantiation**: An instance of `ArcTrackingConcept` is created within each step, passing the `db` object obtained from `testDb`.
4. **Helper User IDs**: String IDs are created for users (`"user:Alice" as ID`) and arcs (`"arc:..." as ID`) to simulate real-world identifiers.
5. **Assertions**:
   * `assertEquals` is used to check for exact matches in values.
   * `assert` is used to check for the existence of a value or a truthy condition.
   * `assertThrows` is used to verify that specific errors are thrown under expected error conditions (e.g., trying to operate on a non-existent arc or user).
6. **State Verification**: After performing actions, tests often re-fetch data directly from the MongoDB collection (e.g., `db.collection("ArcTracking.arcs").findOne(...)`) to assert the state changes, ensuring that the `effects` of the actions are correctly applied.
7. **Precondition Testing**: Where applicable, tests explicitly try to violate preconditions (e.g., adding a member to a non-existent arc, marking progress for a non-member) to ensure the concept behaves as expected (throws errors or returns specific results).
8. **Return Value Testing**: The return values of actions are checked to ensure they match the specified return types and contain the expected data.
9. **Sorting Logic**: The `getArcs` test specifically verifies the sorting order based on streak count (descending) and then arc name (alphabetical).
10. **Edge Cases**: Tests cover scenarios like adding existing members, marking progress when it's already set, or getting arcs for users not in any arc.
11. **Error Handling Validation**: Tests specifically check that errors are thrown when preconditions are not met (e.g., non-existent arc/user) and that valid return types are provided for successful operations.

This suite of tests covers the core functionality of each action, its requirements, and its effects as defined in the `ArcTracking` concept specification.

***

### Trace for Principle Fulfillment:

**Principle:** an arc consists of a daily habit or set of tasks; progress counts only if completed, and in group arcs, progress counts only if all members complete their tasks.

**Trace:**

1. **`createArc`**: A group arc is created for a habit (e.g., "Morning Exercise").
   * `const { arc: morningExerciseArcId } = await arcTracker.createArc({ name: "Morning Exercise", members: new Set([userA, userB]), stat: Stat.Stamina });`
   * This establishes the arc, its members, and initializes their `dailyProgress` to `false`.

2. **`markProgress` (partial completion)**: One member completes their task.
   * `await arcTracker.markProgress({ user: userA, arc: morningExerciseArcId });`
   * The state for `userA`'s `dailyProgress` is set to `true`. `userB`'s remains `false`.

3. **`updateArcStreak` (partial completion)**: The streak is checked. Since not all members completed their task (`userB` is `false`), the streak resets to `0`.
   * `const streakResult1 = await arcTracker.updateArcStreak({ arc: morningExerciseArcId });`
   * `assertEquals(streakResult1.newStreak, 0);`

4. **`markProgress` (full completion)**: The other member also completes their task.
   * `await arcTracker.markProgress({ user: userB, arc: morningExerciseArcId });`
   * The state for `userB`'s `dailyProgress` is set to `true`. Both members now have `true` progress.

5. **`updateArcStreak` (full completion)**: The streak is checked again. Now that all members have completed their task (`dailyProgress` is `true` for both `userA` and `userB`), the streak increments.
   * `const streakResult2 = await arcTracker.updateArcStreak({ arc: morningExerciseArcId });`
   * `assertEquals(streakResult2.newStreak, 1);` (Assuming initial streak was 0).

This sequence demonstrates:

* Arcs are created for habits.
* Progress is tracked individually.
* Group progress (for streak increment) only counts if *all* members complete their tasks.
* If any member fails, the streak resets, fulfilling the principle.
