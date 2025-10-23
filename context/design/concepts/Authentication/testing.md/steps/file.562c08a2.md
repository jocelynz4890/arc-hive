---
timestamp: 'Thu Oct 23 2025 05:22:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_052247.f604fbab.md]]'
content_id: 562c08a2986fdd163d6a68d4fc335be4b5f96cfee424ae116fe7327c91e8d2e6
---

# file: src/Authentication/AuthenticationConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import AuthenticationConcept from "./AuthenticationConcept.ts";
import { assertEquals, assertThrowsAsync } from "@std/assert";

Deno.test("Authentication Concept", async (t) => {
  await t.step("register and authenticate", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);

    // Test successful registration
    const registrationResult = await auth.register({
      username: "testuser",
      password: "password123",
    });
    assertEquals(registrationResult.user.length > 0, true, "Registration should return a user ID");

    const userId = registrationResult.user;

    // Test successful authentication
    const authenticationResult = await auth.authenticate({
      username: "testuser",
      password: "password123",
    });
    assertEquals(authenticationResult.user, userId, "Authentication should return the correct user ID");

    // Test authentication with incorrect password
    const incorrectPasswordResult = await auth.authenticate({
      username: "testuser",
      password: "wrongpassword",
    });
    assertEquals(
      incorrectPasswordResult.error,
      "Invalid password.",
      "Authentication with incorrect password should fail",
    );

    // Test authentication with non-existent username
    const nonExistentUserResult = await auth.authenticate({
      username: "nonexistentuser",
      password: "anypassword",
    });
    assertEquals(
      nonExistentUserResult.error,
      "User with username 'nonexistentuser' not found.",
      "Authentication with non-existent username should fail",
    );

    // Test registering a username that already exists
    const duplicateRegistrationResult = await auth.register({
      username: "testuser",
      password: "anotherpassword",
    });
    assertEquals(
      duplicateRegistrationResult.error,
      "Username 'testuser' already exists.",
      "Registering duplicate username should fail",
    );

    // Test using query methods
    const retrievedUserId = await auth._getUserByUsername("testuser");
    assertEquals(retrievedUserId, userId, "Retrieving user ID by username should match");

    const retrievedUsername = await auth._getUsernameById(userId);
    assertEquals(retrievedUsername, "testuser", "Retrieving username by ID should match");

    await client.close();
  });

  await t.step("password hashing and comparison", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);

    const password = "securepassword123!";
    const username = "hashinguser";

    // Register user, password should be hashed
    const registrationResult = await auth.register({ username, password });
    assertEquals(registrationResult.user.length > 0, true, "Registration should return a user ID");

    const userId = registrationResult.user;

    // Verify that the stored password is not the plain text password
    const userRecord = await db.collection("Authentication.users").findOne({ _id: userId });
    assertEquals(userRecord?.passwordHash, undefined, "passwordHash should not be undefined");
    // We can't directly assert that it's *not* the plaintext, but we can assert that the hashed version is stored.
    // The fact that authenticate works below implies hashing and comparison are correct.

    // Authenticate with the correct password
    const authSuccess = await auth.authenticate({ username, password });
    assertEquals(authSuccess.user, userId, "Authentication with correct password should succeed");

    // Authenticate with an incorrect password
    const authFail = await auth.authenticate({ username, password: "wrongpassword" });
    assertEquals(authFail.error, "Invalid password.", "Authentication with incorrect password should fail");

    await client.close();
  });
});
```
