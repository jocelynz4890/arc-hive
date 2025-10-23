
```
concept Rewarding

    purpose motivate users by granting rewards (avatars) for consistent habit completion and progress
    
    principle users earn avatar points by completing arcs and maintaining streaks; points are spent in a gacha system that yields avatars based on user stat distribution
    
    state
        a set of Rewards with
            a User User
            Points Number
            Avatars Set of Avatar

        a set of Avatars with
            a Name String
            a Rarity {common, rare, epic, legendary}
            a StatAffinity Map<Stat, Number>
    
    actions
        initializeRewards (user: User)
            requires user exists
            effect add user to Rewards with Points initialized to 0 and with no avatars

        earnPoints (user: User, points: Number)
            requires user exists
            effect increases user’s point balance

        spendPoints (user: User, cost: Number): (avatar: Avatar)
            requires user exists and user.Points ≥ cost
            effect deducts points and randomly assigns avatar by rarity; the set of avatars available is from getAvailableAvatars; adds avatar to user’s Avatars

        listAvatars (user: User): (avatars: Set of Avatar)
            requires user exists
            effect returns all avatars owned by user

        getAvailableAvatars (user: User): (avatars: Set of Avatar)
            requires user exists
            effect for each avatar that exists, add it to the set of avatars to be returned if the user's stats indicate a completed number greater than or equal to the number in the corresponding StatAffinity map for each stat in that map; this indicates that the user has met the requirements to unlock that avatar
```