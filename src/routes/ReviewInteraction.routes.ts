import express from 'express';

import ReviewInteractionController from '../controllers/ReviewInteraction.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  commentLimiter,
  dataFetchLimiter,
  likeToggleLimiter,
} from '../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Review-Interactions
 *     description: Like and comment management for reviews
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
 *     Like:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique like identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who liked the review
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: ID of the review that was liked
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the like was created
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique comment identifier
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: ID of the review being commented on
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who made the comment
 *         comment:
 *           type: string
 *           description: The comment text
 *         parent_comment_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of parent comment if this is a reply
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the comment was created
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *           description: Array of replies to this comment
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
 *     ToggleLikeResponse:
 *       type: object
 *       properties:
 *         liked:
 *           type: boolean
 *           description: Whether the review is now liked by the user
 *         message:
 *           type: string
 *           description: Success message
 *     UserLikeStatus:
 *       type: object
 *       properties:
 *         hasLiked:
 *           type: boolean
 *           description: Whether the user has liked the review
 *         likedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the user liked the review (if they have)
 *     CreateCommentRequest:
 *       type: object
 *       required:
 *         - comment
 *       properties:
 *         comment:
 *           type: string
 *           description: The comment text
 *         parentCommentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of parent comment if this is a reply
 *     UpdateCommentRequest:
 *       type: object
 *       required:
 *         - comment
 *       properties:
 *         comment:
 *           type: string
 *           description: The updated comment text
 */

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/like:
 *   post:
 *     summary: Toggle like/unlike for a review
 *     description: |
 *       Toggles the like status for a review. If the user hasn't liked the review,
 *       it will be liked. If they have already liked it, the like will be removed.
 *       Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled successfully
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
 *                   example: Review liked successfully
 *                 data:
 *                   $ref: '#/components/schemas/ToggleLikeResponse'
 *       400:
 *         description: Bad request - missing review ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reviews/:reviewId/like',
  likeToggleLimiter,
  requireAuth(),
  ReviewInteractionController.toggleLike,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/likes:
 *   get:
 *     summary: Get all likes for a review
 *     description: |
 *       Retrieves all users who have liked a specific review with their details.
 *       Supports pagination for large numbers of likes.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to get likes for
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
 *         description: Number of likes per page
 *     responses:
 *       200:
 *         description: Review likes retrieved successfully
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
 *                   example: Review likes fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     likes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Like'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         description: Bad request - missing review ID
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reviews/:reviewId/likes',
  dataFetchLimiter,
  requireAuth(),
  ReviewInteractionController.getReviewLikes,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/like/check:
 *   get:
 *     summary: Check if user has liked a review
 *     description: |
 *       Checks whether the currently authenticated user has liked a specific review.
 *       Returns the like status and timestamp if they have liked it.
 *       Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to check like status for
 *     responses:
 *       200:
 *         description: User like status checked successfully
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
 *                   example: User like status checked successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserLikeStatus'
 *       400:
 *         description: Bad request - missing review ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reviews/:reviewId/like/check',
  dataFetchLimiter,
  requireAuth(),
  ReviewInteractionController.checkUserLike,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/comments:
 *   post:
 *     summary: Add a comment to a review
 *     description: |
 *       Adds a new comment to a review. Can be a top-level comment or a reply to
 *       an existing comment. Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                   example: Comment added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - missing comment text or review ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reviews/:reviewId/comments',
  commentLimiter,
  requireAuth(),
  ReviewInteractionController.addComment,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/comments:
 *   get:
 *     summary: Get all comments for a review
 *     description: |
 *       Retrieves all comments for a specific review with user details and replies.
 *       Supports pagination and returns nested comment structure.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to get comments for
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
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Review comments retrieved successfully
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
 *                   example: Review comments fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         description: Bad request - missing review ID
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reviews/:reviewId/comments',
  dataFetchLimiter,
  requireAuth(),
  ReviewInteractionController.getReviewComments,
);

/**
 * @swagger
 * /api/review-interactions/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     description: |
 *       Updates an existing comment. Users can only update their own comments.
 *       Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The comment ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated successfully
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
 *                   example: Comment updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - missing comment text or comment ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Comment not found or user not authorized
 *       500:
 *         description: Internal server error
 */
router.put(
  '/comments/:commentId',
  commentLimiter,
  requireAuth(),
  ReviewInteractionController.updateComment,
);

/**
 * @swagger
 * /api/review-interactions/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: |
 *       Deletes a comment and all its replies. Users can only delete their own comments.
 *       Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The comment ID to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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
 *                   example: Comment deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Comment and replies deleted successfully
 *       400:
 *         description: Bad request - missing comment ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Comment not found or user not authorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/comments/:commentId',
  commentLimiter,
  requireAuth(),
  ReviewInteractionController.deleteComment,
);

/**
 * @swagger
 * /api/review-interactions/comments/{commentId}/replies:
 *   get:
 *     summary: Get comment replies
 *     description: |
 *       Retrieves all replies to a specific comment with user details.
 *       Supports pagination for large numbers of replies.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The comment ID to get replies for
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
 *         description: Number of replies per page
 *     responses:
 *       200:
 *         description: Comment replies retrieved successfully
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
 *                   example: Comment replies fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     replies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         description: Bad request - missing comment ID
 *       404:
 *         description: Parent comment not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/comments/:commentId/replies',
  dataFetchLimiter,
  requireAuth(),
  ReviewInteractionController.getCommentReplies,
);

/**
 * @swagger
 * /api/review-interactions/comments/{commentId}/reply:
 *   post:
 *     summary: Reply to a comment
 *     description: |
 *       Adds a reply to a specific comment. This is a dedicated endpoint for replying
 *       to comments, making it easier to distinguish between top-level comments and replies.
 *       Requires authentication.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The comment ID to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The reply text
 *     responses:
 *       201:
 *         description: Reply added successfully
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
 *                   example: Reply added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - missing comment text or comment ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Parent comment not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/comments/:commentId/reply',
  commentLimiter,
  requireAuth(),
  ReviewInteractionController.replyToComment,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/like-count:
 *   get:
 *     summary: Get like count for a review
 *     description: |
 *       Retrieves the total number of likes for a specific review.
 *       This is a lightweight endpoint that only returns the count.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to get like count for
 *     responses:
 *       200:
 *         description: Review like count retrieved successfully
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
 *                   example: Review like count fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeCount:
 *                       type: integer
 *                       description: Total number of likes for the review
 *                       example: 42
 *       400:
 *         description: Bad request - missing review ID
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reviews/:reviewId/like-count',
  requireAuth(),
  ReviewInteractionController.getReviewLikeCount,
);

/**
 * @swagger
 * /api/review-interactions/reviews/{reviewId}/comment-count:
 *   get:
 *     summary: Get comment count for a review
 *     description: |
 *       Retrieves the total number of comments for a specific review.
 *       This count includes both top-level comments and all replies.
 *       This is a lightweight endpoint that only returns the count.
 *     tags: [Review-Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to get comment count for
 *     responses:
 *       200:
 *         description: Review comment count retrieved successfully
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
 *                   example: Review comment count fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     commentCount:
 *                       type: integer
 *                       description: Total number of comments for the review (including replies)
 *                       example: 15
 *       400:
 *         description: Bad request - missing review ID
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/reviews/:reviewId/comment-count',
  dataFetchLimiter,
  requireAuth(),
  ReviewInteractionController.getReviewCommentCount,
);

export default router;
