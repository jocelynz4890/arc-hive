[@testing-concepts](../../background/testing-concepts.md)

[@Friending](Friending.md)

[@implementation](implementation.md)

# test: Friending
# response:

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assertThrows } from "@jsr:@std/assert";
import FriendingConcept from "@concepts/FriendingConcept.ts";

Deno.test("Friending Concept", async (t) => {
  const [db, client] = await testDb();

  // Helper to create a user (assuming user IDs are strings)
  const createUser = async (username: string): Promise<string> => {
    // In a real scenario, user creation would likely be handled by a User concept.
    // For testing Friending, we'll just use string IDs.
    return username;
  };

  await t.step("generateFriendCode", async () => {
    const friending = new FriendingConcept(db);
    const userAlice = await createUser("alice");

    // Test 1: Generate a friend code for a new user
    const { friendCode: fc1 } = await friending.generateFriendCode({ user: userAlice });
    assertEquals(typeof fc1, "string", "Generated friend code should be a string.");
    assertEquals(fc1.length, 24, "Generated friend code should have a specific length (e.g., MongoDB ObjectId length)."); // Assuming freshID generates something like ObjectId string

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
    const userAlice = await createUser("alice");
    const userBob = await createUser("bob");
    const userCharlie = await createUser("charlie");

    // Pre-condition setup: generate friend codes for users
    await friending.generateFriendCode({ user: userAlice });
    await friending.generateFriendCode({ user: userBob });
    await friending.generateFriendCode({ user: userCharlie });

    // Test 1: Add friends
    await friending.addFriend({ from: userAlice, to: userBob });

    // Test 2: Verify friendships
    let aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends, [userBob], "Alice should be friends with Bob.");

    let bobFriends = await friending.listFriends({ user: userBob });
    assertEquals(bobFriends.friends, [userAlice], "Bob should be friends with Alice.");

    let charlieFriends = await friending.listFriends({ user: userCharlie });
    assertEquals(charlieFriends.friends, [], "Charlie should have no friends yet.");

    // Test 3: Add another friend for Alice
    await friending.addFriend({ from: userAlice, to: userCharlie });
    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends.sort(), [userBob, userCharlie].sort(), "Alice should now be friends with Bob and Charlie.");

    // Test 4: Attempt to add existing friend (should throw error as per requires)
    await assertThrows(
      async () => {
        await friending.addFriend({ from: userAlice, to: userBob });
      },
      Error,
      "Cannot add existing friend.", // Or a more specific error message if implemented
    );

    // Test 5: Attempt to add self as friend (should throw error as per requires)
    await assertThrows(
      async () => {
        await friending.addFriend({ from: userAlice, to: userAlice });
      },
      Error,
      "Cannot add self as friend.",
    );
  });

  await t.step("removeFriend", async () => {
    const friending = new FriendingConcept(db);
    const userAlice = await createUser("alice");
    const userBob = await createUser("bob");
    const userCharlie = await createUser("charlie");

    // Pre-condition setup
    await friending.generateFriendCode({ user: userAlice });
    await friending.generateFriendCode({ user: userBob });
    await friending.generateFriendCode({ user: userCharlie });
    await friending.addFriend({ from: userAlice, to: userBob });
    await friending.addFriend({ from: userAlice, to: userCharlie });

    // Test 1: Remove a friend
    await friending.removeFriend({ from: userAlice, to: userBob });

    let aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends.sort(), [userCharlie].sort(), "Alice should no longer be friends with Bob.");

    let bobFriends = await friending.listFriends({ user: userBob });
    assertEquals(bobFriends.friends, [], "Bob should no longer be friends with Alice.");

    // Test 2: Remove the other friend
    await friending.removeFriend({ from: userAlice, to: userCharlie });
    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends, [], "Alice should have no friends left.");

    // Test 3: Attempt to remove a non-existent friend (should not throw, but effects are null)
    // The current implementation for removeFriend uses $pull which doesn't throw if element not found.
    // If the 'requires' was strictly enforced to throw, we'd need to check first.
    await friending.removeFriend({ from: userAlice, to: userBob });
    aliceFriends = await friending.listFriends({ user: userAlice });
    assertEquals(aliceFriends.friends, [], "Removing non-existent friend should not change friend list.");
  });

  await t.step("areFriends", async () => {
    const friending = new FriendingConcept(db);
    const userAlice = await createUser("alice");
    const userBob = await createUser("bob");
    const userCharlie = await createUser("charlie");

    // Pre-condition setup
    await friending.generateFriendCode({ user: userAlice });
    await friending.generateFriendCode({ user: userBob });
    await friending.generateFriendCode({ user: userCharlie });
    await friending.addFriend({ from: userAlice, to: userBob });

    // Test 1: Are friends
    let are = await friending.areFriends({ userA: userAlice, userB: userBob });
    assertEquals(are.areFriends, true, "Alice and Bob should be friends.");

    // Test 2: Are not friends
    are = await friending.areFriends({ userA: userAlice, userB: userCharlie });
    assertEquals(are.areFriends, false, "Alice and Charlie should not be friends.");

    // Test 3: Same user
    are = await friending.areFriends({ userA: userAlice, userB: userAlice });
    assertEquals(are.areFriends, false, "A user should not be considered friends with themselves.");

    // Test 4: Non-existent user (should gracefully return false if not friends)
    const userDavid = await createUser("david"); // David does not exist in the system for friending
    are = await friending.areFriends({ userA: userAlice, userB: userDavid });
    assertEquals(are.areFriends, false, "A user should not be friends with a non-existent user.");
  });

  await client.close();
});
```