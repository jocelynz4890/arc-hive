---
timestamp: 'Thu Oct 23 2025 21:47:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214713.661c7e2c.md]]'
content_id: 5b1723169095e40fa77c93cb23487fb19a3a97b4215886c939cf8f1514a2762e
---

# API Specification: ArcTracking Concept

**Purpose:** allow users to create and manage arcs (habit trackers) either individually or with any number of peers

***

## API Endpoints

### POST /api/ArcTracking/createArc

**Description:** Creates a new arc with a given name and stat, and adds members to Members and to the progress map with initial progress set to false and initial streak set to 0.

**Requirements:**

* True.

**Effects:**

* Creates a new arc with given name and stat, and adds the members to Members and to the progress map with initial progress set to false and initial streak set to 0; members may be empty.

**Request Body:**

```json
{
  "name": "string",
  "stat": "string",
  "members": [
    "{User}"
  ]
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

***

### POST /api/ArcTracking/addMemberToArc

**Description:** Adds a user to an arc's Members and progress map with initial progress set to false.

**Requirements:**

* User exists.
* Arc exists.

**Effects:**

* Adds user to arc’s Members and progress map with initial progress set to false.

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

***

### POST /api/ArcTracking/markProgress

**Description:** Sets a user's progress for the day to true.

**Requirements:**

* User is a member of the arc.

**Effects:**

* Sets user’s progress for the day to true.

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

***

### POST /api/ArcTracking/markNoProgress

**Description:** Sets a user's progress for the day to false.

**Requirements:**

* User is a member of the arc.

**Effects:**

* Sets user's progress for the day to false.

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

***

### POST /api/ArcTracking/getArcStatus

**Description:** Returns the current progress status of all members for an arc.

**Requirements:**

* Arc exists.

**Effects:**

* Returns current progress status of all members.

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

***

### POST /api/ArcTracking/updateArcStreak

**Description:** Updates the arc's streak. If any member has not made progress, the streak resets to 0. Otherwise, it is incremented by 1. Daily progress is then reset to false for all users.

**Requirements:**

* Arc exists.

**Effects:**

* Gets the progress map of the arc, and if any member has not made progress, the streak resets to 0, otherwise it is incremented by 1, then daily progress is reset to false for all users to indicate a new day.

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

***

### POST /api/ArcTracking/getArcs

**Description:** Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by creation order (newest first).

**Requirements:**

* User exists.

**Effects:**

* Returns all arcs that the user is a member of, in order of decreasing streak counts and secondarily by creation order (newest first).

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
    "members": [
      "{User}"
    ],
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

***
