---
timestamp: 'Thu Oct 23 2025 21:47:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214713.661c7e2c.md]]'
content_id: 9f5a96bb3d5b6debe46747cfd314b8b82cb4a961d80eeb73a0df6e851b73f945
---

# API Specification: Authentication Concept

**Purpose:** authenticate users so that each user of the app is a real person

***

## API Endpoints

### POST /api/Authentication/register

**Description:** Creates and stores a new User with the given username and hashed password.

**Requirements:**

* No user exists with the given username.

**Effects:**

* Creates and stores a new User with the given username and hashed password, returns the new user.

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

***

### POST /api/Authentication/authenticate

**Description:** Returns the user if the provided password matches the stored hashed password for the given username, otherwise fails.

**Requirements:**

* A user exists with the given username.

**Effects:**

* Returns the user if hashing the password matches the stored hashed password of the user, otherwise fails.

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

***
