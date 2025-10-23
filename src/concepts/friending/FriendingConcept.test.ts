import { testDb } from "@utils/database.ts";
import { assertEquals, assertThrows } from "jsr:@std/assert";
import FriendingConcept from "./FriendingConcept.ts";

console.log("✅ Concept: FRIENDING\n Operational principle: users have automatically generated friend codes, and when another user adds their friend code, both users will be able able to see each other in their hives (friend list)\n");

Deno.test("Test Friending Concept operational principle components", async (t) => {
  const [db, client] = await testDb();

  // Helper to create a user
  const createUser = async (username: string): Promise<string> => {
    // For testing Friending, use string IDs.
    return username;
  };

  await t.step("generateFriendCode", async () => {
    const friending = new FriendingConcept(db);
    const userAlice = await createUser("alice");

    // Test 1: Generate a friend code for a new user
    const { friendCode: fc1 } = await friending.generateFriendCode({ user: userAlice });
    assertEquals(typeof fc1, "string", "Generated friend code should be a string.");
    assertEquals(fc1.length, 6, "Generated friend code should have a specific length.");

    // Test 2: Attempt to generate a friend code for the same user again (should return existing)
    const { friendCode: fc2 } = await friending.generateFriendCode({ user: userAlice });
    assertEquals(fc2, fc1, "Generating friend code for an existing user should return the same code.");

    // Test 3: Verify friend code mapping
    const { user: retrievedUser } = await friending.getUserByFriendCode({ friendCode: fc1 });
    assertEquals(retrievedUser, userAlice, "getUserByFriendCode should return the correct user.");

    const { friendcode: retrievedFriendCode } = await friending.getFriendCodeByUsername({ username: userAlice });
    assertEquals(retrievedFriendCode, fc1, "getFriendCodeByUsername should return the correct friend code.");
  });

  await t.step("addFriend and listFriends", async () => {
    const friending = new FriendingConcept(db);

    // Fresh users for this step
    const userAlice = await createUser("alice");
    const userBob = await createUser("bob");
    const userCharlie = await createUser("charlie");

    // Generate friend codes (not strictly needed for addFriend, but fine)
    await friending.generateFriendCode({ user: userAlice });
    await friending.generateFriendCode({ user: userBob });
    await friending.generateFriendCode({ user: userCharlie });

    // === Test 1: Self-friend should throw ===
    try {
      await friending.addFriend({ from: userAlice, to: userAlice });
      throw new Error("Expected error not thrown for self-friend.");
    } catch (err) {
      if (err instanceof Error) {
        assertEquals(err.message, "Cannot add self as friend.");
      } else {
        throw err; // rethrow if it's not an Error
      }
    }


    // === Test 2: Add friend Alice → Bob ===
    await friending.addFriend({ from: userAlice, to: userBob });

    // Verify friendships
    let aliceFriends = await friending.listFriends({ user: userAlice });
    let bobFriends = await friending.listFriends({ user: userBob });
    let charlieFriends = await friending.listFriends({ user: userCharlie });

    assertEquals(aliceFriends.friends, [userBob], "Alice should be friends with Bob.");
    assertEquals(bobFriends.friends, [userAlice], "Bob should be friends with Alice.");
    assertEquals(charlieFriends.friends, [], "Charlie should have no friends yet.");

    // === Test 3: Add another friend Alice → Charlie ===
    await friending.addFriend({ from: userAlice, to: userCharlie });

    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(
      aliceFriends.friends.sort(),
      [userBob, userCharlie].sort(),
      "Alice should now be friends with Bob and Charlie."
    );

    // === Test 4: Adding an existing friend should throw ===
    try {
      await friending.addFriend({ from: userAlice, to: userBob });
      throw new Error("Expected error not thrown for self-friend.");
    } catch (err) {
      if (err instanceof Error) {
        assertEquals(err.message, "Users are already friends.");
      } else {
        throw err; // rethrow if it's not an Error
      }
    }
  });

  await t.step("removeFriend", async () => {
    const friending = new FriendingConcept(db);

    // Users are assumed to already exist and have friendships from previous step
    const userAlice = "alice";
    const userBob = "bob";
    const userCharlie = "charlie";

    // Remove a friend
    await friending.removeFriend({ from: userAlice, to: userBob });
    let aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends.sort(), [userCharlie].sort());

    let bobFriends = await friending.listFriends({ user: userBob });
    assertEquals(bobFriends.friends, []);

    // Remove the other friend
    await friending.removeFriend({ from: userAlice, to: userCharlie });
    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends, []);

    // Removing non-existent friend should be fine
    await friending.removeFriend({ from: userAlice, to: userBob });
    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends, []);
  });

  await t.step("areFriends", async () => {
    const friending = new FriendingConcept(db);
    const userAlice = "alice";
    const userBob = "bob";
    const userCharlie = "charlie";

    // Only test friendship queries, don't call addFriend here
    let are = await friending.areFriends({ userA: userAlice, userB: userBob });
    assertEquals(are.areFriends, false, "Alice and Bob should not be friends (after removal)");

    are = await friending.areFriends({ userA: userAlice, userB: userCharlie });
    assertEquals(are.areFriends, false, "Alice and Charlie should not be friends");

    are = await friending.areFriends({ userA: userAlice, userB: userAlice });
    assertEquals(are.areFriends, false, "Alice should not be friends with herself");
  });


  await client.close();
});
