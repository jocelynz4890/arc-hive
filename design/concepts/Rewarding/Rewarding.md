```
concept Rewarding

    purpose motivate users by granting rewards (avatars) for consistent habit completion and progress

    principle users earn avatar points by completing arcs and maintaining streaks; points are spent in a gacha system that yields avatars based on user stat distribution

    state
        a set of Rewards with
            a user User
            a points Number
            a set of Avatars

        a set of Avatars with
            a Name String
            a Rarity {common, rare, epic, legendary}
            a set of StatAffinity with
	            a stat String {HP, Stamina, Strength, Agility, Intelligence}
	            a number Number

    actions
        initializeRewards (user: User)
            requires user exists
            effect add user to Rewards with Points initialized to 0 and with no avatars

        earnPoints (user: User, points: Number)
            requires user exists, points is positive
            effect increases user’s point balance

        spendPoints (user: User, points: Number)
            requires user exists, points is positive
            effect decreases user's point balance if there are enough points to spend

        listAvatars (user: User): (avatars: Set of Avatar)
            requires user exists
            effect returns all avatars owned by user

		getRarity(rarity: String): (chance: Number)
			requires rarity is one of {common, rare, epic, legendary}
			effect returns the percentage chance associated with getting that rarity, where common is 65%, rare is 25%, epic is 9.5%, and legendary is 0.5%.

		pickRandomAvatar(availableAvatars: set of Avatar): (avatar: Avatar)
			requires true
			effect picks a random avatar from availableAvatars weighted by rarity
```
