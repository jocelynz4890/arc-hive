---
timestamp: 'Thu Oct 16 2025 22:56:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225657.6e800d50.md]]'
content_id: 07ede8dab80db2a3720f63f1e50b7b2490859196d6cf302fbfc7b7bec021a1a4
---

# file: src/UserAuthentication/UserAuthenticationConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { hashPassword, comparePassword } from "@utils/passwordUtils.ts"; // Import password utilities

// Use a descriptive prefix for collections related to this concept
const PREFIX = "UserAuthentication.";

// Define the generic types used by this concept.
type User = ID;
type Session = ID;

/**
 * Represents a user in the system.
 * - _id: The unique identifier for the user (User type).
 * - username: The username chosen by the user (String).
 * - passwordHash: The hashed password for the user (String).
 * - userIdentifier: A unique identifier for the user within this concept's state.
 */
interface Users {
  _id: User;
  username: string;
  passwordHash: string; // Stores the hashed password
  userIdentifier: User;
}

/**
 * Represents an active session for an authenticated user.
 * - _id: The unique identifier for the session (Session type).
 * - userId: The identifier of the user associated with this session.
 */
interface Sessions {
  _id: Session;
  userId: User;
}

export default class UserAuthenticationConcept {
  private users: Collection<Users>;
  private sessions: Collection<Sessions>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.sessions = this.db.collection(PREFIX + "sessions");
  }

  /**
   * Registers a new user with a username and password.
   * @param username The desired username.
   * @param password The desired password.
   * @returns The user identifier if successful, or an error object if the username is already in use.
   */
  async register(args: { username: string; password: string }): Promise<{ user: User } | { error: string }> {
    const { username, password } = args;

    // Check if username already exists
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already in use." };
    }

    const passwordHash = hashPassword(password); // Hash the password
    const newUserIdentifier = freshID() as User;

    const newUser: Users = {
      _id: newUserIdentifier,
      username: username,
      passwordHash: passwordHash,
      userIdentifier: newUserIdentifier,
    };

    await this.users.insertOne(newUser);

    return { user: newUserIdentifier };
  }

  /**
   * Logs in an existing user with a username and password.
   * @param username The username.
   * @param password The password.
   * @returns The user identifier and a new session identifier if successful, or an error object if authentication fails.
   */
  async login(args: { username: string; password: string }): Promise<{ user: User; session: Session } | { error: string }> {
    const { username, password } = args;

    const user = await this.users.findOne({ username });

    if (!user) {
      return { error: "Invalid username or password." };
    }

    // Compare the provided password with the stored hash
    if (!comparePassword(password, user.passwordHash)) {
      return { error: "Invalid username or password." };
    }

    const newSessionIdentifier = freshID() as Session;

    const newSession: Sessions = {
      _id: newSessionIdentifier,
      userId: user.userIdentifier,
    };

    await this.sessions.insertOne(newSession);

    return { user: user.userIdentifier, session: newSessionIdentifier };
  }

  /**
   * Logs out a user by invalidating their session.
   * @param session The session identifier to invalidate.
   * @returns An empty object indicating success.
   */
  async logout(args: { session: Session }): Promise<Empty> {
    const { session } = args;

    await this.sessions.deleteOne({ _id: session });

    return {};
  }

  // --- Queries (optional, but good for testing and understanding state) ---

  /**
   * Retrieves a user by their identifier.
   * @param userId The identifier of the user.
   * @returns The user object if found, otherwise undefined.
   */
  async _getUserById(userId: User): Promise<Users | undefined> {
    return await this.users.findOne({ _id: userId });
  }

  /**
   * Retrieves a user by their username.
   * @param username The username.
   * @returns The user object if found, otherwise undefined.
   */
  async _getUserByUsername(username: string): Promise<Users | undefined> {
    return await this.users.findOne({ username });
  }

  /**
   * Retrieves a session by its identifier.
   * @param sessionId The identifier of the session.
   * @returns The session object if found, otherwise undefined.
   */
  async _getSessionById(sessionId: Session): Promise<Sessions | undefined> {
    return await this.sessions.findOne({ _id: sessionId });
  }

  /**
   * Retrieves the user associated with a given session.
   * @param sessionId The identifier of the session.
   * @returns The user identifier if the session is valid, otherwise undefined.
   */
  async _getUserIdBySessionId(sessionId: Session): Promise<User | undefined> {
    const session = await this.sessions.findOne({ _id: sessionId });
    return session?.userId;
  }
}
```

This implementation now includes basic password security by using simulated hashing and comparison. Remember to replace the placeholder `hashPassword` and `comparePassword` functions with a robust library like `bcrypt` in a production environment.
