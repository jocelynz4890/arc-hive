---
timestamp: 'Thu Oct 23 2025 17:40:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_174057.e8f741cf.md]]'
content_id: 93c86d7eaaa3293c3885181984018716ed65168596002d833748eb6a64c79ce4
---

# problem: Concept needs a way to get the current user for `createArc` and potentially other actions.

The `createArc` action requires the current user to be added as a member, but there's no mechanism to retrieve this information directly within the `ArcTrackingConcept` class. This tightly couples `ArcTrackingConcept` to an external source of user identity.
