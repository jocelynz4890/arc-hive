---
timestamp: 'Thu Oct 16 2025 22:56:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_225657.6e800d50.md]]'
content_id: 4a34702df86c930727ecbffa68461a50b91175268a584152a142e4d0b089aee1
---

# file: src/UserAuthentication/UserAuthenticationConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Use a descriptive prefix for collections related to this concept
const PREFIX = "UserAuthentication.";

// Define the generic types used by this concept.
// In this case, we'll use ID for User and Session, assuming they are externally defined.
// For implementation purposes, we'll assume User and Session are strings that will be managed by other concepts,
// but for this concept, we'll treat them as opaque IDs.
type User = ID;
type Session = ID;

/**
 * Represents a user in the system.
 * - _id: The unique identifier for the user (User type).
 * - username: The username chosen by the user (String).
 * - password: The hashed password for the user (String).
 * - userIdentifier: A unique identifier for the user within this concept's state.
 */
interface Users {
  _id: User;
  username: string;
  passwordHash: string; // Storing a hash, not the plain password
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

    // In a real-world scenario, you would hash the password here.
    // For simplicity in this example, we'll use the plain password as a "hash".
    const passwordHash = password; // Replace with actual password hashing

    const newUserIdentifier = freshID() as User; // Generate a unique user identifier

    const newUser: Users = {
      _id: newUserIdentifier,
      username: username,
      passwordHash: passwordHash,
      userIdentifier: newUserIdentifier, // User identifier is the same as the primary ID in this case
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

    // In a real-world scenario, you would compare the provided password with the stored hash.
    // For simplicity, we're comparing plain strings here.
    if (user.passwordHash !== password) {
      return { error: "Invalid username or password." };
    }

    const newSessionIdentifier = freshID() as Session; // Generate a unique session identifier

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

    // We assume the session identifier is valid and directly used for deletion.
    // In a more robust system, you might check if the session exists before deleting.
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

***
