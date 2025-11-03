/**
 * Daily refresh syncs that process all arcs when DailyRefresh.trigger is called.
 * Uses request/response model to properly handle HTTP passthrough.
 */

import { DailyRefresh, ArcTracking, StatTracking, Rewarding, Requesting } from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Daily refresh request handler - triggers when HTTP POST to /api/DailyRefresh/trigger
 * Requires a secret for security
 */
export const DailyRefreshRequest: Sync = ({ request, secret }) => ({
  when: actions([
    Requesting.request,
    { path: "/DailyRefresh/trigger", secret },
    { request },
  ]),
  then: actions([DailyRefresh.trigger, { secret }]),
});

/**
 * Trigger refresh of all arcs when daily refresh is triggered.
 */
export const TriggerRefreshArcs: Sync = ({ success }) => ({
  when: actions(
    [DailyRefresh.trigger, {}, { success }],
  ),
  then: actions(
    [ArcTracking.refreshAllArcs, {}, {}],
  ),
});

/**
 * Update stats based on arc refresh results.
 */
export const UpdateStatsFromRefresh: Sync = ({ statUpdates }) => ({
  when: actions(
    [ArcTracking.refreshAllArcs, {}, { statUpdates }],
  ),
  then: actions(
    [StatTracking.batchUpdateStats, { updates: statUpdates }, {}],
  ),
});

/**
 * Award points based on arc refresh results.
 */
export const AwardPointsFromRefresh: Sync = ({ rewards }) => ({
  when: actions(
    [ArcTracking.refreshAllArcs, {}, { rewards }],
  ),
  then: actions(
    [Rewarding.batchAwardPoints, { awards: rewards }, {}],
  ),
});

/**
 * Daily refresh response handler - completes the HTTP request
 */
export const DailyRefreshResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/DailyRefresh/trigger" }, { request }],
    [DailyRefresh.trigger, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, result: {} }]),
});

/**
 * Daily refresh error handler - handles errors from trigger
 */
export const DailyRefreshResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/DailyRefresh/trigger" }, { request }],
    [DailyRefresh.trigger, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

