import { Collection, Db } from "npm:mongodb";
// Assuming @utils/types.ts contains type Empty = Record<PropertyKey, never>;
import { Empty } from "@utils/types.ts";

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

    let friendCode: FriendCode;
    while (true) {
      friendCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await this.friendCodeToUsers.findOne({ _id: friendCode });
      if (!existingCode) break; 
    }

    await this.usersToFriendCode.insertOne({ _id: user, friendcode: friendCode });
    await this.friendCodeToUsers.insertOne({ _id: friendCode, username: user });

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
