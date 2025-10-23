---
timestamp: 'Thu Oct 23 2025 04:05:23 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_040523.ecb7e5e2.md]]'
content_id: 8b633716afdfb344d8112a48011b15e848c24b5e96d9edcf65b48f58af94132f
---

# After modifications:

[fixing-Friending](../../brainstorming/fixing-Friending.md)

I added 'removeFriend' and also changed the state to allow more performative operations.

I disliked the LLM output (many syntax errors, as you can see from in link above) so I modified it myself. I also added actions for all the helper functions that I ended up creating after realizing I needed them during implementation.

```
concept Friending

purpose allow users to easily access each others profiles for mutual accountability

principle users have automatically generated friend codes, and when another user adds their friend code, both users will be able able to see each other in their hives (friend list).

state
    a set of Friendships with
        a user User
        a users set of Users

    a set of UsersToFriendCode with
        a username String
        a friendcode String
	
	a set of FriendCodeToUsers with
		a friendcode String
		a username String

actions
	generateFriendCode (user: User): (friendCode: String)
        requires user exists and does not already have an assigned FriendCode
        effect randomly generates a unique friend code and assigns it to the user, and returns the friend code

    addFriend (from: User, to: User)
        requires from ≠ to and no existing friendship between from and to
        effect creates a mutual friendship

    removeFriend (from: User, to: User)
        requires existing friendship between from and to
        effect removes a mutual friendship

    listFriends (user: User): (friends: Set of User)
        requires user exists
        effect returns all users in a Friendship pair with that user

	getUserByFriendCode (friendCode: String): (user: User)
        requires friendCode exists
        effect returns user associated with friendCode

	areFriends (userA: User, userB: User): (areFriends: Boolean)
		requires both users exist
		effect returns true if the users are friends, false otherwise

	getFriendCodeByUsername (username: String): (friendcode: String)
		requires username exists
		effect returns friendcode associated with username
```

The generated implementation had type mismatches and hallucinated types that didn't exist, like a Str type, as well as other issues such as the TypeScript compiler thinking that a variable could be used before assignment. I also could not get AssertThrows to work, so I changed all instances of it to use try/catch blocks instead, with correct matching on the error message.
