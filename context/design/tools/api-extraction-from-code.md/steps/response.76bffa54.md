---
timestamp: 'Thu Oct 23 2025 21:43:11 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_214311.2892dd83.md]]'
content_id: 76bffa54a0f89fee5736f9a883a944a639d984196bc5bf2c96887e2f9b69a5f4
---

# response:

````markdown
# API Specification: Labeling Concept

**Purpose:** associate labels with generic items, and retrieve items based on labels.

---

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with the given name.

**Requirements:**
- No Label with the given `name` already exists.

**Effects:**
- Creates a new Label `l`.
- Sets the name of `l` to `name`.
- Returns `l` as `label`.

**Request Body:**
```json
{
  "name": "string"
}
````

**Success Response Body (Action):**

```json
{
  "label": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Labeling/addLabel

**Description:** Associates a label with an item.

**Requirements:**

* The `item` must exist.
* The `label` must exist.
* The `item` must not already have the `label`.

**Effects:**

* Adds the `label` to the set of labels associated with the `item`.

**Request Body:**

```json
{
  "item": "string",
  "label": "string"
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

### POST /api/Labeling/deleteLabel

**Description:** Removes a label from an item.

**Requirements:**

* The `item` must exist.
* The `label` must exist.
* The `item` must have the `label`.

**Effects:**

* Removes the `label` from the set of labels associated with the `item`.

**Request Body:**

```json
{
  "item": "string",
  "label": "string"
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

### POST /api/Labeling/\_getItemsWithLabel

**Description:** Retrieves all items that have a specific label.

**Requirements:**

* The `label` must exist.

**Effects:**

* Returns all items that are associated with the given `label`.

**Request Body:**

```json
{
  "label": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "item": "string"
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

### POST /api/Labeling/\_getLabelsForItem

**Description:** Retrieves all labels associated with a specific item.

**Requirements:**

* The `item` must exist.

**Effects:**

* Returns all labels associated with the given `item`.

**Request Body:**

```json
{
  "item": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "label": "string"
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

### POST /api/Labeling/\_getAllLabels

**Description:** Retrieves all available labels.

**Requirements:**

* None.

**Effects:**

* Returns a list of all labels.

**Request Body:**

```json
{}
```

**Success Response Body (Query):**

```json
[
  {
    "label": "string",
    "name": "string"
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
