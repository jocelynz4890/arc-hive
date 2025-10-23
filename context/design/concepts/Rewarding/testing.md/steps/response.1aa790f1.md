---
timestamp: 'Thu Oct 23 2025 18:46:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_184654.e40387da.md]]'
content_id: 1aa790f12ebe47d4c1c2410de3eeb6e86ed379532303501ab117584cac49b60f
---

# response:

```typescript
import { assertEquals, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import RewardingConcept from "@concepts/Rewarding/RewardingConcept.ts";

Deno.test("Rewarding Concept - Initialization and Basic Operations", async (t) => {
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
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null, "Reward details should exist for userA");
    assertEquals(reward.points, 0, "Initial points should be 0");
    assertEquals(reward.ownedAvatars, [], "Initial owned avatars should be an empty array");
  });

  await t.step("initializeRewards: idempotent - does not re-initialize if user already exists", async () => {
    // Initialize again, should not error and state should remain unchanged
    await rewarding.initializeRewards({ user: userA });
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null, "Reward details should still exist for userA");
    assertEquals(reward.points, 0, "Points should remain 0 after re-initialization");
    assertEquals(reward.ownedAvatars, [], "Owned avatars should remain empty after re-initialization");
  });

  await t.step("earnPoints: successfully adds points to a user's balance", async () => {
    await rewarding.earnPoints({ user: userA, points: 100 });
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null);
    assertEquals(reward.points, 100);
  });

  await t.step("earnPoints: successfully adds more points", async () => {
    await rewarding.earnPoints({ user: userA, points: 50 });
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null);
    assertEquals(reward.points, 150);
  });

  await t.step("earnPoints: requires user exists", async () => {
    const result = await rewarding.earnPoints({ user: userB, points: 50 });
    assert(result.error !== undefined, "Should return an error if user does not exist");
    assertEquals(result.error, "User user:Bob not found.");
  });

  await t.step("earnPoints: handles zero points correctly (no change)", async () => {
    await rewarding.earnPoints({ user: userA, points: 0 });
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null);
    assertEquals(reward.points, 150); // Should remain the same
  });

  await t.step("earnPoints: handles negative points as an error", async () => {
    const result = await rewarding.earnPoints({ user: userA, points: -20 });
    assert(result.error !== undefined, "Should return an error for negative points");
    assertEquals(result.error, "Cannot earn negative points.");
    const reward = await rewarding._getRewardDetails(userA);
    assert(reward !== null);
    assertEquals(reward.points, 150); // Should remain the same
  });


  await t.step("listAvatars: returns an empty array for a user with no avatars", async () => {
    await rewarding.initializeRewards({ user: userB }); // Ensure userB is initialized
    const { avatars } = await rewarding.listAvatars({ user: userB });
    assertEquals(avatars, [], "Should return an empty array if no avatars are owned");
  });

  await t.step("listAvatars: returns owned avatars", async () => {
    // Manually add an avatar to userA's rewards for testing listAvatars
    await rewarding.rewards.updateOne(
      { _id: userA },
      { $push: { ownedAvatars: commonAvatar } },
    );
    await rewarding.rewards.updateOne(
      { _id: userA },
      { $push: { ownedAvatars: rareAvatar } },
    );

    const { avatars } = await rewarding.listAvatars({ user: userA });
    assertEquals(avatars.length, 2, "Should return two owned avatars");
    assert(avatars.includes(commonAvatar), "Owned avatars should include commonAvatar");
    assert(avatars.includes(rareAvatar), "Owned avatars should include rareAvatar");
  });

  await t.step("listAvatars: requires user exists", async () => {
    const result = await rewarding.listAvatars({ user: "user:nonexistent" as ID });
    assertEquals(result.avatars, [], "Should return empty avatars if user does not exist");
    assert(result.error !== undefined, "Should return an error if user does not exist");
    assertEquals(result.error, "User user:nonexistent not found.");
  });

  await t.step("getRarity: returns correct chance for common rarity", async () => {
    const { chance } = await rewarding.getRarity({ rarity: "common" });
    assertEquals(chance, 65);
  });

  await t.step("getRarity: returns correct chance for rare rarity", async () => {
    const { chance } = await rewarding.getRarity({ rarity: "rare" });
    assertEquals(chance, 25);
  });

  await t.step("getRarity: returns correct chance for epic rarity", async () => {
    const { chance } = await rewarding.getRarity({ rarity: "epic" });
    assertEquals(chance, 9.5);
  });

  await t.step("getRarity: returns correct chance for legendary rarity", async () => {
    const { chance } = await rewarding.getRarity({ rarity: "legendary" });
    assertEquals(chance, 0.5);
  });

  await t.step("getRarity: handles invalid rarity", async () => {
    // @ts-ignore: Testing with invalid input
    const result = await rewarding.getRarity({ rarity: "mythic" });
    assertEquals(result.chance, 0);
    assert(result.error !== undefined, "Should return an error for invalid rarity");
    assertEquals(result.error, "Invalid rarity: mythic");
  });


  await client.close();
});

Deno.test("Rewarding Concept - pickRandomAvatar", async (t) => {
  const [db, client] = await testDb();
  const rewarding = new RewardingConcept(db);

  const userA = "user:Alice" as ID;

  // Define all possible avatars for gacha
  const allAvatarIds: Avatar[] = [
    "avatar:common_1" as Avatar,
    "avatar:common_2" as Avatar,
    "avatar:rare_1" as Avatar,
    "avatar:epic_1" as Avatar,
    "avatar:legendary_1" as Avatar,
  ];

  // Setup: Add avatar definitions
  await rewarding.avatarDefinitions.insertMany([
    { _id: allAvatarIds[0], name: "Common Sword 1", rarity: "common", statAffinity: [] },
    { _id: allAvatarIds[1], name: "Common Sword 2", rarity: "common", statAffinity: [] },
    { _id: allAvatarIds[2], name: "Rare Shield", rarity: "rare", statAffinity: [] },
    { _id: allAvatarIds[3], name: "Epic Armor", rarity: "epic", statAffinity: [] },
    { _id: allAvatarIds[4], name: "Legendary Helm", rarity: "legendary", statAffinity: [] },
  ]);

  // Initialize user
  await rewarding.initializeRewards({ user: userA });

  await t.step("pickRandomAvatar: returns an avatar ID when valid IDs are provided", async () => {
    const { avatar } = await rewarding.pickRandomAvatar({ availableAvatarIds: allAvatarIds });
    assert(avatar !== "", "Should return a valid avatar ID");
    assert(allAvatarIds.includes(avatar), "Returned avatar ID should be one of the provided available IDs");
    const avatarDef = await rewarding._getAvatarDefinition(avatar);
    assert(avatarDef !== null, "Returned avatar ID should correspond to a valid definition");
  });

  await t.step("pickRandomAvatar: handles empty availableAvatarIds array", async () => {
    const result = await rewarding.pickRandomAvatar({ availableAvatarIds: [] });
    assert(result.avatar === "", "Should return a zero-value ID for empty input");
    assert(result.error !== undefined, "Should return an error for empty input");
    assertEquals(result.error, "No available avatars to pick from.");
  });

  await t.step("pickRandomAvatar: handles invalid avatar IDs in the input list", async () => {
    const invalidAvatarId = "avatar:invalid_one" as Avatar;
    const result = await rewarding.pickRandomAvatar({ availableAvatarIds: [invalidAvatarId] });
    assert(result.avatar === "", "Should return a zero-value ID if no valid avatars are found");
    assert(result.error !== undefined, "Should return an error if no valid avatars are found");
    assertEquals(result.error, "None of the provided avatar IDs are valid definitions.");
  });

  await t.step("pickRandomAvatar: distribution check (stochastic, requires many runs)", async () => {
    const numPicks = 10000;
    const pickedCounts: Record<string, number> = {};
    const avatarToRarity: Record<string, Rarity> = {};
    allAvatarIds.forEach(id => {
      const def = rewarding.avatarDefinitions.findOne({ _id: id }); // Mock find for test
      // In a real test, you'd fetch this once before the loop.
      // For simplicity here, assume sync lookup or pre-fetched data.
      // Let's assume the data we inserted is available.
      const knownDef = [
        { _id: allAvatarIds[0], rarity: "common" },
        { _id: allAvatarIds[1], rarity: "common" },
        { _id: allAvatarIds[2], rarity: "rare" },
        { _id: allAvatarIds[3], rarity: "epic" },
        { _id: allAvatarIds[4], rarity: "legendary" },
      ].find(d => d._id === id);
      if (knownDef) avatarToRarity[id] = knownDef.rarity;
    });

    for (let i = 0; i < numPicks; i++) {
      const { avatar } = await rewarding.pickRandomAvatar({ availableAvatarIds: allAvatarIds });
      pickedCounts[avatar] = (pickedCounts[avatar] || 0) + 1;
    }

    // Calculate expected counts based on rarities
    const rarityCounts: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    allAvatarIds.forEach(id => {
      const rarity = avatarToRarity[id];
      if (rarity) rarityCounts[rarity] += 1;
    });

    const totalCommon = rarityCounts.common;
    const totalRare = rarityCounts.rare;
    const totalEpic = rarityCounts.epic;
    const totalLegendary = rarityCounts.legendary;

    // Total weight based on the definition
    const commonChance = rewarding.RARITY_CHANCES.common;
    const rareChance = rewarding.RARITY_CHANCES.rare;
    const epicChance = rewarding.RARITY_CHANCES.epic;
    const legendaryChance = rewarding.RARITY_CHANCES.legendary;

    // Sum of chances for *all* avatars provided in the list.
    // If allAvatarIds contain multiple of the same rarity, their chances sum up.
    const totalChanceInList = (totalCommon * commonChance) + (totalRare * rareChance) + (totalEpic * epicChance) + (totalLegendary * legendaryChance);


    // Calculate expected counts for each specific avatar ID
    const expectedCounts: Record<string, number> = {};
    allAvatarIds.forEach(id => {
        const rarity = avatarToRarity[id];
        if (rarity) {
            const rarityContribution = rarityCounts[rarity] * rewarding.RARITY_CHANCES[rarity];
            expectedCounts[id] = (rarityContribution / totalChanceInList) * numPicks;
        } else {
            expectedCounts[id] = 0; // Should not happen with valid setup
        }
    });

    // Check if picked counts are within a reasonable margin of expected counts
    const tolerance = 0.10; // 10% tolerance for random distribution

    for (const id of allAvatarIds) {
      const picked = pickedCounts[id] || 0;
      const expected = expectedCounts[id] || 0;
      const lowerBound = expected * (1 - tolerance);
      const upperBound = expected * (1 + tolerance);

      // Only check if expected count is significant enough to be meaningful
      if (expected > 5) { // Avoid failing on very low expected counts
        assert(picked >= lowerBound && picked <= upperBound,
          `Avatar ${id}: picked ${picked} (expected ~${expected.toFixed(2)}), outside tolerance ${tolerance * 100}%`
        );
      } else {
        // For very low expected counts, allow some deviation or check for presence if expected is 0
        if (expected === 0) {
          assertEquals(picked, 0, `Avatar ${id}: expected 0 picks, but got ${picked}`);
        }
      }
    }
  });


  // Test principle: Users earn points, which could hypothetically be spent on a gacha.
  // This test focuses on the core mechanics leading up to a gacha.
  await t.step("Principle fulfillment: simulate earning points and trying to pick an avatar", async () => {
    // Ensure userA is initialized and has some points
    await rewarding.initializeRewards({ user: userA });
    await rewarding.earnPoints({ user: userA, points: 500 });

    const rewardBeforeGacha = await rewarding._getRewardDetails(userA);
    assertEquals(rewardBeforeGacha.points, 500);

    // Simulate a gacha pull - requires spending points first, then picking.
    // The concept doesn't have an explicit "spendPoints" or "gachaPull" action,
    // but we can test the mechanics.
    // Let's assume spending 100 points allows one pull.
    const pointsToSpend = 100;
    if (rewardBeforeGacha.points >= pointsToSpend) {
      // Deduct points (simulate spending) - This would be another action in a real concept
      await rewarding.rewards.updateOne({ _id: userA }, { $inc: { points: -pointsToSpend } });

      // Now pick an avatar
      const { avatar: pickedAvatarId } = await rewarding.pickRandomAvatar({ availableAvatarIds: allAvatarIds });
      assert(pickedAvatarId !== "", "Picking an avatar should succeed");

      // Add the picked avatar to the user's collection (simulate earning the reward)
      await rewarding.rewards.updateOne({ _id: userA }, { $push: { ownedAvatars: pickedAvatarId } });

      const rewardAfterGacha = await rewarding._getRewardDetails(userA);
      assertEquals(rewardAfterGacha.points, 500 - pointsToSpend);
      assert(rewardAfterGacha.ownedAvatars.includes(pickedAvatarId), "User should now own the picked avatar");

      console.log(`User ${userA} spent ${pointsToSpend} points and received avatar: ${pickedAvatarId}`);
    } else {
      console.log(`User ${userA} does not have enough points (${rewardBeforeGacha.points}) to spend ${pointsToSpend}.`);
    }
  });


  await client.close();
});
```
