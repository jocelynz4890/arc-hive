/**
 * Rewarding syncs that handle security-sensitive reward operations.
 * Uses request/response model to properly validate and handle HTTP requests.
 * Includes authentication to ensure only authorized users can perform operations.
 */

import { Rewarding, Requesting, Authentication } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Earn points request handler - validates and processes point awards
 */
export const EarnPointsRequest: Sync = ({ request, sessionToken, user, points }) => ({
  when: actions([
    Requesting.request,
    { path: "/Rewarding/earnPoints", sessionToken, user, points },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

/**
 * Earn points with authentication
 */
export const EarnPointsWithAuth: Sync = ({ request, authenticatedUser, user, points }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/earnPoints", user, points }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Rewarding.earnPoints, { user, points }]),
});

/**
 * Earn points success response handler
 */
export const EarnPointsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/earnPoints" }, { request }],
    [Rewarding.earnPoints, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

/**
 * Earn points error response handler
 */
export const EarnPointsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/earnPoints" }, { request }],
    [Rewarding.earnPoints, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Earn points auth error response handler
 */
export const EarnPointsAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/earnPoints" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Spend points request handler - validates and processes point spending
 */
export const SpendPointsRequest: Sync = ({ request, sessionToken, user, points }) => ({
  when: actions([
    Requesting.request,
    { path: "/Rewarding/spendPoints", sessionToken, user, points },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

/**
 * Spend points with authentication
 */
export const SpendPointsWithAuth: Sync = ({ request, authenticatedUser, user, points }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/spendPoints", user, points }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Rewarding.spendPoints, { user, points }]),
});

/**
 * Spend points success response handler
 */
export const SpendPointsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/spendPoints" }, { request }],
    [Rewarding.spendPoints, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

/**
 * Spend points error response handler
 */
export const SpendPointsResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/spendPoints" }, { request }],
    [Rewarding.spendPoints, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Spend points auth error response handler
 */
export const SpendPointsAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/spendPoints" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Add avatar request handler - validates and processes avatar addition
 */
export const AddAvatarRequest: Sync = ({ request, sessionToken, user, avatar }) => ({
  when: actions([
    Requesting.request,
    { path: "/Rewarding/addAvatar", sessionToken, user, avatar },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

/**
 * Add avatar with authentication
 */
export const AddAvatarWithAuth: Sync = ({ request, authenticatedUser, user, avatar }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/addAvatar", user, avatar }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([Rewarding.addAvatar, { user, avatar }]),
});

/**
 * Add avatar success response handler
 */
export const AddAvatarResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/addAvatar" }, { request }],
    [Rewarding.addAvatar, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

/**
 * Add avatar error response handler
 */
export const AddAvatarResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/addAvatar" }, { request }],
    [Rewarding.addAvatar, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Add avatar auth error response handler
 */
export const AddAvatarAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Rewarding/addAvatar" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
