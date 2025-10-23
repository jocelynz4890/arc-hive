import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
import StatTrackingConcept from "./StatTrackingConcept.ts";

const createUser = (id: string): string => `user:${id}`;

console.log("✅ Concept: STAT TRACKING\n Operational principle: each completed task from a user's arc contributes points to one stat; the number of completed tasks corresponding to a stat will be displayed in the stat's progress bar, out of the number of total tasks for that stat. This way, uncompleted tasks are visible in the stat's progress bar\n");

Deno.test("1. StatTrackingConcept - Initialize Stats", async (t) => {
  const [db, client] = await testDb();
  const statTracking = new StatTrackingConcept(db);

  await t.step("should initialize stats for a new user with all values at 0", async () => {
    const userAlice = createUser("Alice");
    const initializedStats = await statTracking.initializeStats({ user: userAlice });

    assertEquals(initializedStats.user, userAlice);
    assertEquals(initializedStats.hp.completed, 0);
    assertEquals(initializedStats.hp.incompleted, 0);
    assertEquals(initializedStats.stamina.completed, 0);
    assertEquals(initializedStats.stamina.incompleted, 0);
    assertEquals(initializedStats.strength.completed, 0);
    assertEquals(initializedStats.strength.incompleted, 0);
    assertEquals(initializedStats.agility.completed, 0);
    assertEquals(initializedStats.agility.incompleted, 0);
    assertEquals(initializedStats.intelligence.completed, 0);
    assertEquals(initializedStats.intelligence.incompleted, 0);
  });

  await t.step("should idempotent initialize stats for an existing user", async () => {
    const userBob = createUser("Bob");
    await statTracking.initializeStats({ user: userBob });
    await statTracking.updateStatWithCompletedTask({ user: userBob, stat: "Strength", delta: 5 });
    const statsAfterUpdate = await statTracking.getStats({ user: userBob });
    if ("error" in statsAfterUpdate) throw new Error(statsAfterUpdate.error);

    const reInitializedStatsBob = await statTracking.initializeStats({ user: userBob });
    assertEquals(reInitializedStatsBob.strength.completed, 0); // still 0 because initializeStats resets
  });

  await client.close();
});

Deno.test("2. StatTrackingConcept - Get Stats", async (t) => {
  const [db, client] = await testDb();
  const statTracking = new StatTrackingConcept(db);

  await t.step("should return an error if stats are not initialized for a user", async () => {
    const userCharlie = createUser("Charlie");
    const result = await statTracking.getStats({ user: userCharlie });
    assertEquals("error" in result ? result.error : null, `User with ID ${userCharlie} not found.`);
  });

  await t.step("should return correct stats for an initialized user", async () => {
    const userDavid = createUser("David");
    await statTracking.initializeStats({ user: userDavid });
    await statTracking.updateStatWithCompletedTask({ user: userDavid, stat: "HP", delta: 10 });
    await statTracking.updateStatWithIncompleteTask({ user: userDavid, stat: "HP", delta: 2 });
    await statTracking.updateStatWithCompletedTask({ user: userDavid, stat: "Agility", delta: 5 });

    const stats = await statTracking.getStats({ user: userDavid });
    if ("error" in stats) throw new Error(stats.error);

    assertEquals(stats.user, userDavid);
    assertEquals(stats.hp.completed, 10);
    assertEquals(stats.hp.incompleted, 2);
    assertEquals(stats.agility.completed, 5);
    assertEquals(stats.agility.incompleted, 0);
  });

  await client.close();
});

Deno.test("3. StatTrackingConcept - Update Stats", async (t) => {
  const [db, client] = await testDb();
  const statTracking = new StatTrackingConcept(db);

  const user = createUser("Eve");
  await statTracking.initializeStats({ user: user });

  await t.step("requires: user exists", async () => {
    const nonExistentUser = createUser("NonExistent");
    const resultCompleted = await statTracking.updateStatWithCompletedTask({ user: nonExistentUser, stat: "HP", delta: 1 });
    assertEquals("error" in resultCompleted ? resultCompleted.error : null, `User with ID ${nonExistentUser} not found. Please initialize stats first.`);

    const resultIncompleted = await statTracking.updateStatWithIncompleteTask({ user: nonExistentUser, stat: "Stamina", delta: 1 });
    assertEquals("error" in resultIncompleted ? resultIncompleted.error : null, `User with ID ${nonExistentUser} not found. Please initialize stats first.`);
  });

  await t.step("requires: stat is valid", async () => {
    const invalidStat = "Energy";
    const resultCompleted = await statTracking.updateStatWithCompletedTask({ user, stat: invalidStat, delta: 1 });
    assertEquals("error" in resultCompleted ? resultCompleted.error : null, `Invalid stat name: ${invalidStat}. Must be one of HP, Stamina, Strength, Agility, Intelligence.`);

    const resultIncompleted = await statTracking.updateStatWithIncompleteTask({ user, stat: invalidStat, delta: 1 });
    assertEquals("error" in resultIncompleted ? resultIncompleted.error : null, `Invalid stat name: ${invalidStat}. Must be one of HP, Stamina, Strength, Agility, Intelligence.`);
  });

  await t.step("effects: updateStatWithCompletedTask increases completed count", async () => {
    let currentStats = await statTracking.getStats({ user });
    if ("error" in currentStats) throw new Error(currentStats.error);

    const updatedStats1 = await statTracking.updateStatWithCompletedTask({ user, stat: "HP", delta: 10 });
    if ("error" in updatedStats1) throw new Error(updatedStats1.error);
    assertEquals(updatedStats1.hp.completed, 10);

    const updatedStats2 = await statTracking.updateStatWithCompletedTask({ user, stat: "HP", delta: 5 });
    if ("error" in updatedStats2) throw new Error(updatedStats2.error);
    assertEquals(updatedStats2.hp.completed, 15);

    const updatedStats3 = await statTracking.updateStatWithCompletedTask({ user, stat: "Strength", delta: 3 });
    if ("error" in updatedStats3) throw new Error(updatedStats3.error);
    assertEquals(updatedStats3.strength.completed, 3);
  });

  await t.step("effects: updateStatWithIncompleteTask increases incompleted count", async () => {
    await statTracking.initializeStats({ user }); // Reset
    let currentStats = await statTracking.getStats({ user });
    if ("error" in currentStats) throw new Error(currentStats.error);

    const updatedStats1 = await statTracking.updateStatWithIncompleteTask({ user, stat: "Stamina", delta: 7 });
    if ("error" in updatedStats1) throw new Error(updatedStats1.error);
    assertEquals(updatedStats1.stamina.incompleted, 7);

    const updatedStats2 = await statTracking.updateStatWithIncompleteTask({ user, stat: "Stamina", delta: 3 });
    if ("error" in updatedStats2) throw new Error(updatedStats2.error);
    assertEquals(updatedStats2.stamina.incompleted, 10);

    const updatedStats3 = await statTracking.updateStatWithIncompleteTask({ user, stat: "Intelligence", delta: 8 });
    if ("error" in updatedStats3) throw new Error(updatedStats3.error);
    assertEquals(updatedStats3.intelligence.incompleted, 8);
  });

  await t.step("effects: updating completed does not affect incompleted and vice-versa", async () => {
    await statTracking.initializeStats({ user }); // Reset

    await statTracking.updateStatWithCompletedTask({ user, stat: "Agility", delta: 5 });
    let stats = await statTracking.getStats({ user });
    if ("error" in stats) throw new Error(stats.error);
    assertEquals(stats.agility.completed, 5);
    assertEquals(stats.agility.incompleted, 0);

    await statTracking.updateStatWithIncompleteTask({ user, stat: "Agility", delta: 3 });
    stats = await statTracking.getStats({ user });
    if ("error" in stats) throw new Error(stats.error);
    assertEquals(stats.agility.completed, 5);
    assertEquals(stats.agility.incompleted, 3);
  });

  await client.close();
});
