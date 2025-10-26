---
timestamp: 'Thu Oct 23 2025 21:47:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214713.661c7e2c.md]]'
content_id: 42915a1231e15b64a33cecace20390ca40a3d559031fc3e9668d9429203bc2be
---

# API Specification: StatTracking Concept

**Purpose:** represent a user’s personal growth as video game–like stats

***

## API Endpoints

### POST /api/StatTracking/updateStatWithCompletedTask

**Description:** Increases a user’s stat's CompletedNumber by a delta for a given stat.

**Requirements:**

* User exists.
* Stat is one of {HP, Stamina, Strength, Agility, Intelligence}.

**Effects:**

* Increases user’s stat's CompletedNumber by delta.

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

***

### POST /api/StatTracking/updateStatWithIncompleteTask

**Description:** Increases a user’s stat's IncompletedNumber by a delta for a given stat.

**Requirements:**

* User exists.
* Stat is one of {HP, Stamina, Strength, Agility, Intelligence}.

**Effects:**

* Increases user’s stat's IncompletedNumber by delta.

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

***

### POST /api/StatTracking/getStats

**Description:** Returns the current stat values for the user.

**Requirements:**

* User exists.

**Effects:**

* Returns the current stat values for the user.

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

***

### POST /api/StatTracking/initializeStats

**Description:** Assigns a user to a new set of Stats with all numbers initialized to 0.

**Requirements:**

* User exists.

**Effects:**

* Assigns user to a new set of Stats and returns stats with all numbers initialized to 0.

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

***
