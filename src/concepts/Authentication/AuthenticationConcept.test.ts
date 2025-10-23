import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
import AuthenticationConcept from "./AuthenticationConcept.ts";

Deno.test("Authentication Concept", async (t) => {
  await t.step("register and authenticate a user", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);

    const username = "testuser";
    const password = "password123";

    // 1. Register a new user
    const registerResult = await auth.register({ username, password });
    assertEquals(registerResult.hasOwnProperty("user"), true, "Registration should succeed");
    const userId = (registerResult as { user: string }).user;
    assertEquals(typeof userId, "string", "Registered user should return a string ID");

    // 2. Authenticate the newly registered user
    const authenticateSuccessResult = await auth.authenticate({ username, password });
    assertEquals(authenticateSuccessResult.hasOwnProperty("user"), true, "Authentication with correct credentials should succeed");
    assertEquals((authenticateSuccessResult as { user: string }).user, userId, "Authenticated user ID should match registered user ID");

    // 3. Attempt to authenticate with an incorrect password
    const incorrectPassword = "wrongpassword";
    const authenticateFailResult = await auth.authenticate({ username, password: incorrectPassword });
    assertEquals(authenticateFailResult.hasOwnProperty("error"), true, "Authentication with incorrect password should fail");
    assertEquals((authenticateFailResult as { error: string }).error, "Invalid password.", "Error message for incorrect password should be correct");

    // 4. Attempt to authenticate with a non-existent user
    const nonExistentUsername = "nonexistentuser";
    const authenticateNonExistentResult = await auth.authenticate({ username: nonExistentUsername, password });
    assertEquals(authenticateNonExistentResult.hasOwnProperty("error"), true, "Authentication with non-existent user should fail");
    assertEquals((authenticateNonExistentResult as { error: string }).error, `User with username '${nonExistentUsername}' not found.`, "Error message for non-existent user should be correct");

    // 5. Attempt to register a user with an existing username
    const registerExistingUserResult = await auth.register({ username, password });
    assertEquals(registerExistingUserResult.hasOwnProperty("error"), true, "Registering with an existing username should fail");
    assertEquals((registerExistingUserResult as { error: string }).error, `Username '${username}' already exists.`, "Error message for existing username should be correct");

    await client.close();
  });

  await t.step("verify internal queries", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);

    const username = "queryuser";
    const password = "querypassword";

    const registerResult = await auth.register({ username, password });
    const userId = (registerResult as { user: string }).user;

    // _getUserByUsername
    const retrievedUserId = await auth._getUserByUsername(username);
    assertEquals(retrievedUserId, userId, "Getting user ID by username should return the correct ID");

    const nonExistentUserId = await auth._getUserByUsername("anotheruser");
    assertEquals(nonExistentUserId, null, "Getting user ID for non-existent user should return null");

    // _getUsernameById
    const retrievedUsername = await auth._getUsernameById(userId);
    assertEquals(retrievedUsername, username, "Getting username by user ID should return the correct username");

    const nonExistentUsername = await auth._getUsernameById("user:nonexistent");
    assertEquals(nonExistentUsername, null, "Getting username for non-existent ID should return null");

    await client.close();
  });
});
