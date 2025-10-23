
```
concept ArcTracking
    purpose allow users to create and manage arcs (habit trackers) either individually or with any number of peers
    principle an arc consists of a daily habit or set of tasks; progress counts only if completed, and in group arcs, progress counts only if all members complete their tasks
    state
        a set of Arcs with
            a Name String
            a Stat String {HP, Stamina, Strength, Agility, Intelligence}
            a Members Set of Users
            a Streak Number
            a Progress Map<User, Boolean>
    actions
        createArc (name: String, members: Set of Users): (arc: Arc)
            requires all users in members have less than 10 arcs that they are a member of
            effect creates a new arc with given name and stat, and adds the current user and members to Members and to the progress map with initial progress set to false and initial streak set to 0; members may be empty

        addMemberToArc (user: User, arc: Arc)
            requires user exists and arc exists
            effect adds user to arc’s Members and progress map with initial progress set to false

        markProgress (user: User, arc: Arc): (progress: Progress Map<User, Boolean>)
            requires user ∈ arc.Members
            effect sets user’s progress for the day to true

        markNoProgress (user: User, arc: Arc): (progress: Progress Map<User, Boolean>)
            requires user ∈ arc.Members
            effect sets user's progress for the day to false

        getArcStatus (arc: Arc): (status: Map<User, Boolean>)
            requires arc exists
            effect returns current progress status of all members

        updateArcStreak (arc: Arc): (newStreak: Number)
            requires arc exists
            effect gets the progress map of the arc, and if any member has not made progress, the streak resets to 0, otherwise it is incremented by 1

        getArcs (user: User): (arcs: Set of Arcs)
            requires user exists
            effect returns all arcs that the user is a member of
```
