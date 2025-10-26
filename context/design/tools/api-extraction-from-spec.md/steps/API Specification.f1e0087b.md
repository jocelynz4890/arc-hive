---
timestamp: 'Thu Oct 23 2025 21:47:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214713.661c7e2c.md]]'
content_id: f1e0087b0b86f6e872ac667a4fdc79c691f32013707107e0dff48b6de62fdfd2
---

# API Specification: Friending Concept

**Purpose:** allow users to easily access each others profiles for mutual accountability

***

## API Endpoints

### POST /api/Friending/generateFriendCode

**Description:** Randomly generates a unique friend code and assigns it to the user.

**Requirements:**

* User exists.
* User does not already have an assigned FriendCode.

**Effects:**

* Randomly generates a unique friend code and assigns it to the user, and returns the friend code.

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

***

### POST /api/Friending/addFriend

**Description:** Creates a mutual friendship between two users.

**Requirements:**

* `from` is not equal to `to`.
* No existing friendship between `from` and `to`.

**Effects:**

* Creates a mutual friendship.

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

***

### POST /api/Friending/removeFriend

**Description:** Removes a mutual friendship between two users.

**Requirements:**

* Existing friendship between `from` and `to`.

**Effects:**

* Removes a mutual friendship.

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

***

### POST /api/Friending/listFriends

**Description:** Returns all users in a Friendship pair with the given user.

**Requirements:**

* User exists.

**Effects:**

* Returns all users in a Friendship pair with that user.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Action):**

```json
[
  "{User}"
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Friending/getUserByFriendCode

**Description:** Returns the user associated with a given friend code.

**Requirements:**

* FriendCode exists.

**Effects:**

* Returns user associated with friendCode.

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

***

### POST /api/Friending/areFriends

**Description:** Returns whether two users are friends.

**Requirements:**

* Both users exist.

**Effects:**

* Returns true if the users are friends, false otherwise.

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

***

### POST /api/Friending/getFriendCodeByUsername

**Description:** Returns the friend code associated with a given username.

**Requirements:**

* Username exists.

**Effects:**

* Returns friend code associated with username.

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

***
