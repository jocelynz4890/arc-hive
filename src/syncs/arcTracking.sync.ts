import { ArcTracking, Requesting, Authentication } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Create arc request/response handlers with authentication
 */

export const CreateArcRequest: Sync = ({ request, sessionToken, name, stat, members }) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/createArc", sessionToken, name, stat, members },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const CreateArcWithAuth: Sync = ({ request, user, name, stat, members }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/createArc", name, stat, members }, { request }],
    [Authentication.validateSession, {}, { user }],
  ),
  then: actions([ArcTracking.createArc, { name, stat, members }]),
});

export const CreateArcResponse: Sync = ({ request, arc }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/createArc" }, { request }],
    [ArcTracking.createArc, {}, { arc }],
  ),
  then: actions([Requesting.respond, { request, arc }]),
});

export const CreateArcResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/createArc" }, { request }],
    [ArcTracking.createArc, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateArcAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/createArc" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Add member to arc request/response handlers with authentication
 */

export const AddMemberToArcRequest: Sync = ({ request, sessionToken, user, arc }) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/addMemberToArc", sessionToken, user, arc },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const AddMemberToArcWithAuth: Sync = ({ request, authenticatedUser, user, arc }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/addMemberToArc", user, arc }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([ArcTracking.addMemberToArc, { user, arc }]),
});

export const AddMemberToArcResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/addMemberToArc" }, { request }],
    [ArcTracking.addMemberToArc, {}, {}],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

export const AddMemberToArcResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/addMemberToArc" }, { request }],
    [ArcTracking.addMemberToArc, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AddMemberToArcAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/addMemberToArc" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Mark progress request/response handlers with authentication
 */

export const MarkProgressRequest: Sync = ({ request, sessionToken, user, arc }) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/markProgress", sessionToken, user, arc },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const MarkProgressWithAuth: Sync = ({ request, authenticatedUser, user, arc }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markProgress", user, arc }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([ArcTracking.markProgress, { user, arc }]),
});

export const MarkProgressResponse: Sync = ({ request, progress }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markProgress" }, { request }],
    [ArcTracking.markProgress, {}, { progress }],
  ),
  then: actions([Requesting.respond, { request, progress }]),
});

export const MarkProgressResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markProgress" }, { request }],
    [ArcTracking.markProgress, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const MarkProgressAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markProgress" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Mark no progress request/response handlers with authentication
 */

export const MarkNoProgressRequest: Sync = ({ request, sessionToken, user, arc }) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/markNoProgress", sessionToken, user, arc },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const MarkNoProgressWithAuth: Sync = ({ request, authenticatedUser, user, arc }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markNoProgress", user, arc }, { request }],
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ),
  then: actions([ArcTracking.markNoProgress, { user, arc }]),
});

export const MarkNoProgressResponse: Sync = ({ request, progress }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markNoProgress" }, { request }],
    [ArcTracking.markNoProgress, {}, { progress }],
  ),
  then: actions([Requesting.respond, { request, progress }]),
});

export const MarkNoProgressResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markNoProgress" }, { request }],
    [ArcTracking.markNoProgress, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const MarkNoProgressAuthError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ArcTracking/markNoProgress" }, { request }],
    [Authentication.validateSession, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

