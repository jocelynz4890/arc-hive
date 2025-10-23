---
timestamp: 'Thu Oct 23 2025 02:58:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_025825.2ea90487.md]]'
content_id: dff0dca37c058c88056a206178f3ae1315ddb5edee4efea973588f921a7362e9
---

# response:

You've encountered a common issue when dealing with strongly typed IDs. The `ID` type is likely a branded type (like `type ID = string & { __brand: "ID" };`) to differentiate it from regular strings, even though it's represented as a string at runtime. This prevents accidental assignment of plain strings where a specific `ID` is expected.

The issue arises because we are trying to treat a `string` directly as an `ID` in some places, while in others, `ID` is expected.

Let's fix this by consistently using `ID` where appropriate and ensuring type safety.

Here's the corrected implementation:

```typescript
import { Collection, Db } from "npm:mongodb";
// Import ID and Empty from utils, and freshID for generating IDs.
// Assuming @utils/types.ts contains type ID = string & { __brand: "ID" }; and type Empty = Record<PropertyKey, never>;
// Assuming @utils/database.ts contains function freshID(): ID;
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Friending" + ".";

// Generic types of this concept
// User and FriendCode are specifically typed as ID to enforce that they are not just any string.
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
 *   a username string (not ID, as per original specification implies)
 *   a friendcode FriendCode
 */
interface UsersToFriendCode {
  _id: string; // Username as the identifier - kept as string as it's a username, not a system ID.
  friendcode: FriendCode;
}

/**
 * a set of FriendCodeToUsers with
 *   a friendcode FriendCode
 *   a username string
 */
interface FriendCodeToUsers {
  _id: FriendCode; // FriendCode as the identifier
  username: string; // username is a string, not an ID type
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
    // The `user` here is of type `ID`. We need to use it as the `_id` for `usersToFriendCode`
    // which expects a `string`. Assuming `ID` is a string subtype, this should be fine.
    const existingUserFriendCode = await this.usersToFriendCode.findOne({ _id: user });
    if (existingUserFriendCode) {
      return { friendCode: existingUserFriendCode.friendcode };
    }

    // Generate a unique friend code
    let friendCode: FriendCode;
    let unique = false;
    while (!unique) {
      friendCode = freshID(); // freshID is assumed to return an ID type
      const existingCode = await this.friendCodeToUsers.findOne({ _id: friendCode });
      if (!existingCode) {
        unique = true;
      }
    }

    // The `user` is an `ID` type, but `_id` in `UsersToFriendCode` is a `string`.
    // If `ID` is a branded string, this assignment should be valid if `ID` is a subtype of `string`.
    // If `ID` is `string & { __brand: "ID" }`, then `user` can be assigned to `string` type.
    const username: string = user;

    await this.usersToFriendCode.insertOne({ _id: username, friendcode: friendCode });
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

    // `from` and `to` are of type `User` (which is `ID`).
    // `_id` in `friendships` is also `User` (which is `ID`). Direct comparison/usage is fine.
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
    // `from` and `to` are `User` (ID) type. `_id` in `friendships` is `User` (ID).
    await this.friendships.updateOne({ _id: from }, { $pull: { users: to } });
    await this.friendships.updateOne({ _id: to }, { $pull: { users: from } });
    return {};
  }

  /**
   * returns all users in a Friendship pair with that user
   * requires user exists
   */
  async listFriends({ user }: { user: User }): Promise<{ friends: User[] }> {
    // `user` is `User` (ID). `_id` in `friendships` is `User` (ID).
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
    // `friendCode` is `FriendCode` (ID). `_id` in `friendCodeToUsers` is `FriendCode` (ID).
    const userEntry = await this.friendCodeToUsers.findOne({ _id: friendCode });
    if (!userEntry) {
      throw new Error("Friend code not found.");
    }
    // `userEntry.username` is `string`. We need to return `User` (which is `ID`).
    // This implies that usernames are also `ID`s or can be directly converted.
    // Let's assume username can be cast to ID for the return type.
    return { user: userEntry.username as User };
  }

  /**
   * returns true if the users are friends, false otherwise
   * requires both users exist
   */
  async areFriends({ userA, userB }: { userA: User; userB: User }): Promise<{ areFriends: boolean }> {
    if (userA === userB) {
      return { areFriends: false };
    }
    // `userA` is `User` (ID). `_id` in `friendships` is `User` (ID).
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
    // `username` is `string`. `_id` in `usersToFriendCode` is `string`.
    const userFriendCode = await this.usersToFriendCode.findOne({ _id: username });
    if (!userFriendCode) {
      throw new Error("Username not found.");
    }
    // `userFriendCode.friendcode` is `FriendCode` (ID). This is consistent with return type.
    return { friendcode: userFriendCode.friendcode };
  }
}
```

**Explanation of Changes:**

1. **Type `ID` Assumption**: I'm now explicitly assuming `ID` is a branded type like `type ID = string & { __brand: "ID" };`. This means an `ID` is a `string` at its core but has a specific type identity.
2. **`freshID()` Return Type**: I'm assuming `freshID()` correctly returns a value of type `ID`.
3. **`usersToFriendCode._id`**: The `_id` field in `UsersToFriendCode` is kept as `string`. This aligns with the concept description where it's a "username String". Usernames are typically just strings, not system-generated `ID`s.
4. **`username` Type in `getUserByFriendCode` and `getFriendCodeByUsername`**:
   * In `getUserByFriendCode`, the `username` property of `userEntry` is a `string`. The method is expected to return a `User` (which is `ID`). The line `return { user: userEntry.username as User };` now assumes that the stored username string can be treated as an `ID` for the purpose of returning a `User`. This is a critical assumption based on the types. If usernames and system IDs are fundamentally different, this might need adjustment (e.g., a lookup from username to ID).
   * In `getFriendCodeByUsername`, the `username` parameter is now explicitly typed as `string`, matching how it's used to query `usersToFriendCode._id`.
5. **`generateFriendCode`**: The `username: string = user;` line is now `const username: string = user;` if `user` (an `ID`) can be assigned to `string`. If `ID` is truly a distinct type from `string`, you might need an explicit conversion or lookup if `user` is an `ID` but the `_id` field expects a plain `string`. The current assumption is that `ID` is a subtype of `string` and can be assigned.
6. **Consistency**: The key is that where `ID` is used for type definition (like `User`, `FriendCode`), we use `ID` throughout. Where the concept spec explicitly said `string` for something like a username, we use `string`.

**Important Consideration:**

* **`ID` Definition**: The exact definition of `ID` in `@utils/types.ts` is crucial. If `ID` is just `string`, then the original error shouldn't have occurred. If it's a branded type, the casting (`as User` or `as string`) is necessary but might mask underlying type mismatches if the data stored doesn't truly conform to the `ID`'s intent.
* **Username vs. User ID**: The prompt for `getUserByFriendCode` implies that the `username` stored in `FriendCodeToUsers` can be returned as a `User` (which is `ID`). This means either usernames *are* `ID`s, or there's an implicit mapping that needs to be handled. The current code assumes the former.
