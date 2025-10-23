---
timestamp: 'Thu Oct 23 2025 17:45:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_174502.fdff9810.md]]'
content_id: c7d483866bbd2002b136072c575f7ec3688c7e14738196c1e5a1d24660261072
---

# response:

```typescript
# file: src/ArcTracking/ArcTrackingConcept.test.ts

import { testDb } from "@utils/database.ts";
import { assertEquals } from "@jsr/std/assert";
import ArcTrackingConcept from "./ArcTrackingConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("ArcTracking Concept", async (t) => {
  await t.step("should allow users to create and manage arcs", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userAlice = "user:Alice" as ID;
    const userBob = "user:Bob" as ID;
    const userCharlie = "user:Charlie" as ID;

    // 1. Test createArc
    const { arc: arc1Id } = await arcTracker.createArc({
      name: "Morning Meditation",
      members: [userAlice, userBob],
    });
    assertEquals(typeof arc1Id, "string"); // Check if an ID is returned

    const { arc: arc2Id } = await arcTracker.createArc({
      name: "Evening Reading",
      members: [userAlice],
    });
    assertEquals(typeof arc2Id, "string");

    const { arc: arc3Id } = await arcTracker.createArc({
      name: "Weekend Hike",
      members: [], // Empty members set
    });
    assertEquals(typeof arc3Id, "string");

    // Test getArcs for a user after creation
    let userArcs = await arcTracker.getArcs({ user: userAlice });
    assertEquals(userArcs.arcs.length, 2);
    assertEquals(userArcs.arcs, [arc1Id, arc2Id]); // Order should be based on streak (both 0) and then name

    userArcs = await arcTracker.getArcs({ user: userBob });
    assertEquals(userArcs.arcs.length, 1);
    assertEquals(userArcs.arcs, [arc1Id]);

    userArcs = await arcTracker.getArcs({ user: userCharlie });
    assertEquals(userArcs.arcs.length, 0);

    await client.close();
  });

  await t.step("should allow adding members to an arc", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userAlice = "user:Alice" as ID;
    const userBob = "user:Bob" as ID;
    const userCharlie = "user:Charlie" as ID;

    const { arc: arcId } = await arcTracker.createArc({
      name: "Fitness Challenge",
      members: [userAlice],
    });

    // 1. Add Bob to the arc
    await arcTracker.addMemberToArc({ user: userBob, arc: arcId });
    let status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.length, 2);
    const bobProgress = status.status.find(p => p.user === userBob);
    assertEquals(bobProgress?.dailyProgress, false);

    // 2. Add Charlie to the arc
    await arcTracker.addMemberToArc({ user: userCharlie, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.length, 3);
    const charlieProgress = status.status.find(p => p.user === userCharlie);
    assertEquals(charlieProgress?.dailyProgress, false);

    // 3. Try to add an existing member (should have no effect)
    await arcTracker.addMemberToArc({ user: userAlice, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.length, 3); // Still 3 members

    await client.close();
  });

  await t.step("should allow marking progress and no progress for a user", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userAlice = "user:Alice" as ID;
    const userBob = "user:Bob" as ID;

    const { arc: arcId } = await arcTracker.createArc({
      name: "Learning Session",
      members: [userAlice, userBob],
    });

    // 1. Mark progress for Alice
    let progressResult = await arcTracker.markProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResult.progress.find(p => p.user === userAlice)?.dailyProgress, true);
    assertEquals(progressResult.progress.find(p => p.user === userBob)?.dailyProgress, false);

    // Verify status
    let status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.find(p => p.user === userAlice)?.dailyProgress, true);
    assertEquals(status.status.find(p => p.user === userBob)?.dailyProgress, false);

    // 2. Mark no progress for Alice
    progressResult = await arcTracker.markNoProgress({ user: userAlice, arc: arcId });
    assertEquals(progressResult.progress.find(p => p.user === userAlice)?.dailyProgress, false);
    assertEquals(progressResult.progress.find(p => p.user === userBob)?.dailyProgress, false);

    // Verify status
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.find(p => p.user === userAlice)?.dailyProgress, false);
    assertEquals(status.status.find(p => p.user === userBob)?.dailyProgress, false);

    // 3. Mark progress for Bob
    progressResult = await arcTracker.markProgress({ user: userBob, arc: arcId });
    assertEquals(progressResult.progress.find(p => p.user === userAlice)?.dailyProgress, false);
    assertEquals(progressResult.progress.find(p => p.user === userBob)?.dailyProgress, true);

    await client.close();
  });

  await t.step("should correctly update arc streak", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userAlice = "user:Alice" as ID;
    const userBob = "user:Bob" as ID;

    // 1. Create an arc
    const { arc: arcId } = await arcTracker.createArc({
      name: "Daily Goals",
      members: [userAlice, userBob],
    });
    let status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.length, 2);

    // 2. First day: No progress from anyone
    let streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 0); // Streak resets to 0

    // Verify progress reset for the next day
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.every(p => p.dailyProgress === false), true);

    // 3. Second day: Alice progresses
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.find(p => p.user === userAlice)?.dailyProgress, true);
    assertEquals(status.status.find(p => p.user === userBob)?.dailyProgress, false);

    streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 0); // Streak resets as Bob didn't progress

    // Verify progress reset for the next day
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.every(p => p.dailyProgress === false), true);

    // 4. Third day: Both Alice and Bob progress
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.every(p => p.dailyProgress === true), true);

    streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 1); // Streak increments to 1

    // Verify progress reset for the next day
    status = await arcTracker.getArcStatus({ arc: arcId });
    assertEquals(status.status.every(p => p.dailyProgress === false), true);

    // 5. Fourth day: Both progress again
    await arcTracker.markProgress({ user: userAlice, arc: arcId });
    await arcTracker.markProgress({ user: userBob, arc: arcId });
    streakResult = await arcTracker.updateArcStreak({ arc: arcId });
    assertEquals(streakResult.newStreak, 2); // Streak increments to 2

    await client.close();
  });

  await t.step("should order arcs by streak count and name", async () => {
    const [db, client] = await testDb();
    const arcTracker = new ArcTrackingConcept(db);

    const userAlice = "user:Alice" as ID;

    // Create arcs with varying streaks and names
    const { arc: arcA } = await arcTracker.createArc({ name: "Arc C", members: [userAlice] }); // streak 0
    const { arc: arcB } = await arcTracker.createArc({ name: "Arc A", members: [userAlice] }); // streak 0
    const { arc: arcC } = await arcTracker.createArc({ name: "Arc B", members: [userAlice] }); // streak 0

    // Manually set streaks for testing order
    await db.collection("ArcTracking.arcs").updateOne({ _id: arcA }, { $set: { streak: 5, name: "Arc C" } });
    await db.collection("ArcTracking.arcs").updateOne({ _id: arcB }, { $set: { streak: 2, name: "Arc A" } });
    await db.collection("ArcTracking.arcs").updateOne({ _id: arcC }, { $set: { streak: 5, name: "Arc B" } });

    const userArcs = await arcTracker.getArcs({ user: userAlice });

    // Expected order: arcC (streak 5, name "Arc C"), arcA (streak 5, name "Arc B"), arcB (streak 2, name "Arc A")
    // The sort is streak DESC, name ASC
    assertEquals(userArcs.arcs, [arcA, arcC, arcB]);

    await client.close();
  });
});
```
