---
timestamp: 'Thu Oct 23 2025 16:46:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_164636.ebce8699.md]]'
content_id: 33483247391d66724225f144ad6aaee9038fb31828a992baa9deb352d82ac238
---

# trace:

This trace demonstrates the core functionality of `ArcTracking` for a group arc: creating an arc, adding members, marking progress, checking status, updating streaks, and retrieving arcs.

```
# Create a new group arc named "Team Synergy" with Alice and Bob as initial members.
# The stat is "Intelligence".
ACTION createArc(name="Team Synergy", members={"user:Alice", "user:Bob"}, stat="Intelligence") -> {arc: "arc:TeamSynergy1"}

# Add Charlie to the "Team Synergy" arc.
ACTION addMemberToArc(user="user:Charlie", arc="arc:TeamSynergy1")

# At the end of Day 1:
# Alice marks her progress.
ACTION markProgress(user="user:Alice", arc="arc:TeamSynergy1") -> {progress: [...]}

# Bob does NOT mark his progress.
ACTION markNoProgress(user="user:Bob", arc="arc:TeamSynergy1") -> {progress: [...]}

# Charlie marks his progress.
ACTION markProgress(user="user:Charlie", arc="arc:TeamSynergy1") -> {progress: [...]}

# Check the status of the arc at the end of Day 1.
ACTION getArcStatus(arc="arc:TeamSynergy1") -> {status: {"user:Alice": true, "user:Bob": false, "user:Charlie": true}}

# Update the arc's streak for Day 1. Since Bob did not progress, the streak resets to 0.
ACTION updateArcStreak(arc="arc:TeamSynergy1") -> {newStreak: 0}

# At the end of Day 2:
# All members (Alice, Bob, Charlie) mark their progress.
ACTION markProgress(user="user:Alice", arc="arc:TeamSynergy1") -> {progress: [...]}
ACTION markProgress(user="user:Bob", arc="arc:TeamSynergy1") -> {progress: [...]}
ACTION markProgress(user="user:Charlie", arc="arc:TeamSynergy1") -> {progress: [...]}

# Check the status of the arc at the end of Day 2.
ACTION getArcStatus(arc="arc:TeamSynergy1") -> {status: {"user:Alice": true, "user:Bob": true, "user:Charlie": true}}

# Update the arc's streak for Day 2. Since all members progressed, the streak increments from 0 to 1.
ACTION updateArcStreak(arc="arc:TeamSynergy1") -> {newStreak: 1}

# Create another arc for Alice, "Daily Meditation", with a higher streak.
# Let's assume this arc had a streak of 3 from previous days (not shown in this trace).
# We'll simulate this by directly setting it in test data for simplicity in trace description.
# For the purpose of this trace, assume "arc:DailyMeditation2" already exists with streak 3.

# Retrieve all arcs that Alice is a member of.
ACTION getArcs(user="user:Alice") -> {arcs: ["arc:DailyMeditation2", "arc:TeamSynergy1"]}

# The result should be sorted by streak (descending) then name (alphabetical).
# If "Daily Meditation" has streak 3 and "Team Synergy" has streak 1, and both names are sorted alphabetically,
# the order will be: "arc:DailyMeditation2", "arc:TeamSynergy1".
```
