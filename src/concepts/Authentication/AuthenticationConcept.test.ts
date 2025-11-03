import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
import AuthenticationConcept from "./AuthenticationConcept.ts";

console.log("✅ Concept: AUTHENTICATION\n Operational principle: a user is authorized to access their profile only if they provide the correct username and password set during registration\n");

Deno.test("Test Authentication Concept operational principle flow", async (t) => {
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
    const retrievedUserId = await auth._getUserByUsername({ username });
    assertEquals(retrievedUserId, userId, "Getting user ID by username should return the correct ID");

    const nonExistentUserId = await auth._getUserByUsername({ username: "anotheruser" });
    assertEquals(nonExistentUserId, null, "Getting user ID for non-existent user should return null");

    // _getUsernameById
    const retrievedUsername = await auth._getUsernameById({ userId });
    assertEquals(retrievedUsername, username, "Getting username by user ID should return the correct username");

    const nonExistentUsername = await auth._getUsernameById({ userId: "user:nonexistent" });
    assertEquals(nonExistentUsername, null, "Getting username for non-existent ID should return null");

    await client.close();
  });

  await t.step("session management", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);

    const username = "sessionuser";
    const password = "sessionpassword123";

    // 1. Register a user
    const registerResult = await auth.register({ username, password });
    assertEquals(registerResult.hasOwnProperty("user"), true, "Registration should succeed");
    const userId = (registerResult as { user: string }).user;

    // 2. Create a session for the user
    const createSessionResult = await auth.createSession({ user: userId });
    assertEquals(createSessionResult.hasOwnProperty("token"), true, "Session creation should succeed");
    const token = (createSessionResult as { token: string }).token;
    assertEquals(typeof token, "string", "Session token should be a string");

    // 3. Validate the session
    const validateSessionResult = await auth.validateSession({ token });
    assertEquals(validateSessionResult.hasOwnProperty("user"), true, "Session validation should succeed");
    assertEquals((validateSessionResult as { user: string }).user, userId, "Validated user ID should match");

    // 4. Attempt to validate with an invalid token
    const invalidToken = "invalid-token-12345";
    const validateInvalidResult = await auth.validateSession({ token: invalidToken });
    assertEquals(validateInvalidResult.hasOwnProperty("error"), true, "Invalid session validation should fail");
    assertEquals((validateInvalidResult as { error: string }).error, "Invalid or expired session token.", "Error message should be correct");

    // 5. Invalidate the session
    const invalidateResult = await auth.invalidateSession({ token });
    assertEquals(invalidateResult.hasOwnProperty("success"), true, "Session invalidation should succeed");
    assertEquals((invalidateResult as { success: boolean }).success, true, "Success should be true");

    // 6. Validate the now-invalidated session
    const validateAfterInvalidateResult = await auth.validateSession({ token });
    assertEquals(validateAfterInvalidateResult.hasOwnProperty("error"), true, "Validating invalidated session should fail");

    // 7. Attempt to invalidate a non-existent session
    const invalidateNonExistentResult = await auth.invalidateSession({ token: invalidToken });
    assertEquals(invalidateNonExistentResult.hasOwnProperty("error"), true, "Invalidating non-existent session should fail");

    // 8. Attempt to create session for non-existent user
    const createSessionNonExistentResult = await auth.createSession({ user: "nonexistent-user-id" });
    assertEquals(createSessionNonExistentResult.hasOwnProperty("error"), true, "Creating session for non-existent user should fail");

    await client.close();
  });
});
