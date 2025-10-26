## API Endpoints

### POST /api/StatTracking/updateStatWithCompletedTask

**Description:** Increases a user’s stat's CompletedNumber by a delta for a given stat.

**Requirements:**

- User exists.
- Stat is one of {HP, Stamina, Strength, Agility, Intelligence}.

**Effects:**

- Increases user’s stat's CompletedNumber by delta.

**Request Body:**

```json
{
  "user": "{User}",
  "stat": "string",
  "delta": "number"
}
```

**Success Response Body (Action):**

```json
{
  "updatedStats": "{Stats}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/StatTracking/updateStatWithIncompleteTask

**Description:** Increases a user’s stat's IncompletedNumber by a delta for a given stat.

**Requirements:**

- User exists.
- Stat is one of {HP, Stamina, Strength, Agility, Intelligence}.

**Effects:**

- Increases user’s stat's IncompletedNumber by delta.

**Request Body:**

```json
{
  "user": "{User}",
  "stat": "string",
  "delta": "number"
}
```

**Success Response Body (Action):**

```json
{
  "updatedStats": "{Stats}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/StatTracking/getStats

**Description:** Returns the current stat values for the user.

**Requirements:**

- User exists.

**Effects:**

- Returns the current stat values for the user.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
{
  "stats": "{Stats}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/StatTracking/initializeStats

**Description:** Assigns a user to a new set of Stats with all numbers initialized to 0.

**Requirements:**

- User exists.

**Effects:**

- Assigns user to a new set of Stats and returns stats with all numbers initialized to 0.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
{
  "stats": "{Stats}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

# API Specification: Rewarding Concept

**Purpose:** motivate users by granting rewards (avatars) for consistent habit completion and progress

---

## API Endpoints

### POST /api/Rewarding/initializeRewards

**Description:** Initializes rewards for a user with points set to 0 and no avatars.

**Requirements:**

- User exists.

**Effects:**

- Add user to Rewards with Points initialized to 0 and with no avatars.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Rewarding/earnPoints

**Description:** Increases a user’s point balance.

**Requirements:**

- User exists.
- Points is positive.

**Effects:**

- Increases user’s point balance.

**Request Body:**

```json
{
  "user": "{User}",
  "points": "number"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Rewarding/listAvatars

**Description:** Returns all avatars owned by a user.

**Requirements:**

- User exists.

**Effects:**

- Returns all avatars owned by user.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
[
  {
    "name": "string",
    "rarity": "string",
    "statAffinity": [
      {
        "stat": "string",
        "number": "number"
      }
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Rewarding/getRarity

**Description:** Returns the percentage chance associated with getting a rarity.

**Requirements:**

- Rarity is one of {common, rare, epic, legendary}.

**Effects:**

- Returns the percentage chance associated with getting that rarity, where common is 65%, rare is 25%, epic is 9.5%, and legendary is 0.5%.

**Request Body:**

```json
{
  "rarity": "string"
}
```

**Success Response Body (Action):**

```json
{
  "chance": "number"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Rewarding/pickRandomAvatar

**Description:** Picks a random avatar from a given set of available avatars, weighted by rarity.

**Requirements:**

- True.

**Effects:**

- Picks a random avatar from availableAvatars weighted by rarity.

**Request Body:**

```json
{
  "availableAvatars": [
    {
      "name": "string",
      "rarity": "string",
      "statAffinity": [
        {
          "stat": "string",
          "number": "number"
        }
      ]
    }
  ]
}
```

**Success Response Body (Action):**

```json
{
  "avatar": {
    "name": "string",
    "rarity": "string",
    "statAffinity": [
      {
        "stat": "string",
        "number": "number"
      }
    ]
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

# API Specification: Friending Concept

**Purpose:** allow users to easily access each others profiles for mutual accountability

---

## API Endpoints

### POST /api/Friending/generateFriendCode

**Description:** Randomly generates a unique friend code and assigns it to the user.

**Requirements:**

- User exists.
- User does not already have an assigned FriendCode.

**Effects:**

- Randomly generates a unique friend code and assigns it to the user, and returns the friend code.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
{
  "friendCode": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/addFriend

**Description:** Creates a mutual friendship between two users.

**Requirements:**

- `from` is not equal to `to`.
- No existing friendship between `from` and `to`.

**Effects:**

- Creates a mutual friendship.

**Request Body:**

```json
{
  "from": "{User}",
  "to": "{User}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/removeFriend

**Description:** Removes a mutual friendship between two users.

**Requirements:**

- Existing friendship between `from` and `to`.

**Effects:**

- Removes a mutual friendship.

**Request Body:**

```json
{
  "from": "{User}",
  "to": "{User}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/listFriends

**Description:** Returns all users in a Friendship pair with the given user.

**Requirements:**

- User exists.

**Effects:**

- Returns all users in a Friendship pair with that user.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
["{User}"]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/getUserByFriendCode

**Description:** Returns the user associated with a given friend code.

**Requirements:**

- FriendCode exists.

**Effects:**

- Returns user associated with friendCode.

**Request Body:**

```json
{
  "friendCode": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "{User}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/areFriends

**Description:** Returns whether two users are friends.

**Requirements:**

- Both users exist.

**Effects:**

- Returns true if the users are friends, false otherwise.

**Request Body:**

```json
{
  "userA": "{User}",
  "userB": "{User}"
}
```

**Success Response Body (Action):**

```json
{
  "areFriends": "boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Friending/getFriendCodeByUsername

**Description:** Returns the friend code associated with a given username.

**Requirements:**

- Username exists.

**Effects:**

- Returns friend code associated with username.

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response Body (Action):**

```json
{
  "friendcode": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

# API Specification: Authentication Concept

**Purpose:** authenticate users so that each user of the app is a real person

---

## API Endpoints

### POST /api/Authentication/register

**Description:** Creates and stores a new User with the given username and hashed password.

**Requirements:**

- No user exists with the given username.

**Effects:**

- Creates and stores a new User with the given username and hashed password, returns the new user.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "{User}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/Authentication/authenticate

**Description:** Returns the user if the provided password matches the stored hashed password for the given username, otherwise fails.

**Requirements:**

- A user exists with the given username.

**Effects:**

- Returns the user if hashing the password matches the stored hashed password of the user, otherwise fails.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "{User}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

# API Specification: ArcTracking Concept

**Purpose:** allow users to create and manage arcs (habit trackers) either individually or with any number of peers

---

## API Endpoints

### POST /api/ArcTracking/createArc

**Description:** Creates a new arc with a given name and stat, and adds members to Members and to the progress map with initial progress set to false and initial streak set to 0.

**Requirements:**

- True.

**Effects:**

- Creates a new arc with given name and stat, and adds the members to Members and to the progress map with initial progress set to false and initial streak set to 0; members may be empty.

**Request Body:**

```json
{
  "name": "string",
  "stat": "string",
  "members": ["{User}"]
}
```

**Success Response Body (Action):**

```json
{
  "arc": "{Arc}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/addMemberToArc

**Description:** Adds a user to an arc's Members and progress map with initial progress set to false.

**Requirements:**

- User exists.
- Arc exists.

**Effects:**

- Adds user to arc’s Members and progress map with initial progress set to false.

**Request Body:**

```json
{
  "user": "{User}",
  "arc": "{Arc}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/markProgress

**Description:** Sets a user's progress for the day to true.

**Requirements:**

- User is a member of the arc.

**Effects:**

- Sets user’s progress for the day to true.

**Request Body:**

```json
{
  "user": "{User}",
  "arc": "{Arc}"
}
```

**Success Response Body (Action):**

```json
{
  "progress": {
    "user": "{User}",
    "dailyProgress": "boolean"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/markNoProgress

**Description:** Sets a user's progress for the day to false.

**Requirements:**

- User is a member of the arc.

**Effects:**

- Sets user's progress for the day to false.

**Request Body:**

```json
{
  "user": "{User}",
  "arc": "{Arc}"
}
```

**Success Response Body (Action):**

```json
{
  "progress": {
    "user": "{User}",
    "dailyProgress": "boolean"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/getArcStatus

**Description:** Returns the current progress status of all members for an arc.

**Requirements:**

- Arc exists.

**Effects:**

- Returns current progress status of all members.

**Request Body:**

```json
{
  "arc": "{Arc}"
}
```

**Success Response Body (Action):**

```json
{
  "status": {
    "user": "{User}",
    "dailyProgress": "boolean"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/updateArcStreak

**Description:** Updates the arc's streak. If any member has not made progress, the streak resets to 0. Otherwise, it is incremented by 1. Daily progress is then reset to false for all users.

**Requirements:**

- Arc exists.

**Effects:**

- Gets the progress map of the arc, and if any member has not made progress, the streak resets to 0, otherwise it is incremented by 1, then daily progress is reset to false for all users to indicate a new day.

**Request Body:**

```json
{
  "arc": "{Arc}"
}
```

**Success Response Body (Action):**

```json
{
  "newStreak": "number"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/ArcTracking/getArcs

**Description:** Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by creation order (newest first).

**Requirements:**

- User exists.

**Effects:**

- Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by creation order (newest first).

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
[
  {
    "name": "string",
    "stat": "string",
    "members": ["{User}"],
    "streak": "number",
    "progress": {
      "user": "{User}",
      "dailyProgress": "boolean"
    }
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---
