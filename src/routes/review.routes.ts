import express from 'express';
import multer from 'multer';

import ReviewController from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Video review management with S3 upload support
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
 *     ReviewRating:
 *       type: string
 *       enum: [ONE, TWO, THREE, FOUR, FIVE]
 *       description: Rating value for the review
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique review identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who created the review
 *         rating:
 *           $ref: '#/components/schemas/ReviewRating'
 *         badges:
 *           type: string
 *           nullable: true
 *           description: String representing badges earned
 *         caption:
 *           type: string
 *           nullable: true
 *           description: Review caption/description
 *         hashtags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of hashtags
 *         title:
 *           type: string
 *           nullable: true
 *           description: Review title
 *         video_url:
 *           type: string
 *           nullable: true
 *           description: S3 URL of the uploaded video
 *         businessId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the business being reviewed
 *         views:
 *           type: integer
 *           description: Number of views for the review
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation timestamp
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         business:
 *           $ref: '#/components/schemas/UserSummary'
 *           nullable: true
 *         likes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Like'
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
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
 *     Like:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         comment:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *     ReviewFilters:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Filter by user ID
 *         businessId:
 *           type: string
 *           format: uuid
 *           description: Filter by business ID
 *         rating:
 *           $ref: '#/components/schemas/ReviewRating'
 *           description: Filter by rating
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Page number for pagination
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: Number of items per page
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
 *     ReviewsResponse:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           $ref: '#/components/schemas/ReviewRating'
 *         badges:
 *           type: string
 *           description: String representing badges earned
 *         caption:
 *           type: string
 *           description: Review caption/description
 *         hashtags:
 *           oneOf:
 *             - type: array
 *               items:
 *                 type: string
 *               description: Array of hashtags
 *             - type: string
 *               description: Comma-separated hashtags (e.g., "tag1,tag2,tag3") or JSON array string (e.g., '["tag1","tag2"]')
 *         title:
 *           type: string
 *           description: Review title
 *         video:
 *           type: string
 *           format: binary
 *           description: Video file (max 100MB, video/* formats only)
 *         businessId:
 *           type: string
 *           format: uuid
 *           description: ID of the business being reviewed
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         details:
 *           type: object
 *           nullable: true
 */

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review with optional video upload
 *     description: |
 *       Creates a new review with rating, caption, hashtags, and optional video upload to S3.
 *       The video file will be uploaded to AWS S3 and the URL will be stored in the database.
 *       **File Requirements:**
 *       - Maximum size: 100MB
 *       - Supported formats: All video/* MIME types
 *       - File will be stored in S3 under `videos/{userId}/review-{timestamp}.{extension}`
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *           examples:
 *             with_video:
 *               summary: Create review with video upload
 *               value:
 *                 rating: "FIVE"
 *                 caption: "Amazing service and great food! This place is incredible!"
 *                 hashtags: '["#great", "#food", "#service", "#amazing"]'
 *                 title: "Best Restaurant Experience Ever"
 *                 businessId: "550e8400-e29b-41d4-a716-446655440000"
 *                 video: "(binary)"
 *             text_only:
 *               summary: Create text-only review
 *               value:
 *                 rating: "FOUR"
 *                 caption: "Good service, nice atmosphere"
 *                 hashtags: '["#good", "#service", "#atmosphere"]'
 *                 title: "Decent Experience"
 *             comma_separated:
 *               summary: Create review with comma-separated hashtags
 *               value:
 *                 rating: "THREE"
 *                 caption: "Average experience"
 *                 hashtags: "#average,#service,#okay"
 *                 title: "Okay Experience"
 *             single_hashtag:
 *               summary: Create review with single hashtag
 *               value:
 *                 rating: "FIVE"
 *                 caption: "Excellent service!"
 *                 hashtags: "#excellent"
 *                 title: "Great Service"
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: Review created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_rating:
 *                 summary: Missing required rating
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Rating is required"
 *                   details: null
 *               invalid_rating:
 *                 summary: Invalid rating value
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid rating value. Must be ONE, TWO, THREE, FOUR, or FIVE"
 *                   details: null
 *               invalid_hashtags:
 *                 summary: Invalid hashtags format
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Hashtags must be an array"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error - S3 upload or database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requireAuth(), upload.single('video'), ReviewController.createReview);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with optional filtering and pagination
 *     description: |
 *       Retrieves reviews with optional filtering by user, business, or rating.
 *       Supports pagination for large result sets.
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter reviews by user ID
 *       - in: query
 *         name: businessId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter reviews by business ID
 *       - in: query
 *         name: rating
 *         schema:
 *           $ref: '#/components/schemas/ReviewRating'
 *         description: Filter reviews by rating
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                   example: Reviews fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReviewsResponse'
 *       400:
 *         description: Bad request - invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get('/', ReviewController.getReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   get:
 *     summary: Get a specific review by ID
 *     description: |
 *       Retrieves a specific review by its ID and automatically increments the view count.
 *       Returns complete review data including user, business, likes, and comments.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
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
 *                   example: Review fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - missing review ID
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.get('/:reviewId', ReviewController.getReviewById);

/**
 * @swagger
 * /api/reviews/my/reviews:
 *   get:
 *     summary: Get current user's reviews
 *     description: |
 *       Retrieves all reviews created by the currently authenticated user.
 *       Requires valid access token and supports pagination.
 *     tags: [Reviews]
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
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
 *                   example: Your reviews fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReviewsResponse'
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/my/reviews', requireAuth(), ReviewController.getMyReviews);

/**
 * @swagger
 * /api/reviews/business/{businessId}:
 *   get:
 *     summary: Get reviews for a specific business
 *     description: |
 *       Retrieves all reviews for a specific business with pagination support.
 *       Useful for displaying business ratings and reviews on business profiles.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The business ID to get reviews for
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Business reviews retrieved successfully
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
 *                   example: Business reviews fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReviewsResponse'
 *       400:
 *         description: Bad request - missing business ID
 *       500:
 *         description: Internal server error
 */
router.get('/business/:businessId', ReviewController.getBusinessReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     description: |
 *       Deletes a review. Users can only delete their own reviews.
 *       This will also remove all associated likes and comments.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The review ID to delete
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: Review deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Review deleted successfully
 *       400:
 *         description: Bad request - missing review ID
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       403:
 *         description: Forbidden - user can only delete their own reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_owner:
 *                 summary: User trying to delete someone else's review
 *                 value:
 *                   status: "fail"
 *                   statusCode: 403
 *                   message: "You can only delete your own reviews"
 *                   details: null
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:reviewId', requireAuth(), ReviewController.deleteReview);

export default router;
