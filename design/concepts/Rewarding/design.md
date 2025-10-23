I made a few small syntax changes and removed the following actions:

```
getAvailableAvatars (user: User): (avatars: Set of Avatar)
	requires user exists
	effect for each avatar that exists, add it to the set of avatars to be returned if the user's stats indicate a completed number greater than or equal to the number in the corresponding StatAffinity map for each stat in that map; this indicates that the user has met the requirements to unlock that avatar

spendPoints (user: User, cost: Number): (avatar: Avatar)
	requires user exists and user.Points ≥ cost
	effect deducts points and randomly assigns avatar by rarity; the set of avatars available is from getAvailableAvatars; adds avatar to user’s Avatars
```

I realized that these depended on the StatTracking concept and should therefore be implemented in a sync, in order to keep this concept modular.

After some more consideration, I added the following actions:

```
getRarity(rarity: String): (chance: Number)
	requires rarity is one of {common, rare, epic, legendary}
	effect returns the percentage chance associated with getting that rarity, where common is 65%, rare is 25%, epic is 9.5%, and legendary is 0.5%.

pickRandomAvatar(availableAvatars: set of Avatar): (avatar: Avatar)
	requires true
	effect picks a random avatar from availableAvatars weighted by rarity 
```

The way I intend for this to be used during the actual random pick (implemented in a sync) is the user will attempt to spend their points through `spendPoints`, which will look up their available avatars using `getAvailableAvatars`. Avatars can be repeatedly pulled, so this list of available avatars will be passed into `pickRandomAvatar`, which gives the avatar that will be used by `spendPoints` to assign to a user.

With `getAvailableAvatars`, the user will unlock more avatars (be able to view more of them) as they increase their stats.

I also enforced that the number of points earned has to be positive.