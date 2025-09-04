import express from 'express';

import FollowController from '../controllers/follow.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  dataFetchLimiter,
  followToggleLimiter,
  mutualFollowersLimiter,
  searchLimiter,
} from '../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Follow
 *     description: User follow/unfollow management and social interactions
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT access token for authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Follow:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique follow relationship identifier
 *         followerId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who is following
 *         followingUserId:
 *           type: string
 *           format: uuid
 *           description: ID of the user being followed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the follow relationship was created
 *         follower:
 *           $ref: '#/components/schemas/UserSummary'
 *         following:
 *           $ref: '#/components/schemas/UserSummary'
 *     UserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         username:
 *           type: string
 *         name:
 *           type: string
 *           nullable: true
 *         user_type:
 *           type: string
 *           enum: [INDIVIDUAL, BUSINESS, ADMIN]
 *         logo_url:
 *           type: string
 *           nullable: true
 *         about:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     FollowStatus:
 *       type: object
 *       properties:
 *         isFollowing:
 *           type: boolean
 *           description: Whether the user is following the target user
 *         followedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the follow relationship was created
 *     FollowCounts:
 *       type: object
 *       properties:
 *         followers:
 *           type: integer
 *           description: Number of followers
 *         following:
 *           type: integer
 *           description: Number of users being followed
 *     FollowersResponse:
 *       type: object
 *       properties:
 *         followers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserSummary'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     FollowingResponse:
 *       type: object
 *       properties:
 *         following:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserSummary'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     MutualFollowersResponse:
 *       type: object
 *       properties:
 *         mutualFollowers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserSummary'
 *         count:
 *           type: integer
 *           description: Number of mutual followers
 *     UserSearchResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             allOf:
 *               - $ref: '#/components/schemas/UserSummary'
 *               - $ref: '#/components/schemas/FollowStatus'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 */

/**
 * @swagger
 * /api/follow/{followingUserId}/toggle:
 *   post:
 *     summary: Toggle follow/unfollow a user
 *     description: |
 *       Toggles the follow relationship between the authenticated user and another user.
 *       If the user is already being followed, this will unfollow them.
 *       If the user is not being followed, this will follow them.
 *       **Validation:**
 *       - Both users must exist and be active
 *       - Cannot follow yourself
 *       **Response includes:**
 *       - `action`: "followed" or "unfollowed"
 *       - `isFollowing`: boolean indicating current follow status
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followingUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to toggle follow status with
 *     responses:
 *       200:
 *         description: Successfully toggled follow status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Successfully followed user
 *                 data:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                       enum: [followed, unfollowed]
 *                       example: followed
 *                     message:
 *                       type: string
 *                       example: Successfully followed user
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *             examples:
 *               followed:
 *                 summary: User successfully followed
 *                 value:
 *                   status: "success"
 *                   message: "Successfully followed user"
 *                   data:
 *                     action: "followed"
 *                     message: "Successfully followed user"
 *                     isFollowing: true
 *               unfollowed:
 *                 summary: User successfully unfollowed
 *                 value:
 *                   status: "success"
 *                   message: "Successfully unfollowed user"
 *                   data:
 *                     action: "unfollowed"
 *                     message: "Successfully unfollowed user"
 *                     isFollowing: false
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Users cannot follow themselves
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: User not found or inactive
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:followingUserId/toggle',
  followToggleLimiter,
  requireAuth(),
  FollowController.toggleFollow,
);

/**
 * @swagger
 * /api/follow/{followingUserId}/status:
 *   get:
 *     summary: Check follow status
 *     description: |
 *       Checks whether the authenticated user is following another user.
 *       Returns follow status, type, and when the relationship was created.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followingUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to check follow status for
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Follow status retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowStatus'
 *       400:
 *         description: Bad request - missing user ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/:followingUserId/status', requireAuth(), FollowController.checkFollowStatus);

/**
 * @swagger
 * /api/follow/{userId}/followers:
 *   get:
 *     summary: Get user's followers
 *     description: |
 *       Retrieves a paginated list of users who follow the specified user.
 *       Returns user details including username, type, logo, and about information.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user whose followers to retrieve
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Followers retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowersResponse'
 *       400:
 *         description: Bad request - missing user ID
 *       404:
 *         description: User not found or inactive
 *       500:
 *         description: Internal server error
 */
router.get('/:userId/followers', requireAuth(), FollowController.getFollowers);

/**
 * @swagger
 * /api/follow/{userId}/following:
 *   get:
 *     summary: Get user's following list
 *     description: |
 *       Retrieves a paginated list of users that the specified user is following.
 *       Returns user details including username, type, logo, and about information.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user whose following list to retrieve
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Following list retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowingResponse'
 *       400:
 *         description: Bad request - missing user ID
 *       404:
 *         description: User not found or inactive
 *       500:
 *         description: Internal server error
 */
router.get('/:userId/following', requireAuth(), FollowController.getFollowing);

/**
 * @swagger
 * /api/follow/{userId}/counts:
 *   get:
 *     summary: Get user's follow counts
 *     description: |
 *       Retrieves the total number of followers and following for a specific user.
 *       Useful for displaying follower/following counts on user profiles.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user whose follow counts to retrieve
 *     responses:
 *       200:
 *         description: Follow counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Follow counts retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowCounts'
 *       400:
 *         description: Bad request - missing user ID
 *       404:
 *         description: User not found or inactive
 *       500:
 *         description: Internal server error
 */
router.get('/:userId/counts', requireAuth(), FollowController.getFollowCounts);

/**
 * @swagger
 * /api/follow/mutual/{userId1}/{userId2}:
 *   get:
 *     summary: Get mutual followers between two users
 *     description: |
 *       Retrieves users that both specified users are following.
 *       Useful for finding common connections and suggesting new people to follow.
 *       **Security:** Users can only check mutual followers for themselves or with another user.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId1
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: First user ID
 *       - in: path
 *         name: userId2
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Second user ID
 *     responses:
 *       200:
 *         description: Mutual followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Mutual followers retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/MutualFollowersResponse'
 *       400:
 *         description: Bad request - missing user IDs
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       403:
 *         description: Forbidden - can only check mutual followers for yourself or with another user
 *       404:
 *         description: One or both users not found or inactive
 *       500:
 *         description: Internal server error
 */
router.get(
  '/mutual/:userId1/:userId2',
  mutualFollowersLimiter,
  requireAuth(),
  FollowController.getMutualFollowers,
);

/**
 * @swagger
 * /api/follow/search:
 *   get:
 *     summary: Search users with advanced filtering
 *     description: |
 *       Searches for users by username or about text with advanced filtering options.
 *       Includes follow status for the authenticated user.
 *       **Search Criteria:**
 *       - Username (case-insensitive partial match)
 *       - About text (case-insensitive partial match)
 *       - Minimum 2 characters required
 *       **Filter Options:**
 *       - User type: INDIVIDUAL, BUSINESS, ADMIN
 *       - Follow status: followers, following, not_following
 *       **Results Include:**
 *       - User details (username, type, logo, about)
 *       - Follow status (isFollowing, followedAt)
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           minLength: 2
 *         required: true
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, BUSINESS, ADMIN]
 *         description: Filter by user type
 *       - in: query
 *         name: followStatus
 *         schema:
 *           type: string
 *           enum: [followers, following, not_following]
 *         description: Filter by follow relationship status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Users search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Users search completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserSearchResponse'
 *       400:
 *         description: Bad request - missing query or query too short
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/search', searchLimiter, requireAuth(), FollowController.searchUsers);

/**
 * @swagger
 * /api/follow/my/followers:
 *   get:
 *     summary: Get current user's followers
 *     description: |
 *       Retrieves a paginated list of users who follow the currently authenticated user.
 *       Requires authentication.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Your followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Your followers retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowersResponse'
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/my/followers', dataFetchLimiter, requireAuth(), FollowController.getMyFollowers);

/**
 * @swagger
 * /api/follow/my/following:
 *   get:
 *     summary: Get current user's following list
 *     description: |
 *       Retrieves a paginated list of users that the currently authenticated user is following.
 *       Requires authentication.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Your following list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Your following list retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowingResponse'
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/my/following', dataFetchLimiter, requireAuth(), FollowController.getMyFollowing);

/**
 * @swagger
 * /api/follow/my/counts:
 *   get:
 *     summary: Get current user's follow counts
 *     description: |
 *       Retrieves the total number of followers and following for the currently authenticated user.
 *       Requires authentication.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Your follow counts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Your follow counts retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/FollowCounts'
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/my/counts', dataFetchLimiter, requireAuth(), FollowController.getMyFollowCounts);

export default router;
