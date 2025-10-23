---
timestamp: 'Thu Oct 23 2025 16:46:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_164636.ebce8699.md]]'
content_id: c37cbff221f9c8909c7880a99cce07c634aaff8d81cb99e36bb59ec63392a4c1
---

# file: src/ArcTracking/ArcTrackingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import ArcTrackingConcept from "./ArcTrackingConcept.ts";
import { assertEquals } from "@jsr/@std/assert";
import { ID } from "@utils/types.ts"; // Still using ID type here for consistency in tests, though implementation uses string

// Enum for Stat, matching the implementation
enum Stat {
  HP = "HP",
  Stamina = "Stamina",
  Strength = "Strength",
  Agility = "Agility",
  Intelligence = "Intelligence",
}

Deno.test("ArcTrackingConcept", async (t) => {
  const [db, client] = await testDb();
  const arcTracker = new ArcTrackingConcept(db);

  // Mock users
  const userAlice: ID = "user:Alice" as ID;
  const userBob: ID = "user:Bob" as ID;
  const userCharlie: ID = "user:Charlie" as ID;
  const userDavid: ID = "user:David" as ID;

  t.step("createArc: creates a new arc with correct initial state", async () => {
    const initialMembers = new Set([userAlice, userBob]);
    const createResult = await arcTracker.createArc({
      name: "Morning Run",
      members: initialMembers,
      stat: Stat.Stamina,
    });
    const arcId: ID = createResult.arc;

    const createdArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });

    assertEquals(createdArc?.name, "Morning Run");
    assertEquals(createdArc?.stat, Stat.Stamina);
    assertEquals(createdArc?.members.sort(), [userAlice, userBob].sort());
    assertEquals(createdArc?.streak, 0);
    assertEquals(createdArc?.progress.length, 2);
    assertEquals(createdArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
    assertEquals(createdArc?.progress.find((p) => p.user === userBob)?.dailyProgress, false);
  });

  t.step("createArc: handles empty members list", async () => {
    const initialMembers = new Set<ID>(); // Empty set
    const createResult = await arcTracker.createArc({
      name: "Solo Challenge",
      members: initialMembers,
      stat: Stat.Strength,
    });
    const arcId: ID = createResult.arc;

    const createdArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });

    assertEquals(createdArc?.name, "Solo Challenge");
    assertEquals(createdArc?.stat, Stat.Strength);
    assertEquals(createdArc?.members.length, 0); // Should be empty
    assertEquals(createdArc?.streak, 0);
    assertEquals(createdArc?.progress.length, 0); // Should be empty
  });


  t.step("addMemberToArc: adds a user to an existing arc", async () => {
    const initialMembers = new Set([userAlice]);
    const createResult = await arcTracker.createArc({
      name: "Study Group",
      members: initialMembers,
      stat: Stat.Intelligence,
    });
    const arcId: ID = createResult.arc;

    await arcTracker.addMemberToArc({ user: userBob, arc: arcId });

    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.members.includes(userBob), true);
    assertEquals(updatedArc?.progress.find((p) => p.user === userBob)?.dailyProgress, false);
    assertEquals(updatedArc?.members.length, 2); // Alice and Bob
    assertEquals(updatedArc?.progress.length, 2);
  });

  t.step("addMemberToArc: does not add a duplicate member", async () => {
    const initialMembers = new Set([userAlice]);
    const createResult = await arcTracker.createArc({
      name: "Study Group",
      members: initialMembers,
      stat: Stat.Intelligence,
    });
    const arcId: ID = createResult.arc;

    await arcTracker.addMemberToArc({ user: userAlice, arc: arcId }); // Add existing member

    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.members.length, 1); // Should still be only Alice
    assertEquals(updatedArc?.progress.length, 1); // Should still be only Alice's progress
  });

  t.step("markProgress: marks a user's progress to true", async () => {
    const initialMembers = new Set([userAlice, userBob]);
    const createResult = await arcTracker.createArc({
      name: "Fitness Tracker",
      members: initialMembers,
      stat: Stat.Agility,
    });
    const arcId: ID = createResult.arc;

    const progressResult = await arcTracker.markProgress({ user: userAlice, arc: arcId });
    const updatedProgressMap = progressResult.progress;

    assertEquals(updatedProgressMap.find((p) => p.user === userAlice)?.dailyProgress, true);
    assertEquals(updatedProgressMap.find((p) => p.user === userBob)?.dailyProgress, false);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, true);
  });

  t.step("markProgress: idempotent if progress is already true", async () => {
    const initialMembers = new Set([userAlice]);
    const createResult = await arcTracker.createArc({
      name: "Fitness Tracker",
      members: initialMembers,
      stat: Stat.Agility,
    });
    const arcId: ID = createResult.arc;

    // Mark progress the first time
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    const progressResult1 = await arcTracker.markProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResult1.progress.find((p) => p.user === userAlice)?.dailyProgress, true);

    // Verify that the DB operation didn't change anything unnecessarily (e.g., no new version)
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, true);
  });

  t.step("markNoProgress: marks a user's progress to false", async () => {
    const initialMembers = new Set([userAlice, userBob]);
    const createResult = await arcTracker.createArc({
      name: "Daily Habits",
      members: initialMembers,
      stat: Stat.HP,
    });
    const arcId: ID = createResult.arc;

    // First, mark progress to true
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    const progressResultAfterMark = await arcTracker.markProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResultAfterMark.progress.find((p) => p.user === userAlice)?.dailyProgress, true);

    // Then, mark no progress
    const progressResult = await arcTracker.markNoProgress({ user: userAlice, arc: arcId });
    const updatedProgressMap = progressResult.progress;

    assertEquals(updatedProgressMap.find((p) => p.user === userAlice)?.dailyProgress, false);
    assertEquals(updatedProgressMap.find((p) => p.user === userBob)?.dailyProgress, false);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
  });

  t.step("markNoProgress: idempotent if progress is already false", async () => {
    const initialMembers = new Set([userAlice]);
    const createResult = await arcTracker.createArc({
      name: "Daily Habits",
      members: initialMembers,
      stat: Stat.HP,
    });
    const arcId: ID = createResult.arc;

    // Mark no progress initially (default is false)
    const progressResult1 = await arcTracker.markNoProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResult1.progress.find((p) => p.user === userAlice)?.dailyProgress, false);

    // Mark no progress again
    const progressResult2 = await arcTracker.markNoProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResult2.progress.find((p) => p.user === userAlice)?.dailyProgress, false);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.progress.find((p) => p.user === userAlice)?.dailyProgress, false);
  });


  t.step("getArcStatus: returns correct progress for all members", async () => {
    const initialMembers = new Set([userAlice, userBob, userCharlie]);
    const createResult = await arcTracker.createArc({
      name: "Team Project",
      members: initialMembers,
      stat: Stat.Intelligence,
    });
    const arcId: ID = createResult.arc;

    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userCharlie, arc: arcId });

    const statusResult = await arcTracker.getArcStatus({ arc: arcId });
    const statusMap = statusResult.status;

    assertEquals(statusMap[userAlice], true);
    assertEquals(statusMap[userBob], false);
    assertEquals(statusMap[userCharlie], true);
    assertEquals(Object.keys(statusMap).length, 3);
  });

  t.step("updateArcStreak: increments streak if all members complete tasks", async () => {
    const initialMembers = new Set([userAlice, userBob]);
    const createResult = await arcTracker.createArc({
      name: "Daily Coding",
      members: initialMembers,
      stat: Stat.Agility,
    });
    const arcId: ID = createResult.arc;

    // Mark progress for both users
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });

    // Update streak for the first time
    const streakResult1 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult1.newStreak, 1);

    // Mark progress again for the second day
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });

    // Update streak for the second time
    const streakResult2 = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult2.newStreak, 2);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.streak, 2);
  });

  t.step("updateArcStreak: resets streak to 0 if any member does not complete tasks", async () => {
    const initialMembers = new Set([userAlice, userBob, userCharlie]);
    const createResult = await arcTracker.createArc({
      name: "Team Task",
      members: initialMembers,
      stat: Stat.Strength,
    });
    const arcId: ID = createResult.arc;

    // Mark progress for all users initially to get a streak of 1
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    await arcTracker.markProgress({ user: userCharlie, arc: arcId });
    await arcTracker.updateArcStreak({ arc: arcId }); // Streak becomes 1

    // Now, unmark progress for one user (Bob)
    await arcTracker.markNoProgress({ user: userBob, arc: arcId });

    // Update streak again - should reset to 0
    const streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 0);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.streak, 0);
  });

  t.step("updateArcStreak: streak remains 0 if not all members complete tasks", async () => {
    const initialMembers = new Set([userAlice, userBob]);
    const createResult = await arcTracker.createArc({
      name: "Daily Grind",
      members: initialMembers,
      stat: Stat.HP,
    });
    const arcId: ID = createResult.arc;

    // Ensure streak is 0 initially
    await arcTracker.updateArcStreak({ arc: arcId }); // Will be 0
    const initialStreak = await db.collection("ArcTracking.arcs").findOne({ _id: arcId })?.streak;
    assertEquals(initialStreak, 0);

    // Mark progress for one, not both
    await arcTracker.markProgress({ user: userAlice, arc: arcId });

    // Update streak - should remain 0
    const streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 0);

    // Verify in DB
    const updatedArc = await db.collection("ArcTracking.arcs").findOne({ _id: arcId });
    assertEquals(updatedArc?.streak, 0);
  });


  t.step("getArcs: returns user's arcs sorted by streak (desc) then name (asc)", async () => {
    // Create multiple arcs with varying streaks and names
    const aliceArc1Create = await arcTracker.createArc({ name: "Arc Alpha", members: new Set([userAlice]), stat: Stat.HP });
    const aliceArc1Id: ID = aliceArc1Create.arc;
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc1Id });
    await arcTracker.updateArcStreak({ arc: aliceArc1Id }); // Streak 1

    const aliceArc2Create = await arcTracker.createArc({ name: "Arc Beta", members: new Set([userAlice]), stat: Stat.Stamina });
    const aliceArc2Id: ID = aliceArc2Create.arc;
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc2Id });
    await arcTracker.updateArcStreak({ arc: aliceArc2Id }); // Streak 1
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc2Id });
    await arcTracker.updateArcStreak({ arc: aliceArc2Id }); // Streak 2

    const aliceArc3Create = await arcTracker.createArc({ name: "Arc Gamma", members: new Set([userAlice]), stat: Stat.Strength });
    const aliceArc3Id: ID = aliceArc3Create.arc;
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc3Id });
    await arcTracker.updateArcStreak({ arc: aliceArc3Id }); // Streak 1
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc3Id });
    await arcTracker.updateArcStreak({ arc: aliceArc3Id }); // Streak 2
    await arcTracker.markProgress({ user: userAlice, arc: aliceArc3Id });
    await arcTracker.updateArcStreak({ arc: aliceArc3Id }); // Streak 3

    const aliceArc4Create = await arcTracker.createArc({ name: "Arc Delta", members: new Set([userAlice]), stat: Stat.Intelligence });
    const aliceArc4Id: ID = aliceArc4Create.arc;
    // No progress made, streak remains 0.

    // Add Bob to one arc to ensure it's not returned for Alice
    const bobArcCreate = await arcTracker.createArc({ name: "Bob's Goal", members: new Set([userBob]), stat: Stat.Agility });
    const bobArcId: ID = bobArcCreate.arc;

    const result = await arcTracker.getArcs({ user: userAlice });
    const sortedArcIds = result.arcs;

    // Expected order: Gamma (3), Beta (2), Alpha (1), Delta (0)
    // With tie-breaking: Gamma, Beta, Alpha, Delta
    assertEquals(sortedArcIds.length, 4);
    assertEquals(sortedArcIds[0], aliceArc3Id); // Streak 3
    assertEquals(sortedArcIds[1], aliceArc2Id); // Streak 2, Name Beta
    assertEquals(sortedArcIds[2], aliceArc1Id); // Streak 1, Name Alpha
    assertEquals(sortedArcIds[3], aliceArc4Id); // Streak 0, Name Delta

    // Check that Bob's arc is not returned for Alice
    assertEquals(sortedArcIds.includes(bobArcId), false);
  });

  // Test edge cases and error handling for preconditions where appropriate
  t.step("addMemberToArc: throws error if arc does not exist", async () => {
    const nonExistentArcId: ID = "arc:nonexistent" as ID;
    await arcTracker.addMemberToArc({ user: userAlice, arc: nonExistentArcId }).catch((e) => {
      assertEquals(e.message, `Arc with ID ${nonExistentArcId} not found.`);
    });
  });

  t.step("markProgress: throws error if user is not in arc", async () => {
    const createResult = await arcTracker.createArc({ name: "Solo", members: new Set([userAlice]), stat: Stat.HP });
    const arcId: ID = createResult.arc;

    await arcTracker.markProgress({ user: userBob, arc: arcId }).catch((e) => {
      assertEquals(e.message, `User ${userBob} is not a member of arc ${arcId} or has no progress entry.`);
    });
  });

  t.step("markProgress: throws error if arc does not exist", async () => {
    const nonExistentArcId: ID = "arc:nonexistent" as ID;
    await arcTracker.markProgress({ user: userAlice, arc: nonExistentArcId }).catch((e) => {
      assertEquals(e.message, `Arc with ID ${nonExistentArcId} not found.`);
    });
  });

  t.step("getArcStatus: throws error if arc does not exist", async () => {
    const nonExistentArcId: ID = "arc:nonexistent" as ID;
    await arcTracker.getArcStatus({ arc: nonExistentArcId }).catch((e) => {
      assertEquals(e.message, `Arc with ID ${nonExistentArcId} not found.`);
    });
  });

  t.step("updateArcStreak: throws error if arc does not exist", async () => {
    const nonExistentArcId: ID = "arc:nonexistent" as ID;
    await arcTracker.updateArcStreak({ arc: nonExistentArcId }).catch((e) => {
      assertEquals(e.message, `Arc with ID ${nonExistentArcId} not found.`);
    });
  });

  t.step("getArcs: returns empty array if user is not in any arcs", async () => {
    const result = await arcTracker.getArcs({ user: "user:Nobody" as ID });
    assertEquals(result.arcs.length, 0);
  });


  await client.close();
});
```
