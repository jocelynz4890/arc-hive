# Security Summary

## Overview

This document summarizes the security measures implemented in ArcHive, including passthrough route configuration, request/response syncs, and frontend/backend coordination.

## Request/Response Model Implementation

### Secured Routes (Excluded from Passthrough)

**ALL write operations** are secured using the request/response model. These routes bypass direct passthrough and require explicit sync handlers:

#### User Registration

- **Route:** `/api/Authentication/register`
- **Syncs:** `RegisterUserRequest`, `RegisterUserResponse`, `RegisterUserResponseError`
- **Purpose:** User registration with automatic initialization
- **Auto-initialization:** Friend code, stats, and rewards are automatically set up via `InitializeNewUser` sync

#### Session Management

- **Routes:** `/api/Authentication/createSession`, `/api/Authentication/validateSession`, `/api/Authentication/invalidateSession`
- **Syncs:** `ValidateSessionRequest`, `ValidateSessionResponse`, `ValidateSessionResponseError`, `InvalidateSessionRequest`, `InvalidateSessionResponse`, `InvalidateSessionResponseError`
- **Purpose:** Secure session tracking for authenticated users
- **Security:** Provides secure token-based authentication that maps tokens to users
- **Implementation:** Sessions stored in MongoDB with token -> user mapping

#### Arc Tracking Write Operations

- **Routes:** `/api/ArcTracking/createArc`, `/api/ArcTracking/addMemberToArc`, `/api/ArcTracking/markProgress`, `/api/ArcTracking/markNoProgress`
- **Syncs:** `*Request`, `*Response`, `*ResponseError` for each operation (in `arcTracking.sync.ts`)
- **Purpose:** Secure arc management and progress tracking
- **Security:** Prevents unauthorized arc manipulation

#### Friending Write Operations

- **Routes:** `/api/Friending/addFriend`, `/api/Friending/removeFriend`, `/api/Friending/getFriendCodeByUsername`
- **Syncs:** `*Request`, `*Response`, `*ResponseError` for each operation (in `friending.sync.ts`)
- **Purpose:** Secure friend management and friend code retrieval
- **Security:** Prevents unauthorized friendship manipulation and friend code exposure

#### Point Management

- **Routes:** `/api/Rewarding/earnPoints`, `/api/Rewarding/spendPoints`
- **Syncs:**
  - `EarnPointsRequest`, `EarnPointsResponse`, `EarnPointsResponseError`
  - `SpendPointsRequest`, `SpendPointsResponse`, `SpendPointsResponseError`
- **Purpose:** Secure point transactions with error handling
- **Security:** Prevents unauthorized point manipulation

#### Avatar Management

- **Routes:** `/api/Rewarding/addAvatar`, `/api/Rewarding/setCurrentAvatar`
- **Syncs:** `AddAvatarRequest`, `AddAvatarResponse`, `AddAvatarResponseError`, `SetCurrentAvatarRequest`, `SetCurrentAvatarResponse`, `SetCurrentAvatarResponseError`
- **Purpose:** Secure avatar ownership assignment
- **Security:** Prevents unauthorized avatar grants and manipulation

#### Daily Refresh

- **Route:** `/api/DailyRefresh/trigger`
- **Syncs:** `DailyRefreshRequest`, `DailyRefreshResponse`, plus chained refresh syncs
- **Purpose:** Scheduled batch processing for all users
- **Deployment:** Cron job on Render using `scripts/daily_refresh_cron.sh`

#### Likert Survey Write Operations

- **Routes:** `/api/LikertSurvey/createSurvey`, `/api/LikertSurvey/addQuestion`, `/api/LikertSurvey/submitResponse`, `/api/LikertSurvey/updateResponse`
- **Syncs:** `*Request`, `*Response`, `*ResponseError` (sample syncs in `sample.sync.ts`)
- **Purpose:** Secure survey creation and response management
- **Security:** Prevents unauthorized survey manipulation

### Internal/Backend-Only Routes (Excluded from Passthrough)

These routes are used exclusively by backend syncs and should never be called directly:

#### Initialization Routes

- `/api/Friending/generateFriendCode`
- `/api/StatTracking/initializeStats`
- `/api/Rewarding/initializeRewards`

#### Batch Processing Routes

- `/api/ArcTracking/refreshAllArcs`
- `/api/StatTracking/batchUpdateStats`
- `/api/Rewarding/batchAwardPoints`

#### Arc Update Routes

- `/api/ArcTracking/updateArcStreak`
- `/api/StatTracking/updateStatWithCompletedTask`
- `/api/StatTracking/updateStatWithIncompleteTask`

#### Internal Queries

- `/api/Authentication/_getAllUsers`
- `/api/Authentication/_getUserByUsername`
- `/api/Authentication/_getUsernameById`
- `/api/Rewarding/_getRewardDetails`
- `/api/Rewarding/_getAvatarDefinition`
- `/api/Rewarding/_userExists`

## Passthrough Routes (Public API - READ-ONLY)

**Only read-only operations** are exposed directly via passthrough. All write operations are secured through the request/response model.

### Authentication

- `/api/Authentication/authenticate` - User login with username/password

### Arc Tracking (Read-Only)

- `/api/ArcTracking/getArcStatus` - Get current progress status
- `/api/ArcTracking/getArcs` - Get user's arcs
- `/api/ArcTracking/getArc` - Get arc details

### Friending (Read-Only)

- `/api/Friending/listFriends` - Get user's friends
- `/api/Friending/getUserByFriendCode` - Lookup user by friend code
- `/api/Friending/areFriends` - Check friendship status

### Rewarding (Read-Only)

- `/api/Rewarding/listAvatars` - List owned avatars
- `/api/Rewarding/getPoints` - Get point balance
- `/api/Rewarding/getRarity` - Get rarity chances
- `/api/Rewarding/getAvailableAvatarIds` - Get unlocked avatar IDs
- `/api/Rewarding/getAvatarsByName` - Lookup avatar definitions by name
- `/api/Rewarding/getAvatarsByIds` - Lookup avatar definitions by ID
- `/api/Rewarding/pickRandomAvatar` - Select random avatar (read-only)
- `/api/Rewarding/getCurrentAvatar` - Get active avatar

### Stat Tracking (Read-Only)

- `/api/StatTracking/getStats` - Get user stats

## Frontend Changes

### Authentication Store (`arc-hive-frontend/src/stores/auth.ts`)

- ✅ **Updated** `ensureFriendCodeOnServer` → `getFriendCodeFromServer`
- ✅ **Changed** from calling `/api/Friending/generateFriendCode` (excluded) to `/api/Friending/getFriendCodeByUsername` (now secured)
- ✅ **Removed** dependency on direct friend code generation; now uses backend-generated codes

### App Component (`arc-hive-frontend/src/App.vue`)

- ✅ **Removed** frontend `dailyRefreshService` initialization
- ✅ **Removed** manual event listeners for daily refresh

### View Components

- ✅ **Removed** manual stats initialization from `HomePage.vue`
- ✅ **Removed** `onDailyRefresh` listeners from `ArcsPage.vue`, `HomePage.vue`, `RewardsPage.vue`
- ✅ **Removed** unused `onUnmounted` imports
- ✅ **Removed** invalid `getUserById` calls from `HomePage.vue` and `FriendsPage.vue`

### RewardsPage Component

- ✅ **Updated** to use secured `earnPoints`, `spendPoints`, and `addAvatar` endpoints
- ✅ **Flow:** `spendPoints` → `pickRandomAvatar` → `addAvatar` (all properly secured)

### All Frontend Write Operations

- ✅ All frontend write operations (arc creation, progress marking, friend management, avatar changes, etc.) automatically route through secure request/response syncs
- ✅ No frontend changes required - the security layer is transparent

## Backend Sync Architecture

### Sync Files

#### `initialization.sync.ts`

- `RegisterUserRequest` - Receives registration HTTP request
- `InitializeNewUser` - Triggers automatic user setup (friend code, stats, rewards)
- `RegisterUserResponse` - Returns successful registration
- `RegisterUserResponseError` - Returns registration errors
- `ValidateSessionRequest/Response/ResponseError` - Validate session token
- `InvalidateSessionRequest/Response/ResponseError` - Invalidate session token

#### `arcTracking.sync.ts`

- `CreateArcRequest/Response/ResponseError` - Arc creation with error handling
- `AddMemberToArcRequest/Response/ResponseError` - Add member with error handling
- `MarkProgressRequest/Response/ResponseError` - Mark progress with error handling
- `MarkNoProgressRequest/Response/ResponseError` - Mark no progress with error handling

#### `friending.sync.ts`

- `AddFriendRequest/Response/ResponseError` - Add friend with error handling
- `RemoveFriendRequest/Response/ResponseError` - Remove friend with error handling
- `GetFriendCodeByUsernameRequest/Response/ResponseError` - Get friend code with error handling

#### `rewarding.sync.ts`

- `EarnPointsRequest/Response/ResponseError` - Point earning with error handling
- `SpendPointsRequest/Response/ResponseError` - Point spending with error handling
- `AddAvatarRequest/Response/ResponseError` - Avatar assignment with error handling

#### `rewardingSetAvatar.sync.ts`

- `SetCurrentAvatarRequest/Response/ResponseError` - Set current avatar with error handling

#### `dailyRefresh.sync.ts`

- `DailyRefreshRequest` - Receives trigger HTTP request
- `TriggerRefreshArcs` - Initiates arc refresh process
- `UpdateStatsFromRefresh` - Updates stats based on arc completion
- `AwardPointsFromRefresh` - Awards points for completed arcs
- `DailyRefreshResponse` - Completes HTTP response

#### `sample.sync.ts`

- `CreateSurveyRequest/Response` - Survey creation (sample)
- `AddQuestionRequest/Response` - Question creation (sample)

### Batch Actions in Concepts

Each concept provides internal batch actions for efficient processing:

- `ArcTracking.refreshAllArcs()` - Processes all arcs, returns stat updates and rewards
- `StatTracking.batchUpdateStats()` - Applies multiple stat updates
- `Rewarding.batchAwardPoints()` - Awards points to multiple users

## Deployment

### Render Cron Job Configuration

**Script:** `scripts/daily_refresh_cron.sh`

- **Schedule:** `0 0 * * *` (midnight UTC daily)
- **Command:** `bash scripts/daily_refresh_cron.sh`
- **Environment:** Same as web service
- **Environment Variables:** `RENDER_SERVICE_URL` (optional, auto-detected)

**Testing:**

```bash
# Manual trigger
curl -X POST https://your-app.onrender.com/api/DailyRefresh/trigger

# Local testing
curl -X POST http://localhost:8000/api/DailyRefresh/trigger
```

## Security Considerations

### ✅ Secured Operations

1. **User initialization** - All setup happens automatically via backend syncs
2. **Point transactions** - Earn/spend validated through request/response
3. **Avatar assignment** - Prevented unauthorized grants via exclusion
4. **Daily refresh** - Only accessible via cron or manual trigger
5. **Batch operations** - All backend-only, never exposed

### ⚠️ Current Limitations

1. **Session Management Not Integrated** - Session management exists in `Authentication` concept but is not yet used by write operation syncs
2. **No User Identity Validation in Syncs** - Write operations don't currently validate that the requesting user matches the `user` parameter in the action
3. **Frontend Doesn't Use Sessions** - Frontend still uses simple `'authenticated'` token in localStorage instead of real session tokens
4. **No Rate Limiting** - Unlimited requests to public endpoints
5. **No CORS Configuration** - Needs explicit CORS setup for production

### 🔒 Recommended Future Enhancements

1. ✅ **Session Management Added** - Sessions now tracked in MongoDB with token -> user mapping
2. **Add Authentication Checks to Syncs** - Modify write operation syncs to validate session tokens before executing
3. **Implement Authorization Checks** - Verify users can only modify their own data (user in request matches authenticated session user)
4. **Update Frontend to Use Sessions** - Have frontend call `createSession` on login and pass tokens with all requests
5. **Add Rate Limiting** - Prevent abuse of public endpoints
6. **Configure CORS** - Proper CORS setup for production deployment
7. **Add Request Logging/Auditing** - Track all sensitive operations for security monitoring

### Example: How to Add Authentication to Syncs

Session management is now available in the `Authentication` concept. To add auth checks to write operation syncs, they should look like:

```typescript
export const CreateArcRequest: Sync = ({
  request,
  sessionToken,
  name,
  stat,
  members,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/createArc", sessionToken, name, stat, members },
    { request },
  ]),
  then: actions([Authentication.validateSession, { token: sessionToken }]),
});

export const CreateArcWithAuth: Sync = ({
  request,
  sessionToken,
  authenticatedUser,
  name,
  stat,
  members,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/ArcTracking/createArc" },
    { request },
    [Authentication.validateSession, {}, { user: authenticatedUser }],
  ]),
  // Additional authorization check: authenticatedUser must be in members
  then: actions([ArcTracking.createArc, { name, stat, members }]),
});
```

## Testing

All excluded routes should be tested via their corresponding request/response syncs. The frontend has been updated to use the appropriate endpoints for all operations.

## Files Modified

### Backend

- `src/concepts/Requesting/passthrough.ts` - Moved ALL write operations to exclusions, added session routes
- `src/syncs/initialization.sync.ts` - User registration and session management syncs
- `src/syncs/arcTracking.sync.ts` - Arc management syncs (new)
- `src/syncs/friending.sync.ts` - Friend management syncs (new)
- `src/syncs/rewarding.sync.ts` - Point management syncs
- `src/syncs/rewardingSetAvatar.sync.ts` - Avatar selection syncs (new)
- `src/syncs/dailyRefresh.sync.ts` - Daily refresh syncs
- `src/main.ts` - Removed scheduler, added deployment notes
- `src/concepts/Authentication/AuthenticationConcept.ts` - Added session management (createSession, validateSession, invalidateSession, \_getUserBySession)
- `src/concepts/ArcTracking/ArcTrackingConcept.ts` - Added `refreshAllArcs` batch action
- `src/concepts/StatTracking/StatTrackingConcept.ts` - Added `batchUpdateStats` batch action
- `src/concepts/Rewarding/RewardingConcept.ts` - Added `batchAwardPoints` batch action

### Frontend

- `src/stores/auth.ts` - Updated friend code fetching
- `src/App.vue` - Removed frontend refresh service
- `src/views/ArcsPage.vue` - Removed event listeners
- `src/views/HomePage.vue` - Removed manual stats initialization, invalid API calls
- `src/views/FriendsPage.vue` - Removed invalid getUserById calls
- `src/views/RewardsPage.vue` - Removed event listeners

### Deployment

- `scripts/daily_refresh_cron.sh` - Render cron script
- `DEPLOYMENT.md` - Deployment documentation
