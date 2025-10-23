

```
------- post-test output -------
✅ Concept: STAT TRACKING
 Operational principle: each completed task from a user's arc contributes points to one stat; the number of completed tasks corresponding to a stat will be displayed in the stat's progress bar, out of the number of total tasks for that stat. This way, uncompleted tasks are visible in the stat's progress bar

----- post-test output end -----
running 3 tests from ./src/concepts/StatTracking/StatTrackingConcept.test.ts
1. StatTrackingConcept - Initialize Stats ...
  should initialize stats for a new user with all values at 0 ... ok (63ms)
  should idempotent initialize stats for an existing user ... ok (139ms)
1. StatTrackingConcept - Initialize Stats ... ok (915ms)
2. StatTrackingConcept - Get Stats ...
  should return an error if stats are not initialized for a user ... ok (18ms)
  should return correct stats for an initialized user ... ok (238ms)
2. StatTrackingConcept - Get Stats ... ok (874ms)
3. StatTrackingConcept - Update Stats ...
  requires: user exists ... ok (38ms)
  requires: stat is valid ... ok (0ms)
  effects: updateStatWithCompletedTask increases completed count ... ok (83ms)
  effects: updateStatWithIncompleteTask increases incompleted count ... ok (208ms)
  effects: updating completed does not affect incompleted and vice-versa ... ok (130ms)
3. StatTrackingConcept - Update Stats ... ok (1s)
```