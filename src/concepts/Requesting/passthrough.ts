/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // ArcTracking routes - READ-ONLY
  "/api/ArcTracking/getArcStatus": "Get current progress status of all arc members",
  "/api/ArcTracking/getArcs": "Get all arcs a user is a member of",
  "/api/ArcTracking/getArc": "Get full details of a specific arc",

  // Authentication routes
  "/api/Authentication/authenticate": "Authenticate user with username and password",
  "/api/Authentication/createSession": "Create a new session for authenticated user",

  // Friending routes - READ-ONLY
  "/api/Friending/listFriends": "Get all friends of a user",
  "/api/Friending/getUserByFriendCode": "Look up a user by their friend code",
  "/api/Friending/areFriends": "Check if two users are friends",

  // Rewarding routes - READ-ONLY
  "/api/Rewarding/listAvatars": "Get all avatars owned by a user",
  "/api/Rewarding/getPoints": "Get current point balance for a user",
  "/api/Rewarding/getRarity": "Get probability chance for a rarity level",
  "/api/Rewarding/getAvailableAvatarIds": "Get all avatar IDs available to a user",
  "/api/Rewarding/getAvatarsByName": "Look up avatar definitions by name",
  "/api/Rewarding/getAvatarsByIds": "Look up avatar definitions by ID",
  "/api/Rewarding/pickRandomAvatar": "Select a random avatar weighted by rarity",
  "/api/Rewarding/getCurrentAvatar": "Get user's currently active avatar",

  // StatTracking routes - READ-ONLY
  "/api/StatTracking/getStats": "Get all stat values for a user",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Routes used by backend syncs - should not be called directly from frontend
  "/api/Friending/generateFriendCode",
  "/api/StatTracking/initializeStats",
  "/api/Rewarding/initializeRewards",
  "/api/ArcTracking/updateArcStreak",
  "/api/StatTracking/updateStatWithCompletedTask",
  "/api/StatTracking/updateStatWithIncompleteTask",
  "/api/ArcTracking/refreshAllArcs",
  "/api/StatTracking/batchUpdateStats",
  "/api/Rewarding/batchAwardPoints",
  // Internal queries - should not be exposed publicly
  "/api/Authentication/_getAllUsers",
  "/api/Authentication/_getUserByUsername",
  "/api/Authentication/_getUsernameById",
  "/api/Authentication/_getUserBySession",
  "/api/Rewarding/_getRewardDetails",
  "/api/Rewarding/_getAvatarDefinition",
  "/api/Rewarding/_userExists",
  // All write operations - need authentication/authorization
  "/api/Authentication/register",
  "/api/Authentication/validateSession",
  "/api/Authentication/invalidateSession",
  "/api/DailyRefresh/trigger",
  // ArcTracking write operations
  "/api/ArcTracking/createArc",
  "/api/ArcTracking/addMemberToArc",
  "/api/ArcTracking/markProgress",
  "/api/ArcTracking/markNoProgress",
  // Friending write operations
  "/api/Friending/addFriend",
  "/api/Friending/removeFriend",
  "/api/Friending/getFriendCodeByUsername",
  // Rewarding write operations
  "/api/Rewarding/earnPoints",
  "/api/Rewarding/spendPoints",
  "/api/Rewarding/addAvatar",
  "/api/Rewarding/setCurrentAvatar",
  // LikertSurvey write operations
  "/api/LikertSurvey/createSurvey",
  "/api/LikertSurvey/addQuestion",
  "/api/LikertSurvey/submitResponse",
  "/api/LikertSurvey/updateResponse",
];
