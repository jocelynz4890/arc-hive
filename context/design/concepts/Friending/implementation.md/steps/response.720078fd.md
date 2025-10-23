---
timestamp: 'Thu Oct 23 2025 03:05:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_030538.fc27d726.md]]'
content_id: 720078fdce428537c2bb361a9ad07221b6d05d1d9c1a55bb809081bd148f94bd
---

# response:

You've decided to simplify and just use plain `string` types everywhere, effectively removing the need for the `ID` type and its associated branding or specific handling. This will make the code more straightforward if you don't require that level of type distinction between different string identifiers.

Here's the implementation with all `ID` references replaced by `string`:

```typescript
import { Collection, Db } from "npm:mongodb";
// Assuming @utils/types.ts contains type Empty = Record<PropertyKey, never>;
// Assuming @utils/database.ts contains function freshID(): string;
import { Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Friending" + ".";

// Generic types of this concept
// Using plain string for all ID-like types for simplicity.
type User = string;
type FriendCode = string;

/**
 * a set of Friendships with
 *   a user User
 *   a users set of Users
 */
interface Friendships {
  _id: User; // User is the primary user in the friendship pair
  users: User[]; // Set of users this user is friends with
}

/**
 * a set of UsersToFriendCode with
 *   a username String
 *   a friendcode String
 */
interface UsersToFriendCode {
  _id: string; // Username as the identifier
  friendcode: FriendCode;
}

/**
 * a set of FriendCodeToUsers with
 *   a friendcode String
 *   a username String
 */
interface FriendCodeToUsers {
  _id: FriendCode; // FriendCode as the identifier
  username: string; // username is a string
}

export default class FriendingConcept {
  friendships: Collection<Friendships>;
  usersToFriendCode: Collection<UsersToFriendCode>;
  friendCodeToUsers: Collection<FriendCodeToUsers>;

  constructor(private readonly db: Db) {
    this.friendships = this.db.collection(PREFIX + "friendships");
    this.usersToFriendCode = this.db.collection(PREFIX + "usersToFriendCode");
    this.friendCodeToUsers = this.db.collection(PREFIX + "friendCodeToUsers");
  }

  /**
   * randomly generates a unique friend code and assigns it to the user, and returns the friend code
   * requires user exists and does not already have an assigned FriendCode
   */
  async generateFriendCode({ user }: { user: User }): Promise<{ friendCode: FriendCode }> {
    const existingUserFriendCode = await this.usersToFriendCode.findOne({ _id: user });
    if (existingUserFriendCode) {
      return { friendCode: existingUserFriendCode.friendcode };
    }

    // Generate a unique friend code
    let friendCode: FriendCode;
    let unique = false;
    while (!unique) {
      friendCode = freshID(); // freshID now returns a string
      const existingCode = await this.friendCodeToUsers.findOne({ _id: friendCode });
      if (!existingCode) {
        unique = true;
      }
    }

    await this.usersToFriendCode.insertOne({ _id: user, friendcode: friendCode });
    await this.friendCodeToUsers.insertOne({ _id: friendCode, username: user }); // user is already string

    return { friendCode };
  }

  /**
   * creates a mutual friendship
   * requires from ≠ to and no existing friendship between from and to
   */
  async addFriend({ from, to }: { from: User; to: User }): Promise<Empty> {
    if (from === to) {
      throw new Error("Cannot add self as friend.");
    }

    const existingFriendshipFrom = await this.friendships.findOne({ _id: from });
    if (existingFriendshipFrom && existingFriendshipFrom.users.includes(to)) {
      throw new Error("Users are already friends.");
    }

    const existingFriendshipTo = await this.friendships.findOne({ _id: to });

    if (existingFriendshipFrom) {
      await this.friendships.updateOne({ _id: from }, { $push: { users: to } });
    } else {
      await this.friendships.insertOne({ _id: from, users: [to] });
    }

    if (existingFriendshipTo) {
      await this.friendships.updateOne({ _id: to }, { $push: { users: from } });
    } else {
      await this.friendships.insertOne({ _id: to, users: [from] });
    }

    return {};
  }

  /**
   * removes a mutual friendship
   * requires existing friendship between from and to
   */
  async removeFriend({ from, to }: { from: User; to: User }): Promise<Empty> {
    await this.friendships.updateOne({ _id: from }, { $pull: { users: to } });
    await this.friendships.updateOne({ _id: to }, { $pull: { users: from } });
    return {};
  }

  /**
   * returns all users in a Friendship pair with that user
   * requires user exists
   */
  async listFriends({ user }: { user: User }): Promise<{ friends: User[] }> {
    const friendship = await this.friendships.findOne({ _id: user });
    if (!friendship) {
      return { friends: [] };
    }
    return { friends: friendship.users };
  }

  /**
   * returns user associated with friendCode
   * requires friendCode exists
   */
  async getUserByFriendCode({ friendCode }: { friendCode: FriendCode }): Promise<{ user: User }> {
    const userEntry = await this.friendCodeToUsers.findOne({ _id: friendCode });
    if (!userEntry) {
      throw new Error("Friend code not found.");
    }
    // userEntry.username is a string, and User is now also string.
    return { user: userEntry.username };
  }

  /**
   * returns true if the users are friends, false otherwise
   * requires both users exist
   */
  async areFriends({ userA, userB }: { userA: User; userB: User }): Promise<{ areFriends: boolean }> {
    if (userA === userB) {
      return { areFriends: false };
    }
    const friendship = await this.friendships.findOne({ _id: userA });
    if (!friendship) {
      return { areFriends: false };
    }
    return { areFriends: friendship.users.includes(userB) };
  }

  /**
   * returns friendcode associated with username
   * requires username exists
   */
  async getFriendCodeByUsername({ username }: { username: string }): Promise<{ friendcode: FriendCode }> {
    const userFriendCode = await this.usersToFriendCode.findOne({ _id: username });
    if (!userFriendCode) {
      throw new Error("Username not found.");
    }
    return { friendcode: userFriendCode.friendcode };
  }
}
```

**Summary of Changes:**

1. **`User` and `FriendCode` Type Aliases**: Both `User` and `FriendCode` are now simply `string`.
2. **`ID` Removed**: All references to `ID` have been removed, including imports and type definitions.
3. **`freshID()` Return Type**: Assumed that `freshID()` now returns a plain `string`.
4. **Type Assignments**: All assignments and function signatures now directly use `string` where `ID` or the custom `Str` were used previously.
5. **`getUserByFriendCode` Return**: `userEntry.username` is a `string`, and `User` is now `string`, so the return `user: userEntry.username` is directly assignable.
6. **`generateFriendCode`**: The `user` parameter is now `string`, and it's directly used as `_id` for `usersToFriendCode` and as `username` for `friendCodeToUsers`.

This implementation is the simplest and directly uses the `string` type for all identifier-like values.
