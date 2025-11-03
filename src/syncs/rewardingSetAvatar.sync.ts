import { Rewarding, Requesting, Authentication } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Set current avatar request/response handlers with authentication
 */

export const SetCurrentAvatarRequest: Sync = ({ request, sessionToken, user, avatar }) => ({
  when: actions([
    Requesting.request,
    { path: "/Rewarding/setCurrentAvatar", sessionToken, user, avatar },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const SetCurrentAvatarWithAuth: Sync = ({ request, authenticatedUser, user, avatar }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/setCurrentAvatar", user, avatar }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Rewarding.setCurrentAvatar, { user, avatar }]),
});

export const SetCurrentAvatarResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/setCurrentAvatar" }, { request }],
    [Rewarding.setCurrentAvatar, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

export const SetCurrentAvatarResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/setCurrentAvatar" }, { request }],
    [Rewarding.setCurrentAvatar, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const SetCurrentAvatarAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/setCurrentAvatar" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
