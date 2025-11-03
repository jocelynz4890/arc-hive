/**
 * Initialization syncs that set up a user across multiple concepts.
 * When a user registers, this sync ensures they have:
 * - Friend code generated
 * - Stats initialized
 * - Rewards initialized
 * Uses request/response model to properly handle HTTP requests.
 */

import { Authentication, Friending, StatTracking, Rewarding, Requesting } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Registration request handler - triggers when HTTP POST to /api/Authentication/register
 */
export const RegisterUserRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/Authentication/register", username, password },
    { request },
  ]),
  then: actions([Authentication.register, { username, password }]),
});

/**
 * After a user registers, initialize their friend code, stats, and rewards.
 * This sync triggers when Authentication.register completes.
 */
export const InitializeNewUser: Sync = ({ user, username }) => ({
  when: actions(
    [Authentication.register, {}, { user, username }],
  ),
  then: actions(
    [Friending.generateFriendCode, { user: username }],
    [StatTracking.initializeStats, { user }],
    [Rewarding.initializeRewards, { user: username }],
  ),
});

/**
 * Registration response handler - completes the HTTP request
 */
export const RegisterUserResponse: Sync = ({ request, user, username }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/register" }, { request }],
    [Authentication.register, {}, { user, username }],
  ),
  then: actions([Requesting.respond, { request, user, username }]),
});

/**
 * Registration error response handler - handles errors from registration
 */
export const RegisterUserResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/register" }, { request }],
    [Authentication.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Validate session request handler - validates a session token
 */
export const ValidateSessionRequest: Sync = ({ request, token }) => ({
  when: actions([
    Requesting.request,
    { path: "/Authentication/validateSession", token },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token }]),
});

/**
 * Validate session response handler
 */
export const ValidateSessionResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/validateSession" }, { request }],
    [Authentication.validateSession, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

/**
 * Validate session error response handler
 */
export const ValidateSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/validateSession" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Invalidate session request handler - invalidates a session token
 */
export const InvalidateSessionRequest: Sync = ({ request, token }) => ({
  when: actions([
    Requesting.request,
    { path: "/Authentication/invalidateSession", token },
    { request },
  ]),
  then: actions([Authentication.invalidateSession, { token }]),
});

/**
 * Invalidate session response handler
 */
export const InvalidateSessionResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/invalidateSession" }, { request }],
    [Authentication.invalidateSession, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

/**
 * Invalidate session error response handler
 */
export const InvalidateSessionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Authentication/invalidateSession" }, { request }],
    [Authentication.invalidateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

