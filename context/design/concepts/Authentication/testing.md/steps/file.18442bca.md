---
timestamp: 'Thu Oct 23 2025 05:22:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_052247.f604fbab.md]]'
content_id: 18442bcadc14364935d0a006f292062cfaf72359799bef60bd18c6546f3ec604
---

# file: src/Authentication/AuthenticationConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { compare, hash } from "https://deno.land/x/bcrypt@0.4.0/mod.ts";

// Define User as a plain string for IDs in this context, as per prompt's request to use plain strings.
// In a real application, you might still use a branded type for better type safety.
type User = string;

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
 * The Authentication concept handles user registration and authentication.
 * Its purpose is to authenticate users so that each user of the app is a real person.
 *
 * Principle: A user is authorized to access their profile only if they provide the correct username and password set during registration.
 */
export default class AuthenticationConcept {
  users: Collection<Users>;

  constructor(private readonly db: Db) {
    // Initialize the users collection
    this.users = this.db.collection(PREFIX + "users");
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
  }): Promise<{ user: User } | { error: string }> {
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
    return { user: newUser._id }; // Return the string ID
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

  // Example of a query (optional, but good practice for testing and understanding state)
  /**
   * Retrieves a user's ID by their username.
   * @param username The username to search for.
   * @returns The user's ID or null if not found.
   */
  async _getUserByUsername(username: string): Promise<User | null> {
    const user = await this.users.findOne({ username }, { projection: { _id: 1 } });
    return user ? user._id : null; // Return the string ID or null
  }

  /**
   * Retrieves a user's username by their ID.
   * @param userId The ID of the user.
   * @returns The user's username or null if not found.
   */
  async _getUsernameById(userId: User): Promise<string | null> {
    const user = await this.users.findOne({ _id: userId }, { projection: { username: 1 } });
    return user ? user.username : null;
  }
}
```
