---
timestamp: 'Thu Oct 23 2025 05:22:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_052247.f604fbab.md]]'
content_id: 7037b19ff8e7f75d37ccb77aac0929d353851358732599902f985be261810b10
---

# file: src/Friending/FriendingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import FriendingConcept from "./FriendingConcept.ts";
import AuthenticationConcept from "../Authentication/AuthenticationConcept.ts";
import { assertEquals, assert } from "@std/assert";

Deno.test("Friending Concept", async (t) => {
  await t.step("send, accept, and reject friend requests", async () => {
    const [db, client] = await testDb();
    const auth = new AuthenticationConcept(db);
    const friending = new FriendingConcept(db);

    // Register users
    const userAliceReg = await auth.register({ username: "alice", password: "password123" });
    const userBobReg = await auth.register({ username: "bob", password: "password456" });
    const userCharlieReg = await auth.register({ username: "charlie", password: "password789" });

    const aliceId = userAliceReg.user;
    const bobId = userBobReg.user;
    const charlieId = userCharlieReg.user;

    // Authenticate users for actions
    const aliceSession = await auth.authenticate({ username: "alice", password: "password123" });
    const bobSession = await auth.authenticate({ username: "bob", password: "password456" });
    const charlieSession = await auth.authenticate({ username: "charlie", password: "password789" });

    const aliceAuthenticated = aliceSession.user;
    const bobAuthenticated = bobSession.user;
    const charlieAuthenticated = charlieSession.user;

    // Scenario 1: Alice sends a friend request to Bob
    const sendRequestResult1 = await friending.sendRequest({
      fromUserId: aliceAuthenticated,
      toUserId: bobAuthenticated,
    });
    assert(sendRequestResult1.friendRequest.id !== undefined, "sendRequest should return a friend request with an ID");

    const friendRequestId1 = sendRequestResult1.friendRequest.id;

    // Verify request is pending for Bob
    const bobStateAfterRequest = await friending._getUserState(bobAuthenticated);
    assertEquals(bobStateAfterRequest.pendingRequests.length, 1, "Bob should have one pending request");
    assertEquals(bobStateAfterRequest.pendingRequests[0].sender, aliceAuthenticated, "Pending request sender should be Alice");

    // Verify request is pending for Alice (in terms of sent requests)
    const aliceStateAfterRequest = await friending._getUserState(aliceAuthenticated);
    assertEquals(aliceStateAfterRequest.sentRequests.length, 1, "Alice should have one sent request");
    assertEquals(aliceStateAfterRequest.sentRequests[0].receiver, bobAuthenticated, "Sent request receiver should be Bob");

    // Scenario 2: Bob accepts Alice's request
    const acceptRequestResult = await friending.acceptRequest({
      friendRequestId: friendRequestId1,
      authenticatedUserId: bobAuthenticated,
    });
    assertEquals(acceptRequestResult.status, "accepted", "acceptRequest should change status to accepted");
    assertEquals(acceptRequestResult.receiver, bobAuthenticated, "Accepted request receiver should be Bob");
    assertEquals(acceptRequestResult.sender, aliceAuthenticated, "Accepted request sender should be Alice");

    // Verify friends lists after acceptance
    const aliceStateAfterAccept = await friending._getUserState(aliceAuthenticated);
    assertEquals(aliceStateAfterAccept.friends.length, 1, "Alice should have one friend after acceptance");
    assertEquals(aliceStateAfterAccept.friends[0], bobAuthenticated, "Alice's friend should be Bob");

    const bobStateAfterAccept = await friending._getUserState(bobAuthenticated);
    assertEquals(bobStateAfterAccept.friends.length, 1, "Bob should have one friend after acceptance");
    assertEquals(bobStateAfterAccept.friends[0], aliceAuthenticated, "Bob's friend should be Alice");

    // Verify pending requests are cleared
    assertEquals(bobStateAfterAccept.pendingRequests.length, 0, "Bob should have no pending requests after acceptance");
    assertEquals(aliceStateAfterAccept.sentRequests.length, 0, "Alice should have no pending sent requests after acceptance");

    // Scenario 3: Alice sends a request to Charlie, and Charlie rejects it
    const sendRequestResult2 = await friending.sendRequest({
      fromUserId: aliceAuthenticated,
      toUserId: charlieAuthenticated,
    });
    const friendRequestId2 = sendRequestResult2.friendRequest.id;

    const rejectRequestResult = await friending.rejectRequest({
      friendRequestId: friendRequestId2,
      authenticatedUserId: charlieAuthenticated,
    });
    assertEquals(rejectRequestResult.status, "rejected", "rejectRequest should change status to rejected");

    // Verify friend lists remain unchanged
    const aliceStateAfterReject = await friending._getUserState(aliceAuthenticated);
    assertEquals(aliceStateAfterReject.friends.length, 1, "Alice's friends count should not change after rejection");

    const charlieStateAfterReject = await friending._getUserState(charlieAuthenticated);
    assertEquals(charlieStateAfterReject.friends.length, 0, "Charlie should have no friends");
    assertEquals(charlieStateAfterReject.pendingRequests.length, 0, "Charlie should have no pending requests after rejection");
    assertEquals(aliceStateAfterReject.sentRequests.length, 0, "Alice should have no pending sent requests after rejection");


    // Scenario 4: Alice sends a request to Bob again (should fail)
    await assertThrowsAsync(async () => {
      await friending.sendRequest({
        fromUserId: aliceAuthenticated,
        toUserId: bobAuthenticated,
      });
    }, "Should not be able to send a request to an existing friend");

    // Scenario 5: Bob tries to accept a request that doesn't exist
    await assertThrowsAsync(async () => {
      await friending.acceptRequest({
        friendRequestId: "nonexistent-request-id",
        authenticatedUserId: bobAuthenticated,
      });
    }, "Should not be able to accept a non-existent request");

    // Scenario 6: Charlie tries to accept a request sent to Bob
    await assertThrowsAsync(async () => {
      await friending.acceptRequest({
        friendRequestId: friendRequestId1,
        authenticatedUserId: charlieAuthenticated,
      });
    }, "Charlie should not be able to accept Bob's request");

    // Scenario 7: Alice cancels her request to Bob (after it was accepted, should fail)
    await assertThrowsAsync(async () => {
      await friending.cancelRequest({
        friendRequestId: friendRequestId1,
        authenticatedUserId: aliceAuthenticated,
      });
    }, "Alice should not be able to cancel an accepted request");

    // Scenario 8: Alice sends a request to Bob, Bob rejects it, Alice tries to cancel
    const sendRequestResult3 = await friending.sendRequest({
      fromUserId: aliceAuthenticated,
      toUserId: bobAuthenticated,
    });
    const friendRequestId3 = sendRequestResult3.friendRequest.id;

    await friending.rejectRequest({
      friendRequestId: friendRequestId3,
      authenticatedUserId: bobAuthenticated,
    });

    await assertThrowsAsync(async () => {
      await friending.cancelRequest({
        friendRequestId: friendRequestId3,
        authenticatedUserId: aliceAuthenticated,
      });
    }, "Alice should not be able to cancel a rejected request");

    await client.close();
  });
});
```
