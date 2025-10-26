---
timestamp: 'Thu Oct 23 2025 21:43:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214331.e092571d.md]]'
content_id: f0a60191a353b82f71421bb87781abd436618f1a1b8855d5d3fcd4613a9f603c
---

# response:

````markdown
# API Specification: Comment Concept

**Purpose:** associate some text with another artifact (usually itself textual) that remarks on, augments or explains it

---

## API Endpoints

### POST /api/Comment/createComment

**Description:** Creates a new comment with the given text, associating it with the target and authored by the specified user.

**Requirements:**
- A user must be provided.
- A target must be provided.
- Comment text must be provided.

**Effects:**
- A new comment is created.
- The comment is associated with the provided user.
- The comment is associated with the provided target.
- The comment contains the provided text.

**Request Body:**
```json
{
  "user": "{User}",
  "target": "{Target}",
  "text": "string"
}
````

**Success Response Body (Action):**

```json
{
  "comment": "{Comment}"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Comment/deleteComment

**Description:** Deletes a specified comment.

**Requirements:**

* A comment must be provided.
* The comment must exist.

**Effects:**

* The specified comment is removed.

**Request Body:**

```json
{
  "comment": "{Comment}"
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

### POST /api/Comment/updateComment

**Description:** Updates the text of an existing comment.

**Requirements:**

* A comment must be provided.
* The comment must exist.
* New text must be provided.

**Effects:**

* The text of the specified comment is updated to the new text.

**Request Body:**

```json
{
  "comment": "{Comment}",
  "newText": "string"
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

### POST /api/Comment/\_getCommentsForTarget

**Description:** Retrieves all comments associated with a given target.

**Requirements:**

* A target must be provided.
* The target must exist.

**Effects:**

* Returns a set of comments associated with the target.

**Request Body:**

```json
{
  "target": "{Target}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "comment": "{Comment}"
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

### POST /api/Comment/\_getCommentsByUser

**Description:** Retrieves all comments authored by a given user.

**Requirements:**

* A user must be provided.
* The user must exist.

**Effects:**

* Returns a set of comments authored by the user.

**Request Body:**

```json
{
  "user": "{User}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "comment": "{Comment}"
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

```
```
