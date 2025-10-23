

```
running 3 tests from ./src/concepts/StatTracking/StatTrackingConcept.test.ts
StatTrackingConcept - Initialize Stats ...
  should initialize stats for a new user with all values at 0 ... ok (59ms)
  should idempotent initialize stats for an existing user ... ok (114ms)
StatTrackingConcept - Initialize Stats ... ok (732ms)
StatTrackingConcept - Get Stats ...
  should return an error if stats are not initialized for a user ... ok (17ms)
  should return correct stats for an initialized user ... ok (129ms)
StatTrackingConcept - Get Stats ... ok (635ms)
StatTrackingConcept - Update Stats ...
  requires: user exists ... ok (38ms)
  requires: stat is valid ... ok (1ms)
  effects: updateStatWithCompletedTask increases completed count ... ok (83ms)
  effects: updateStatWithIncompleteTask increases incompleted count ... ok (126ms)
  effects: updating completed does not affect incompleted and vice-versa ... ok (138ms)
StatTrackingConcept - Update Stats ... ok (1s)
```