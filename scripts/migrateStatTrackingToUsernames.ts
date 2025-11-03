/**
 * Migration script to fix user identifier mismatches
 * Changes all StatTracking stats and Rewarding rewards from user IDs to usernames
 */

import { getDb } from "@utils/database.ts";

interface AuthUser {
  _id: string;
  username: string;
}

interface StatRecord {
  _id: string;
  user: string; // Currently an ID, should be username
}

interface RewardRecord {
  _id: string; // This IS the user identifier
  points: number;
  ownedAvatars: string[];
  currentAvatar?: string;
}

async function migrate() {
  console.log("Starting user identifier migration...");
  
  const [db] = await getDb();
  
  // Get all users from Authentication collection
  const usersCollection = db.collection<AuthUser>("Authentication.users");
  const users = await usersCollection.find({}).toArray();
  
  // Create a mapping of user ID -> username
  const idToUsername = new Map<string, string>();
  for (const user of users) {
    idToUsername.set(user._id, user.username);
  }
  
  console.log(`Found ${users.length} users in database`);
  console.log("User ID -> Username mapping:", Array.from(idToUsername.entries()));
  
  // ========== MIGRATE STATTRACKING ==========
  console.log("\n=== Migrating StatTracking.stats ===");
  const statsCollection = db.collection<StatRecord>("StatTracking.stats");
  const stats = await statsCollection.find({}).toArray();
  
  console.log(`Found ${stats.length} stat records to migrate`);
  
  let statsMigrated = 0;
  let statsSkipped = 0;
  let statsErrors = 0;
  
  for (const stat of stats) {
    const userId = stat.user;
    
    // Check if this looks like a user ID (not a username)
    if (idToUsername.has(userId)) {
      const username = idToUsername.get(userId)!;
      
      console.log(`Migrating StatTracking: ${userId} -> ${username}`);
      
      try {
        await statsCollection.updateOne(
          { _id: stat._id },
          { $set: { user: username } }
        );
        statsMigrated++;
      } catch (error) {
        console.error(`Error migrating StatTracking ${userId}:`, error);
        statsErrors++;
      }
    } else {
      // Already a username or unknown ID
      console.log(`Skipping StatTracking: ${userId} (already a username or unknown)`);
      statsSkipped++;
    }
  }
  
  console.log(`StatTracking migration complete: ${statsMigrated} migrated, ${statsSkipped} skipped, ${statsErrors} errors`);
  
  // ========== MIGRATE REWARDING ==========
  console.log("\n=== Migrating Rewarding.rewards ===");
  const rewardsCollection = db.collection<RewardRecord>("Rewarding.rewards");
  const rewards = await rewardsCollection.find({}).toArray();
  
  console.log(`Found ${rewards.length} reward records to migrate`);
  
  let rewardsMigrated = 0;
  let rewardsSkipped = 0;
  let rewardsErrors = 0;
  
  for (const reward of rewards) {
    const userId = reward._id; // In Rewarding, _id IS the user identifier
    
    // Check if this looks like a user ID (not a username)
    if (idToUsername.has(userId)) {
      const username = idToUsername.get(userId)!;
      
      console.log(`Migrating Rewarding: ${userId} -> ${username}`);
      
      try {
        // Need to delete old record and insert new one with username as _id
        await rewardsCollection.deleteOne({ _id: userId });
        await rewardsCollection.insertOne({
          _id: username,
          points: reward.points,
          ownedAvatars: reward.ownedAvatars,
          currentAvatar: reward.currentAvatar
        });
        rewardsMigrated++;
      } catch (error) {
        console.error(`Error migrating Rewarding ${userId}:`, error);
        rewardsErrors++;
      }
    } else {
      // Already a username or unknown ID
      console.log(`Skipping Rewarding: ${userId} (already a username or unknown)`);
      rewardsSkipped++;
    }
  }
  
  console.log(`Rewarding migration complete: ${rewardsMigrated} migrated, ${rewardsSkipped} skipped, ${rewardsErrors} errors`);
  
  // ========== SUMMARY ==========
  console.log("\n========== TOTAL MIGRATION SUMMARY ==========");
  console.log(`StatTracking: ${statsMigrated} migrated, ${statsSkipped} skipped, ${statsErrors} errors`);
  console.log(`Rewarding: ${rewardsMigrated} migrated, ${rewardsSkipped} skipped, ${rewardsErrors} errors`);
  console.log("=============================================\n");
  
  Deno.exit(0);
}

migrate().catch((error) => {
  console.error("Migration failed:", error);
  Deno.exit(1);
});
