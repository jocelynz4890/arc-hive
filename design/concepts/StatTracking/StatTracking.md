
```
concept StatTracking[User]
    purpose represent a user’s personal growth as video game–like stats
    principle each completed task from a user's arc contributes points to one stat; the number of completed tasks corresponding to a stat will be displayed in the stat's progress bar, out of the number of total tasks for that stat. This way, uncompleted tasks are visible in the stat's progress bar.
    state
        a set of Stats with
            a user User
            a pair of numbers HP (CompletedNumber, IncompletedNumber)
            a pair of numbers Stamina (CompletedNumber, IncompletedNumber)
            a pair of numbers Strength (CompletedNumber, IncompletedNumber)
            a pair of numbers Agility (CompletedNumber, IncompletedNumber)
            a pair of numbers Intelligence (CompletedNumber, IncompletedNumber)
    actions
        updateStatWithCompletedTask (user: User, stat: String, delta: Number): (updatedStats: Stats)
            requires user exists and stat ∈ {HP, Stamina, Strength, Agility, Intelligence}
            effect increases user’s stat's CompletedNumber by delta

        updateStatWithIncompleteTask (user: User, stat: String, delta: Number): (updatedStats: Stats)
            requires user exists and stat ∈ {HP, Stamina, Strength, Agility, Intelligence}
            effect increases user’s stat's IncompletedNumber by delta

        getStats (user: User): (stats: Stats)
            requires user exists
            effect returns the current stat values for the user

        initializeStats (user: User): (stats: Stats)
            requires user exists
            effect assigns user to a new set of Stats and returns stats with all numbers initialized to 0
```
