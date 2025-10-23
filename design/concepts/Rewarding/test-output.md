
```
------- post-test output -------
✅ Concept: REWARDING
 Operational principle: users earn avatar points by completing arcs and maintaining streaks; points are spent in a gacha system that yields avatars based on user stat distribution

----- post-test output end -----
running 2 tests from ./src/concepts/Rewarding/RewardingConcept.test.ts
1. Initialization and Basic Operations ...
  initializeRewards: successfully initializes rewards for a new user ... ok (92ms)
  initializeRewards: idempotent - does not re-initialize if user already exists ...
------- post-test output -------
Rewards already initialized for user: user:Alice
----- post-test output end -----
  initializeRewards: idempotent - does not re-initialize if user already exists ... ok (33ms)
  earnPoints: successfully adds points to a user's balance ... ok (37ms)
  earnPoints: successfully adds more points ... ok (37ms)
  earnPoints: requires user exists ... ok (16ms)
  earnPoints: handles zero points correctly (no change) ... ok (32ms)
  earnPoints: handles negative points as an error ... ok (16ms)
  listAvatars: returns an empty array for a user with no avatars ... ok (54ms)
  listAvatars: returns owned avatars ... ok (140ms)
  listAvatars: requires user exists ... ok (18ms)
  getRarity: handles invalid rarity ... ok (0ms)
1. Initialization and Basic Operations ... ok (1s)
2. Rewarding Concept - pickRandomAvatar ...
  pickRandomAvatar: handles empty availableAvatarIds array ... ok (0ms)
  pickRandomAvatar: handles invalid avatar IDs in the input list ... ok (19ms)
2. Rewarding Concept - pickRandomAvatar ... ok (743ms)
```