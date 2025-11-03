import { assertEquals, assert } from "jsr:@std/assert";
import RewardingConcept, { Rarity, Avatar } from "./RewardingConcept.ts"; 
import { testDb } from "@utils/database.ts"; 
import { ID } from "@utils/types.ts";


console.log("✅ Concept: REWARDING\n Operational principle: users earn avatar points by completing arcs and maintaining streaks; points are spent in a gacha system that yields avatars based on user stat distribution\n");
Deno.test("1. Initialization and Basic Operations", async (t) => {
  const [db, client] = await testDb();
  const rewarding = new RewardingConcept(db);

  const userA = "user:Alice" as ID;
  const userB = "user:Bob" as ID;
  const commonAvatar = "avatar:common_sword" as Avatar;
  const rareAvatar = "avatar:rare_shield" as Avatar;
  const epicAvatar = "avatar:epic_armor" as Avatar;
  const legendaryAvatar = "avatar:legendary_helm" as Avatar;

  // Setup: Add some avatar definitions
  await rewarding.avatarDefinitions.insertMany([
    { _id: commonAvatar, name: "Common Sword", rarity: "common", statAffinity: [{ stat: "Strength", value: 5 }] },
    { _id: rareAvatar, name: "Rare Shield", rarity: "rare", statAffinity: [{ stat: "HP", value: 10 }] },
    { _id: epicAvatar, name: "Epic Armor", rarity: "epic", statAffinity: [{ stat: "HP", value: 15 }, { stat: "Stamina", value: 5 }] },
    { _id: legendaryAvatar, name: "Legendary Helm", rarity: "legendary", statAffinity: [{ stat: "Intelligence", value: 20 }] },
  ]);

  await t.step("initializeRewards: successfully initializes rewards for a new user", async () => {
    await rewarding.initializeRewards({ user: userA });
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null, "Reward details should exist for userA");
    assertEquals(reward!.points, 0, "Initial points should be 0");
    assertEquals(reward!.ownedAvatars, [], "Initial owned avatars should be an empty array");
  });

  await t.step("initializeRewards: idempotent - does not re-initialize if user already exists", async () => {
    await rewarding.initializeRewards({ user: userA });
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null, "Reward details should still exist for userA");
    assertEquals(reward!.points, 0, "Points should remain 0 after re-initialization");
    assertEquals(reward!.ownedAvatars, [], "Owned avatars should remain empty after re-initialization");
  });

  await t.step("earnPoints: successfully adds points to a user's balance", async () => {
    await rewarding.earnPoints({ user: userA, points: 100 });
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null);
    assertEquals(reward!.points, 100);
  });

  await t.step("earnPoints: successfully adds more points", async () => {
    await rewarding.earnPoints({ user: userA, points: 50 });
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null);
    assertEquals(reward!.points, 150);
  });

  await t.step("earnPoints: requires user exists", async () => {
    const result = await rewarding.earnPoints({ user: userB, points: 50 });
    assert(result.error !== undefined, "Should return an error if user does not exist");
    assertEquals(result.error, "User user:Bob not found.");
  });

  await t.step("earnPoints: handles zero points correctly (no change)", async () => {
    await rewarding.earnPoints({ user: userA, points: 0 });
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null);
    assertEquals(reward!.points, 150); // Should remain the same
  });

  await t.step("earnPoints: handles negative points as an error", async () => {
    const result = await rewarding.earnPoints({ user: userA, points: -20 });
    assert(result.error !== undefined, "Should return an error for negative points");
    assertEquals(result.error, "Cannot earn negative points.");
    const reward = await rewarding._getRewardDetails({ user: userA });
    assert(reward !== null);
    assertEquals(reward!.points, 150); // Should remain the same
  });

  await t.step("listAvatars: returns an empty array for a user with no avatars", async () => {
    await rewarding.initializeRewards({ user: userB }); // Ensure userB is initialized
    const result = await rewarding.listAvatars({ user: userB }) as { avatars: Avatar[]; error?: string }; // <- cast to allow error
    assertEquals(result.avatars, [], "Should return an empty array if no avatars are owned");
  });

  await t.step("listAvatars: returns owned avatars", async () => {
    await rewarding.rewards.updateOne({ _id: userA }, { $push: { ownedAvatars: commonAvatar } });
    await rewarding.rewards.updateOne({ _id: userA }, { $push: { ownedAvatars: rareAvatar } });

    const { avatars } = await rewarding.listAvatars({ user: userA }) as { avatars: Avatar[]; error?: string };
    assertEquals(avatars.length, 2, "Should return two owned avatars");
    assert(avatars.includes(commonAvatar), "Owned avatars should include commonAvatar");
    assert(avatars.includes(rareAvatar), "Owned avatars should include rareAvatar");
  });

  await t.step("listAvatars: requires user exists", async () => {
    const result = await rewarding.listAvatars({ user: "user:nonexistent" as ID }) as { avatars: Avatar[]; error?: string };
    assertEquals(result.avatars, [], "Should return empty avatars if user does not exist");
    assert(result.error !== undefined, "Should return an error if user does not exist");
    assertEquals(result.error, "User user:nonexistent not found.");
  });

  await t.step("getRarity: handles invalid rarity", async () => {
    const result = await rewarding.getRarity({ rarity: "mythic" as Rarity }) as { chance: number; error?: string };
    assertEquals(result.chance, 0);
    assert(result.error !== undefined, "Should return an error for invalid rarity");
    assertEquals(result.error, "Invalid rarity: mythic");
  });

  await client.close();
});

Deno.test("2. Rewarding Concept - pickRandomAvatar", async (t) => {
  const [db, client] = await testDb();
  const rewarding = new RewardingConcept(db);

  const userA = "user:Alice" as ID;

  const allAvatarIds: Avatar[] = [
    "avatar:common_1" as Avatar,
    "avatar:common_2" as Avatar,
    "avatar:rare_1" as Avatar,
    "avatar:epic_1" as Avatar,
    "avatar:legendary_1" as Avatar,
  ];

  await rewarding.avatarDefinitions.insertMany([
    { _id: allAvatarIds[0], name: "Common Sword 1", rarity: "common", statAffinity: [] },
    { _id: allAvatarIds[1], name: "Common Sword 2", rarity: "common", statAffinity: [] },
    { _id: allAvatarIds[2], name: "Rare Shield", rarity: "rare", statAffinity: [] },
    { _id: allAvatarIds[3], name: "Epic Armor", rarity: "epic", statAffinity: [] },
    { _id: allAvatarIds[4], name: "Legendary Helm", rarity: "legendary", statAffinity: [] },
  ]);

  await rewarding.initializeRewards({ user: userA });

  await t.step("pickRandomAvatar: handles empty availableAvatarIds array", async () => {
    const result = await rewarding.pickRandomAvatar({ availableAvatarIds: [] }) as { avatar: Avatar; error?: string };
    assert(result.avatar === "" as Avatar, "Should return a zero-value ID for empty input");
    assert(result.error !== undefined, "Should return an error for empty input");
    assertEquals(result.error, "No available avatars to pick from.");
  });

  await t.step("pickRandomAvatar: handles invalid avatar IDs in the input list", async () => {
    const invalidAvatarId = "avatar:invalid_one" as Avatar;
    const result = await rewarding.pickRandomAvatar({ availableAvatarIds: [invalidAvatarId] }) as { avatar: Avatar; error?: string };
    assert(result.avatar === "" as Avatar, "Should return a zero-value ID if no valid avatars are found");
    assert(result.error !== undefined, "Should return an error if no valid avatars are found");
    assertEquals(result.error, "None of the provided avatar IDs are valid definitions.");
  });

  await client.close();
});
