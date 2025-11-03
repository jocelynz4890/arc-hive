import { Friending, Requesting, Authentication } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Add friend request/response handlers with authentication
 */

export const AddFriendRequest: Sync = ({ request, sessionToken, from, to }) => ({
  when: actions([
    Requesting.request,
    { path: "/Friending/addFriend", sessionToken, from, to },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const AddFriendWithAuth: Sync = ({ request, authenticatedUser, from, to }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/addFriend", from, to }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Friending.addFriend, { from, to }]),
});

export const AddFriendResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/addFriend" }, { request }],
    [Friending.addFriend, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

export const AddFriendResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/addFriend" }, { request }],
    [Friending.addFriend, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AddFriendAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/addFriend" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Remove friend request/response handlers with authentication
 */

export const RemoveFriendRequest: Sync = ({ request, sessionToken, from, to }) => ({
  when: actions([
    Requesting.request,
    { path: "/Friending/removeFriend", sessionToken, from, to },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const RemoveFriendWithAuth: Sync = ({ request, authenticatedUser, from, to }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend", from, to }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Friending.removeFriend, { from, to }]),
});

export const RemoveFriendResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend" }, { request }],
    [Friending.removeFriend, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

export const RemoveFriendResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend" }, { request }],
    [Friending.removeFriend, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RemoveFriendAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/removeFriend" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Get friend code by username request/response handlers with authentication
 */

export const GetFriendCodeByUsernameRequest: Sync = ({ request, sessionToken, username }) => ({
  when: actions([
    Requesting.request,
    { path: "/Friending/getFriendCodeByUsername", sessionToken, username },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const GetFriendCodeByUsernameWithAuth: Sync = ({ request, authenticatedUser, username }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/getFriendCodeByUsername", username }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Friending.getFriendCodeByUsername, { username }]),
});

export const GetFriendCodeByUsernameResponse: Sync = ({ request, friendcode }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/getFriendCodeByUsername" }, { request }],
    [Friending.getFriendCodeByUsername, {}, { friendcode }],
  ),
  then: actions([Requesting.respond, { request, friendcode }]),
});

export const GetFriendCodeByUsernameResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/getFriendCodeByUsername" }, { request }],
    [Friending.getFriendCodeByUsername, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const GetFriendCodeByUsernameAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Friending/getFriendCodeByUsername" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
