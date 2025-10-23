---
timestamp: 'Thu Oct 23 2025 05:22:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_052247.f604fbab.md]]'
content_id: 954ee439dc4a18a73f870b73ee36e414bbfdea7c488662299279d9eb9db29a49
---

# Concept: Friending

**purpose** allow users to form connections with other users so that they can track each other's activity and communicate more easily

**principle** if a user sends a friend request to another user, and that user accepts the request, then the two users become friends, and can see each other's profiles and activity.

**state**
a set of Users with
a username String
a set of pending friend requests FromUser
a set of friends User

```
a set of FriendRequests with
    a sender FromUser
    a receiver User
    a status String (e.g., "pending", "accepted", "rejected", "cancelled")
```

**actions**
sendRequest (fromUser: User, toUser: User): (friendRequest: FriendRequest)
requires fromUser is not equal to toUser
requires no pending or accepted friend request exists between fromUser and toUser
effect creates a new FriendRequest with status "pending" from fromUser to toUser, adds this request to the receiver's pending friend requests, and returns the new friend request

```
acceptRequest (friendRequest: FriendRequest): (friendRequest: FriendRequest)
    requires the friendRequest status is "pending"
    requires the authenticated user is the receiver of the friendRequest
    effect updates the friendRequest status to "accepted", adds the sender to the receiver's friends, and adds the receiver to the sender's friends, and returns the updated friend request

rejectRequest (friendRequest: FriendRequest): (friendRequest: FriendRequest)
    requires the friendRequest status is "pending"
    requires the authenticated user is the receiver of the friendRequest
    effect updates the friendRequest status to "rejected", and returns the updated friend request

cancelRequest (friendRequest: FriendRequest): (friendRequest: FriendRequest)
    requires the friendRequest status is "pending"
    requires the authenticated user is the sender of the friendRequest
    effect updates the friendRequest status to "cancelled", and returns the updated friend request
```
