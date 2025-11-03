import { Collection, Db } from "npm:mongodb";
import { freshID } from "@utils/database.ts";
import { compare, hash } from "https://deno.land/x/bcrypt/mod.ts";

type User = string;
type SessionToken = string;

// Prefix for collection names to ensure uniqueness
const PREFIX = "Authentication" + ".";

/**
 * Represents a user in the authentication system.
 * The state is a set of Users, where each user has a username and a hashed password.
 */
interface Users {
  _id: User;
  username: string;
  passwordHash: string; // Password stored as a hash
}

/**
 * Represents a session in the authentication system.
 * The state is a set of Sessions, where each session has a token, user, and creation time.
 */
interface Sessions {
  _id: SessionToken;
  user: User;
  createdAt: Date;
}

/**
 * The Authentication concept handles user registration, authentication, and session management.
 * Its purpose is to authenticate users so that each user of the app is a real person.
 *
 * Principle: A user is authorized to access their profile only if they provide the correct username and password set during registration.
 * Sessions track authenticated users and provide tokens for authorization checks.
 */
export default class AuthenticationConcept {
  users: Collection<Users>;
  sessions: Collection<Sessions>;

  constructor(private readonly db: Db) {
    // Initialize the users collection
    this.users = this.db.collection(PREFIX + "users");
    // Initialize the sessions collection
    this.sessions = this.db.collection(PREFIX + "sessions");
  }

  /**
   * Registers a new user with a username and password.
   *
   * Requires: no user exists with the given username.
   * Effects: Creates and stores a new User with the given username and password, returns the new user.
   *
   * @param username The username for the new user.
   * @param password The password for the new user.
   * @returns A dictionary containing the newly created user's ID, or an error message if registration fails.
   */
  async register({
    username,
    password,
  }: {
    username: string;
    password: string; // Password is required for registration
  }): Promise<{ user: User; username: string } | { error: string }> {
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: `Username '${username}' already exists.` };
    }

    // Hash the password before storing it
    const passwordHash = await hash(password);

    const newUser: Users = {
      _id: freshID(), // Using freshID for MongoDB ObjectId compatibility
      username,
      passwordHash,
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id, username }; // Return both ID and username
  }

  /**
   * Authenticates a user with a given username and password.
   *
   * Requires: A user exists with the given username.
   * Effects: Returns the user if the password matches, otherwise fails.
   *
   * @param username The username of the user to authenticate.
   * @param password The password to authenticate with.
   * @returns A dictionary containing the authenticated user's ID, or an error message if authentication fails.
   */
  async authenticate({
    username,
    password,
  }: {
    username: string;
    password: string; // Password is required for authentication
  }): Promise<{ user: User } | { error: string }> {
    const user = await this.users.findOne({ username });

    if (!user) {
      return { error: `User with username '${username}' not found.` };
    }

    // Compare the provided password with the stored hash
    const isMatch = await compare(password, user.passwordHash);

    if (isMatch) {
      return { user: user._id }; // Return the string ID
    } else {
      return { error: "Invalid password." };
    }
  }

  /**
   * Retrieves a user's ID by their username.
   * @param username The username to search for.
   * @returns The user's ID or null if not found.
   */
  async _getUserByUsername({ username }: { username: string }): Promise<User | null> {
    const user = await this.users.findOne({ username }, { projection: { _id: 1 } });
    return user ? user._id : null; // Return the string ID or null
  }

  /**
   * Retrieves a user's username by their ID.
   * @param userId The ID of the user.
   * @returns The user's username or null if not found.
   */
  async _getUsernameById({ userId }: { userId: User }): Promise<string | null> {
    const user = await this.users.findOne({ _id: userId }, { projection: { username: 1 } });
    return user ? user.username : null;
  }

  /**
   * Retrieves all users in the system.
   * @returns Array of all users with their IDs and usernames.
   */
  async _getAllUsers({}: {}): Promise<{ users: { _id: User; username: string }[] }> {
    const allUsers = await this.users.find({}, { projection: { _id: 1, username: 1 } }).toArray();
    return { users: allUsers };
  }

  /**
   * Creates a new session for an authenticated user.
   * 
   * Requires: The user exists.
   * Effects: Creates and stores a new session with a random token, returns the session token.
   * 
   * @param user The ID of the authenticated user.
   * @returns A dictionary containing the session token, or an error if user not found.
   */
  async createSession({ user }: { user: User }): Promise<{ token: SessionToken } | { error: string }> {
    // Verify user exists
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return { error: `User with ID '${user}' not found.` };
    }

    // Generate a random session token
    const token = freshID() as SessionToken;

    // Create and store the session
    const session: Sessions = {
      _id: token,
      user,
      createdAt: new Date(),
    };

    await this.sessions.insertOne(session);
    return { token };
  }

  /**
   * Validates a session token and returns the associated user.
   * 
   * Requires: A session exists with the given token.
   * Effects: Returns the user associated with the session.
   * 
   * @param token The session token to validate.
   * @returns A dictionary containing the user ID, or an error if session invalid.
   */
  async validateSession({ token }: { token: SessionToken }): Promise<{ user: User } | { error: string }> {
    const session = await this.sessions.findOne({ _id: token });
    
    if (!session) {
      return { error: "Invalid or expired session token." };
    }

    return { user: session.user };
  }

  /**
   * Invalidates a session by removing it.
   * 
   * Requires: A session exists with the given token.
   * Effects: Removes the session from the system.
   * 
   * @param token The session token to invalidate.
   * @returns Success or error.
   */
  async invalidateSession({ token }: { token: SessionToken }): Promise<{ success: boolean } | { error: string }> {
    const result = await this.sessions.deleteOne({ _id: token });
    
    if (result.deletedCount === 0) {
      return { error: "Session token not found." };
    }

    return { success: true };
  }

  /**
   * Gets the user associated with a session token.
   * This is an internal query for use by syncs.
   * 
   * @param token The session token.
   * @returns Array with user ID if session found, empty array otherwise.
   */
  async _getUserBySession({ token }: { token: SessionToken }): Promise<Array<{ user: User }>> {
    const session = await this.sessions.findOne({ _id: token });
    return session ? [{ user: session.user }] : [];
  }
}