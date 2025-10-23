---
timestamp: 'Thu Oct 23 2025 02:24:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_022433.cd28b28f.md]]'
content_id: 35690ea8de6cf9d38e60077bc1c24e1c8a6ad4e901cdeadb0d99af2208f22944
---

# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID, Str } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Friending" + ".";

// Generic types of this concept
type User = ID;
type FriendCode = ID;

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
  _id: Str; // Username as the identifier
  friendcode: FriendCode;
}

/**
 * a set of FriendCodeToUsers with
 *   a friendcode String
 *   a username String
 */
interface FriendCodeToUsers {
  _id: FriendCode; // FriendCode as the identifier
  username: Str;
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
      friendCode = freshID() as FriendCode; // Using freshID as a string-based ID
      const existingCode = await this.friendCodeToUsers.findOne({ _id: friendCode });
      if (!existingCode) {
        unique = true;
      }
    }

    const username = user; // Assuming user ID is also the username for simplicity here

    await this.usersToFriendCode.insertOne({ _id: user, friendcode: friendCode });
    await this.friendCodeToUsers.insertOne({ _id: friendCode, username: username });

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

    // Ensure the 'to' user has an entry as well for mutual friendship
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
    return { user: userEntry.username as User }; // Assuming username is the User ID
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
  async getFriendCodeByUsername({ username }: { username: Str }): Promise<{ friendcode: FriendCode }> {
    const userFriendCode = await this.usersToFriendCode.findOne({ _id: username });
    if (!userFriendCode) {
      throw new Error("Username not found.");
    }
    return { friendcode: userFriendCode.friendcode };
  }
}
```
