import express from 'express';

import FollowController from '../controllers/follow.controller';
import { requireAuth } from '../middlewares/auth.middleware';

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
 *         followType:
 *           type: string
 *           description: Type of follow relationship
 *           example: "FOLLOW"
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
 *         followType:
 *           type: string
 *           nullable: true
 *           description: Type of follow relationship if following
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
 *     FollowRequest:
 *       type: object
 *       properties:
 *         followType:
 *           type: string
 *           default: "FOLLOW"
 *           description: Type of follow relationship
 *           example: "FOLLOW"
 */

/**
 * @swagger
 * /api/follow/{followingUserId}:
 *   post:
 *     summary: Follow a user
 *     description: |
 *       Creates a follow relationship between the authenticated user and another user.
 *       Users cannot follow themselves.
 *       **Follow Types:**
 *       - `FOLLOW`: Standard follow relationship
 *       - Custom types can be defined for different follow categories
 *       **Validation:**
 *       - Both users must exist and be active
 *       - Cannot follow yourself
 *       - Cannot follow the same user twice
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
 *         description: ID of the user to follow
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FollowRequest'
 *           examples:
 *             standard_follow:
 *               summary: Standard follow
 *               value:
 *                 followType: "FOLLOW"
 *             custom_follow:
 *               summary: Custom follow type
 *               value:
 *                 followType: "BUSINESS_PARTNER"
 *     responses:
 *       201:
 *         description: Successfully followed user
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
 *                   $ref: '#/components/schemas/Follow'
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
router.post('/:followingUserId', requireAuth(), FollowController.followUser);

/**
 * @swagger
 * /api/follow/{followingUserId}:
 *   delete:
 *     summary: Unfollow a user
 *     description: |
 *       Removes the follow relationship between the authenticated user and another user.
 *       Users can only unfollow their own follows.
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
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
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
 *                   example: Successfully unfollowed user
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Successfully unfollowed user
 *       400:
 *         description: Bad request - missing user ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       403:
 *         description: Forbidden - can only unfollow your own follows
 *       404:
 *         description: Follow relationship not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:followingUserId', requireAuth(), FollowController.unfollowUser);

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
router.get('/mutual/:userId1/:userId2', requireAuth(), FollowController.getMutualFollowers);

/**
 * @swagger
 * /api/follow/search:
 *   get:
 *     summary: Search users with follow status
 *     description: |
 *       Searches for users by username or about text and includes follow status for the authenticated user.
 *       Useful for finding new people to follow.
 *       **Search Criteria:**
 *       - Username (case-insensitive partial match)
 *       - About text (case-insensitive partial match)
 *       - Minimum 2 characters required
 *       **Results Include:**
 *       - User details (username, type, logo, about)
 *       - Follow status (isFollowing, followType, followedAt)
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
router.get('/search', requireAuth(), FollowController.searchUsers);

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
router.get('/my/followers', requireAuth(), FollowController.getMyFollowers);

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
router.get('/my/following', requireAuth(), FollowController.getMyFollowing);

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
router.get('/my/counts', requireAuth(), FollowController.getMyFollowCounts);

export default router;
