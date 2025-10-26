---
timestamp: 'Thu Oct 23 2025 21:47:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214713.661c7e2c.md]]'
content_id: 12cf4f9b063d44cdb781af51823b8a13dbaeacd1e323c397d73062291e23acf0
---

# API Specification: Rewarding Concept

**Purpose:** motivate users by granting rewards (avatars) for consistent habit completion and progress

***

## API Endpoints

### POST /api/Rewarding/initializeRewards

**Description:** Initializes rewards for a user with points set to 0 and no avatars.

**Requirements:**

* User exists.

**Effects:**

* Add user to Rewards with Points initialized to 0 and with no avatars.

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

***

### POST /api/Rewarding/earnPoints

**Description:** Increases a user’s point balance.

**Requirements:**

* User exists.
* Points is positive.

**Effects:**

* Increases user’s point balance.

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

***

### POST /api/Rewarding/listAvatars

**Description:** Returns all avatars owned by a user.

**Requirements:**

* User exists.

**Effects:**

* Returns all avatars owned by user.

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

***

### POST /api/Rewarding/getRarity

**Description:** Returns the percentage chance associated with getting a rarity.

**Requirements:**

* Rarity is one of {common, rare, epic, legendary}.

**Effects:**

* Returns the percentage chance associated with getting that rarity, where common is 65%, rare is 25%, epic is 9.5%, and legendary is 0.5%.

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

***

### POST /api/Rewarding/pickRandomAvatar

**Description:** Picks a random avatar from a given set of available avatars, weighted by rarity.

**Requirements:**

* True.

**Effects:**

* Picks a random avatar from availableAvatars weighted by rarity.

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

***
