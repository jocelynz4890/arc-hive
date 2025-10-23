---
timestamp: 'Thu Oct 23 2025 05:22:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_052247.f604fbab.md]]'
content_id: 8a1485f9617b628fb7546867ee8c0c36f71412a6d31e0204b5d3e97b207fadb2
---

# file: src/Friending/FriendingConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import AuthenticationConcept from "../Authentication/AuthenticationConcept.ts"; // Assuming AuthenticationConcept is in the same directory structure

// Define User and FriendRequest types using string for IDs as per prompt
type User = string;
type FriendRequestId = string;

// Prefix for collection names
const PREFIX = "Friending" + ".";

/**
 * Represents a user's state in the friending system.
 */
interface UserState {
  _id: User; // User ID
  pendingRequests: { sender: User; friendRequestId: FriendRequestId }[];
  friends: User[];
  sentRequests: { receiver: User; friendRequestId: FriendRequestId }[];
}

/**
 * Represents a friend request.
 */
interface FriendRequest {
  _id: FriendRequestId;
  sender: User;
  receiver: User;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

/**
 * The Friending concept allows users to form connections with other users.
 * Purpose: Allow users to form connections with other users so that they can track each other's activity and communicate more easily.
 * Principle: If a user sends a friend request to another user, and that user accepts the request, then the two users become friends, and can see each other's profiles and activity.
 */
export default class FriendingConcept {
  users: Collection<UserState>;
  friendRequests: Collection<FriendRequest>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.friendRequests = this.db.collection(PREFIX + "friendRequests");
  }

  /**
   * Sends a friend request from one user to another.
   *
   * Requires: fromUser is not equal to toUser.
   * Requires: no pending or accepted friend request exists between fromUser and toUser.
   * Effects: Creates a new FriendRequest with status "pending" from fromUser to toUser,
   *          adds this request to the receiver's pending friend requests, and returns the new friend request.
   *
   * @param fromUserId The ID of the user sending the request.
   * @param toUserId The ID of the user receiving the request.
   * @returns A dictionary containing the new friend request, or an error message.
   */
  async sendRequest({
    fromUserId,
    toUserId,
  }: {
    fromUserId: User;
    toUserId: User;
  }): Promise<{ friendRequest: FriendRequest } | { error: string }> {
    if (fromUserId === toUserId) {
      return { error: "Cannot send a friend request to yourself." };
    }

    // Check if a pending or accepted request already exists
    const existingRequest = await this.friendRequests.findOne({
      $or: [
        { sender: fromUserId, receiver: toUserId, status: { $in: ["pending", "accepted"] } },
        { sender: toUserId, receiver: fromUserId, status: { $in: ["pending", "accepted"] } },
      ],
    });

    if (existingRequest) {
      return { error: "A friend request already exists between these users." };
    }

    const newFriendRequest: FriendRequest = {
      _id: freshID(),
      sender: fromUserId,
      receiver: toUserId,
      status: "pending",
    };

    await this.friendRequests.insertOne(newFriendRequest);

    // Update receiver's pending requests
    await this.users.updateOne(
      { _id: toUserId },
      {
        $push: {
          pendingRequests: {
            sender: fromUserId,
            friendRequestId: newFriendRequest._id,
          },
        },
      },
      { upsert: true } // Create user state if it doesn't exist
    );

    // Update sender's sent requests
    await this.users.updateOne(
      { _id: fromUserId },
      {
        $push: {
          sentRequests: {
            receiver: toUserId,
            friendRequestId: newFriendRequest._id,
          },
        },
      },
      { upsert: true } // Create user state if it doesn't exist
    );

    return { friendRequest: newFriendRequest };
  }

  /**
   * Accepts a friend request.
   *
   * Requires: the friendRequest status is "pending".
   * Requires: the authenticated user is the receiver of the friendRequest.
   * Effects: Updates the friendRequest status to "accepted", adds the sender to the receiver's friends,
   *          and adds the receiver to the sender's friends, and returns the updated friend request.
   *
   * @param friendRequestId The ID of the friend request to accept.
   * @param authenticatedUserId The ID of the user accepting the request.
   * @returns A dictionary containing the updated friend request, or an error message.
   */
  async acceptRequest({
    friendRequestId,
    authenticatedUserId,
  }: {
    friendRequestId: FriendRequestId;
    authenticatedUserId: User;
  }): Promise<{ friendRequest: FriendRequest } | { error: string }> {
    const request = await this.friendRequests.findOne({ _id: friendRequestId });

    if (!request) {
      return { error: "Friend request not found." };
    }

    if (request.status !== "pending") {
      return { error: "Friend request is not pending." };
    }

    if (request.receiver !== authenticatedUserId) {
      return { error: "You are not authorized to accept this friend request." };
    }

    // Update request status
    await this.friendRequests.updateOne(
      { _id: friendRequestId },
      { $set: { status: "accepted" } }
    );

    // Update sender's friends list
    await this.users.updateOne(
      { _id: request.sender },
      {
        $addToSet: { friends: authenticatedUserId }, // Use addToSet to avoid duplicates
        $pull: { sentRequests: { friendRequestId } }, // Remove from sent requests
      }
    );

    // Update receiver's friends list
    await this.users.updateOne(
      { _id: authenticatedUserId },
      {
        $addToSet: { friends: request.sender }, // Use addToSet to avoid duplicates
        $pull: { pendingRequests: { friendRequestId } }, // Remove from pending requests
      }
    );

    // Fetch the updated request to return
    const updatedRequest = await this.friendRequests.findOne({ _id: friendRequestId });
    if (!updatedRequest) {
      // This should not happen if the update was successful, but good for robustness
      return { error: "Failed to retrieve updated friend request." };
    }

    return { friendRequest: updatedRequest };
  }

  /**
   * Rejects a friend request.
   *
   * Requires: the friendRequest status is "pending".
   * Requires: the authenticated user is the receiver of the friendRequest.
   * Effects: Updates the friendRequest status to "rejected", and returns the updated friend request.
   *
   * @param friendRequestId The ID of the friend request to reject.
   * @param authenticatedUserId The ID of the user rejecting the request.
   * @returns A dictionary containing the updated friend request, or an error message.
   */
  async rejectRequest({
    friendRequestId,
    authenticatedUserId,
  }: {
    friendRequestId: FriendRequestId;
    authenticatedUserId: User;
  }): Promise<{ friendRequest: FriendRequest } | { error: string }> {
    const request = await this.friendRequests.findOne({ _id: friendRequestId });

    if (!request) {
      return { error: "Friend request not found." };
    }

    if (request.status !== "pending") {
      return { error: "Friend request is not pending." };
    }

    if (request.receiver !== authenticatedUserId) {
      return { error: "You are not authorized to reject this friend request." };
    }

    // Update request status
    await this.friendRequests.updateOne(
      { _id: friendRequestId },
      { $set: { status: "rejected" } }
    );

    // Remove from receiver's pending requests
    await this.users.updateOne(
      { _id: authenticatedUserId },
      { $pull: { pendingRequests: { friendRequestId } } }
    );

    // Fetch the updated request to return
    const updatedRequest = await this.friendRequests.findOne({ _id: friendRequestId });
    if (!updatedRequest) {
      return { error: "Failed to retrieve updated friend request." };
    }

    return { friendRequest: updatedRequest };
  }

  /**
   * Cancels a pending friend request.
   *
   * Requires: the friendRequest status is "pending".
   * Requires: the authenticated user is the sender of the friendRequest.
   * Effects: Updates the friendRequest status to "cancelled", and returns the updated friend request.
   *
   * @param friendRequestId The ID of the friend request to cancel.
   * @param authenticatedUserId The ID of the user cancelling the request.
   * @returns A dictionary containing the updated friend request, or an error message.
   */
  async cancelRequest({
    friendRequestId,
    authenticatedUserId,
  }: {
    friendRequestId: FriendRequestId;
    authenticatedUserId: User;
  }): Promise<{ friendRequest: FriendRequest } | { error: string }> {
    const request = await this.friendRequests.findOne({ _id: friendRequestId });

    if (!request) {
      return { error: "Friend request not found." };
    }

    if (request.status !== "pending") {
      return { error: "Friend request is not pending." };
    }

    if (request.sender !== authenticatedUserId) {
      return { error: "You are not authorized to cancel this friend request." };
    }

    // Update request status
    await this.friendRequests.updateOne(
      { _id: friendRequestId },
      { $set: { status: "cancelled" } }
    );

    // Remove from sender's sent requests
    await this.users.updateOne(
      { _id: authenticatedUserId },
      { $pull: { sentRequests: { friendRequestId } } }
    );

    // Remove from receiver's pending requests
    await this.users.updateOne(
      { _id: request.receiver },
      { $pull: { pendingRequests: { friendRequestId } } }
    );

    // Fetch the updated request to return
    const updatedRequest = await this.friendRequests.findOne({ _id: friendRequestId });
    if (!updatedRequest) {
      return { error: "Failed to retrieve updated friend request." };
    }

    return { friendRequest: updatedRequest };
  }

  // Helper query to get user state for testing
  async _getUserState(userId: User): Promise<UserState | null> {
    const userState = await this.users.findOne({ _id: userId });
    // If user state doesn't exist, return a default empty state
    if (!userState) {
      return { _id: userId, pendingRequests: [], friends: [], sentRequests: [] };
    }
    return userState;
  }

  // Helper query to get friend request by ID for testing
  async _getFriendRequest(friendRequestId: FriendRequestId): Promise<FriendRequest | null> {
    return await this.friendRequests.findOne({ _id: friendRequestId });
  }
}
```
