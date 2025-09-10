import express from 'express';
import multer from 'multer';

import ReviewController from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { dataFetchLimiter } from '../middlewares/rateLimit.middleware';

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
 *     ReviewStatus:
 *       type: string
 *       enum: [ACTIVE, PENDING, INACTIVE, DELETED]
 *       description: Status of the review
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
 *         feedback:
 *           $ref: '#/components/schemas/ReviewFeedback'
 *           nullable: true
 *           description: Feedback for bad reviews (only present for ONE/TWO ratings)
 *         _count:
 *           type: object
 *           properties:
 *             likes:
 *               type: integer
 *               description: Total number of likes for the review
 *               example: 42
 *             comments:
 *               type: integer
 *               description: Total number of comments for the review (including replies)
 *               example: 15
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
 *         parent_comment_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of parent comment if this is a reply
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
 *         feedbackText:
 *           type: string
 *           description: Feedback text for bad reviews (required when rating is ONE or TWO)
 *     CreateReviewResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique review identifier
 *         video_url:
 *           type: string
 *           nullable: true
 *           description: S3 URL of the uploaded video (null if no video was uploaded)
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
 *     ReviewFeedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique feedback identifier
 *         reviewId:
 *           type: string
 *           format: uuid
 *           description: ID of the review this feedback is for
 *         feedback:
 *           type: string
 *           description: Feedback text for bad reviews
 *         is_resolved:
 *           type: boolean
 *           description: Whether the feedback has been resolved
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the feedback was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the feedback was last updated
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
 *       **Bad Review Feedback:**
 *       - Reviews with rating ONE or TWO are automatically set to PENDING status
 *       - If feedbackText is provided for bad reviews, it will be stored as ReviewFeedback
 *       - This allows businesses to understand and address negative feedback
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
 *             bad_review_with_feedback:
 *               summary: Create bad review with feedback
 *               value:
 *                 rating: "ONE"
 *                 caption: "Terrible experience, very disappointed"
 *                 hashtags: '["#bad", "#terrible", "#disappointed"]'
 *                 title: "Worst Experience Ever"
 *                 businessId: "550e8400-e29b-41d4-a716-446655440000"
 *                 feedbackText: "The service was extremely slow, staff was rude, and the food was cold. I waited 45 minutes for a simple order and when it arrived, it was completely wrong. The manager was unhelpful and dismissive. This was supposed to be a special occasion dinner but it turned into a nightmare."
 *             bad_review_without_feedback:
 *               summary: Create bad review without feedback
 *               value:
 *                 rating: "TWO"
 *                 caption: "Not good, would not recommend"
 *                 hashtags: '["#notgood", "#disappointed"]'
 *                 title: "Below Expectations"
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
 *                   $ref: '#/components/schemas/CreateReviewResponse'
 *             examples:
 *               with_video:
 *                 summary: Review created with video upload
 *                 value:
 *                   status: "success"
 *                   message: "Review created successfully"
 *                   data:
 *                     id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                     video_url: "https://tapsy-storage.s3.us-west-1.amazonaws.com/review/user-id/review-timestamp.mp4"
 *               text_only:
 *                 summary: Text-only review created
 *                 value:
 *                   status: "success"
 *                   message: "Review created successfully"
 *                   data:
 *                     id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                     video_url: null
 *               bad_review_with_feedback:
 *                 summary: "Bad review with feedback created (status: PENDING)"
 *                 value:
 *                   status: "success"
 *                   message: "Review created successfully"
 *                   data:
 *                     id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                     video_url: null
 *               bad_review_without_feedback:
 *                 summary: "Bad review without feedback created (status: PENDING)"
 *                 value:
 *                   status: "success"
 *                   message: "Review created successfully"
 *                   data:
 *                     id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                     video_url: null
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
 *               missing_feedback_for_bad_review:
 *                 summary: "Missing feedback for bad review (optional but recommended)"
 *                 value:
 *                   status: "success"
 *                   statusCode: 201
 *                   message: "Review created successfully (feedback recommended for bad reviews)"
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
 * /api/reviews/feed:
 *   post:
 *     summary: Get personalized review feed
 *     description: |
 *       Get a personalized TikTok-style feed of reviews based on user preferences, location, following, and engagement
 *       with cursor-based pagination and seen/unseen logic.
 *
 *       ## Features:
 *       - **Personalized Algorithm**: Uses social signals, category preferences, location proximity, engagement, and freshness
 *       - **Cursor-based Pagination**: Efficient pagination using base64-encoded cursors
 *       - **Seen/Unseen Logic**: Excludes previously viewed reviews using Redis
 *       - **Location-based Recommendations**: Prioritizes nearby businesses when coordinates provided
 *       - **Real-time Scoring**: Dynamic scoring based on user behavior and preferences
 *
 *       ## Algorithm Scoring (Weighted):
 *       - **Social Signals (30%)**: Reviews from followed users get higher priority
 *       - **Category Relevance (25%)**: Matches user's interested categories
 *       - **Location Proximity (20%)**: Closer businesses get higher scores
 *       - **Engagement Score (15%)**: Based on views, likes, and comments
 *       - **Freshness Score (10%)**: Newer content gets higher priority
 *
 *       ## Security Note:
 *       This endpoint uses POST instead of GET to protect sensitive location data
 *       (latitude/longitude) from being exposed in URL query parameters.
 *
 *       ## Usage Patterns:
 *       - **First Load**: Send request with `limit` only
 *       - **With Location**: Include `latitude` and `longitude` for proximity-based recommendations
 *       - **Pagination**: Use `cursor` from previous response to get next page
 *       - **Combined**: Use both location data and cursor for location-aware pagination
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cursor:
 *                 type: string
 *                 description: Cursor for pagination (base64 encoded). Use this to get the next set of reviews
 *                 example: "eyJzY29yZSI6ODUuNSwiY3JlYXRlZEF0IjoiMjAyNC0wMS0xNVQxMDozMDowMFoifQ=="
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Number of reviews per page
 *                 example: 10
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: User's current latitude for location-based recommendations
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's current longitude for location-based recommendations
 *                 example: -74.0060
 *           examples:
 *             basic_request:
 *               summary: Basic feed request (no location data)
 *               description: Get the first page of personalized reviews without location-based recommendations
 *               value:
 *                 limit: 10
 *             with_location:
 *               summary: Request with location data for proximity-based recommendations
 *               description: Get personalized reviews with location-based scoring for nearby businesses
 *               value:
 *                 limit: 15
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *             with_cursor:
 *               summary: Request with pagination cursor (no location)
 *               description: Get next page of reviews using cursor from previous response
 *               value:
 *                 cursor: "eyJzY29yZSI6ODUuNSwiY3JlYXRlZEF0IjoiMjAyNC0wMS0xNVQxMDozMDowMFoifQ=="
 *                 limit: 20
 *             with_cursor_and_location:
 *               summary: Request with both cursor and location data
 *               description: Get next page of reviews with location-based recommendations using pagination cursor
 *               value:
 *                 cursor: "eyJzY29yZSI6ODUuNSwiY3JlYXRlZEF0IjoiMjAyNC0wMS0xNVQxMDozMDowMFoifQ=="
 *                 limit: 25
 *                 latitude: 37.7749
 *                 longitude: -122.4194
 *             max_limit:
 *               summary: Maximum limit request
 *               description: Get maximum number of reviews per page (50)
 *               value:
 *                 limit: 50
 *                 latitude: 34.0522
 *                 longitude: -118.2437
 *             minimal_request:
 *               summary: Minimal request (default values)
 *               description: Get default number of reviews with default settings
 *               value: {}
 *     responses:
 *       200:
 *         description: Review feed fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Review feed fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           rating:
 *                             type: string
 *                             enum: [ONE, TWO, THREE, FOUR, FIVE]
 *                           badges:
 *                             type: string
 *                             nullable: true
 *                           caption:
 *                             type: string
 *                             nullable: true
 *                           hashtags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           title:
 *                             type: string
 *                             nullable: true
 *                           video_url:
 *                             type: string
 *                             nullable: true
 *                           businessId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           views:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [ACTIVE, INACTIVE, PENDING, DELETED]
 *                           finalScore:
 *                             type: number
 *                             description: Algorithmic score used for ranking (included for debugging)
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 nullable: true
 *                               user_type:
 *                                 type: string
 *                                 enum: [INDIVIDUAL, BUSINESS, ADMIN]
 *                               logo_url:
 *                                 type: string
 *                                 nullable: true
 *                           business:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 nullable: true
 *                               user_type:
 *                                 type: string
 *                                 enum: [BUSINESS]
 *                               logo_url:
 *                                 type: string
 *                                 nullable: true
 *                           _count:
 *                             type: object
 *                             properties:
 *                               likes:
 *                                 type: integer
 *                               comments:
 *                                 type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         nextCursor:
 *                           type: string
 *                           nullable: true
 *                           description: Cursor for the next page (base64 encoded)
 *                         hasNextPage:
 *                           type: boolean
 *                           description: Whether there are more reviews available
 *                     algorithm_info:
 *                       type: object
 *                       properties:
 *                         user_following_count:
 *                           type: integer
 *                           description: Number of users being followed
 *                         user_categories_count:
 *                           type: integer
 *                           description: Number of categories user is interested in
 *                         location_based:
 *                           type: boolean
 *                           description: Whether location-based scoring was applied
 *                         seen_reviews_excluded:
 *                           type: integer
 *                           description: Number of previously seen reviews excluded from this feed
 *                         algorithm_version:
 *                           type: string
 *                           description: Version of the algorithm used for ranking
 *                           example: "Tapsy-Algorithm-V1.0"
 *             examples:
 *               success_with_reviews:
 *                 summary: Successful response with reviews
 *                 description: Feed with multiple reviews including location-based recommendations
 *                 value:
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Review feed fetched successfully"
 *                   data:
 *                     reviews:
 *                       - id: "123e4567-e89b-12d3-a456-426614174000"
 *                         userId: "456e7890-e89b-12d3-a456-426614174001"
 *                         rating: "FIVE"
 *                         badges: "Verified Customer"
 *                         caption: "Amazing coffee and great atmosphere! ☕️"
 *                         hashtags: ["coffee", "downtown", "cozy"]
 *                         title: "Best Coffee in Downtown"
 *                         video_url: "https://s3.amazonaws.com/bucket/video1.mp4"
 *                         businessId: "789e0123-e89b-12d3-a456-426614174002"
 *                         views: 1250
 *                         createdAt: "2024-01-15T10:30:00Z"
 *                         status: "ACTIVE"
 *                         finalScore: 85.5
 *                         user:
 *                           id: "456e7890-e89b-12d3-a456-426614174001"
 *                           username: "coffee_lover_23"
 *                           name: "Sarah Johnson"
 *                           user_type: "INDIVIDUAL"
 *                           logo_url: "https://s3.amazonaws.com/bucket/user1.jpg"
 *                         business:
 *                           id: "789e0123-e89b-12d3-a456-426614174002"
 *                           username: "downtown_coffee"
 *                           name: "Downtown Coffee Co."
 *                           user_type: "BUSINESS"
 *                           logo_url: "https://s3.amazonaws.com/bucket/business1.jpg"
 *                         _count:
 *                           likes: 45
 *                           comments: 12
 *                       - id: "234e5678-e89b-12d3-a456-426614174003"
 *                         userId: "567e8901-e89b-12d3-a456-426614174004"
 *                         rating: "FOUR"
 *                         badges: null
 *                         caption: "Good food, friendly staff"
 *                         hashtags: ["restaurant", "lunch", "family"]
 *                         title: "Great Lunch Spot"
 *                         video_url: "https://s3.amazonaws.com/bucket/video2.mp4"
 *                         businessId: "890e1234-e89b-12d3-a456-426614174005"
 *                         views: 890
 *                         createdAt: "2024-01-14T14:20:00Z"
 *                         status: "ACTIVE"
 *                         finalScore: 72.3
 *                         user:
 *                           id: "567e8901-e89b-12d3-a456-426614174004"
 *                           username: "foodie_mike"
 *                           name: "Mike Chen"
 *                           user_type: "INDIVIDUAL"
 *                           logo_url: "https://s3.amazonaws.com/bucket/user2.jpg"
 *                         business:
 *                           id: "890e1234-e89b-12d3-a456-426614174005"
 *                           username: "family_restaurant"
 *                           name: "Family Restaurant"
 *                           user_type: "BUSINESS"
 *                           logo_url: "https://s3.amazonaws.com/bucket/business2.jpg"
 *                         _count:
 *                           likes: 23
 *                           comments: 8
 *                     pagination:
 *                       nextCursor: "eyJzY29yZSI6NzIuMywiY3JlYXRlZEF0IjoiMjAyNC0wMS0xNFQxNDoyMDowMFoifQ=="
 *                       hasNextPage: true
 *                     algorithm_info:
 *                       user_following_count: 15
 *                       user_categories_count: 3
 *                       location_based: true
 *                       seen_reviews_excluded: 5
 *                       algorithm_version: "Tapsy-Algorithm-V1.0"
 *               success_empty_feed:
 *                 summary: Empty feed response
 *                 description: Response when no more reviews are available
 *                 value:
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Review feed fetched successfully"
 *                   data:
 *                     reviews: []
 *                     pagination:
 *                       nextCursor: null
 *                       hasNextPage: false
 *                     algorithm_info:
 *                       user_following_count: 15
 *                       user_categories_count: 3
 *                       location_based: true
 *                       seen_reviews_excluded: 5
 *                       algorithm_version: "Tapsy-Algorithm-V1.0"
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Limit must be between 1 and 50"
 *             examples:
 *               invalid_limit:
 *                 summary: Invalid limit parameter
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Limit must be between 1 and 50"
 *               invalid_coordinates:
 *                 summary: Invalid latitude/longitude
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Latitude must be between -90 and 90"
 *               missing_coordinates:
 *                 summary: Incomplete location data
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Both latitude and longitude must be provided together"
 *               invalid_cursor:
 *                 summary: Invalid cursor format
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid cursor format"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 statusCode:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 *             examples:
 *               no_token:
 *                 summary: No authentication token provided
 *                 value:
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "User not authenticated"
 *               invalid_token:
 *                 summary: Invalid or expired token
 *                 value:
 *                   status: "fail"
 *                   statusCode: 401
 *                   message: "Invalid or expired authentication token"
 *       404:
 *         description: User not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *             examples:
 *               user_not_found:
 *                 summary: User not found
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "User not found"
 *               user_inactive:
 *                 summary: User account inactive
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "User account is inactive"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 statusCode:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch review feed"
 *             examples:
 *               database_error:
 *                 summary: Database connection error
 *                 value:
 *                   status: "fail"
 *                   statusCode: 500
 *                   message: "Failed to fetch review feed"
 *               redis_error:
 *                 summary: Redis service error
 *                 value:
 *                   status: "fail"
 *                   statusCode: 500
 *                   message: "Failed to fetch review feed"
 */
router.post('/feed', requireAuth(), ReviewController.getReviewFeed);

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with optional filtering and pagination
 *     description: |
 *       Retrieves reviews with optional filtering by user, business, rating, or status.
 *       Supports pagination for large result sets.
 *       **Status Filtering:**
 *       - Default: Shows only `ACTIVE` and `PENDING` reviews
 *       - `DELETED` reviews are automatically excluded from all queries
 *       - Use `status` parameter to filter by specific status values
 *       **Available Status Values:**
 *       - `ACTIVE`: Reviews with ratings 3-5, immediately visible
 *       - `PENDING`: Reviews with ratings 1-2, awaiting approval
 *       - `INACTIVE`: Available for future use
 *       - `DELETED`: Soft-deleted reviews (hidden from queries)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/ReviewStatus'
 *         description: Filter reviews by status (ACTIVE, PENDING, INACTIVE)
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, views, rating]
 *           default: createdAt
 *         description: Field to sort by (createdAt, views, rating)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (asc for ascending, desc for descending)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter reviews by caption, title, or hashtags
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
router.get('/', dataFetchLimiter, requireAuth(), ReviewController.getReviews);

/**
 * @swagger
 * /api/reviews/seen:
 *   get:
 *     summary: Get seen reviews
 *     description: Get all review IDs that have been marked as seen by the authenticated user.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seen reviews fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Seen reviews fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     seenReviewIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *                     count:
 *                       type: number
 *                       example: 2
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.get('/seen', requireAuth(), ReviewController.getSeenReviews);

/**
 * @swagger
 * /api/reviews/seen:
 *   delete:
 *     summary: Clear all seen reviews
 *     description: Clear all seen reviews for the authenticated user. This will make all previously seen reviews appear in the feed again.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All seen reviews cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "All seen reviews cleared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174001"
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       500:
 *         description: Internal server error
 */
router.delete('/seen', requireAuth(), ReviewController.clearSeenReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   get:
 *     summary: Get a specific review by ID
 *     description: |
 *       Retrieves a specific review by its ID and automatically increments the view count.
 *       Returns complete review data including user, business, likes, and comments.
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
router.get('/:reviewId', dataFetchLimiter, requireAuth(), ReviewController.getReviewById);

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
 * /api/reviews/{reviewId}/status:
 *   patch:
 *     summary: Update review status (Admin only)
 *     description: |
 *       Updates the status of a review. This endpoint is restricted to admin users only.
 *       Useful for approving pending reviews, deactivating problematic content, or managing review workflow.
 *       **Common Use Cases:**
 *       - Approve `PENDING` reviews (change status to `ACTIVE`)
 *       - Deactivate problematic reviews (change status to `INACTIVE`)
 *       - Reactivate previously deactivated reviews (change status to `ACTIVE`)
 *       **Status Transitions:**
 *       - `PENDING` → `ACTIVE`: Review approved and visible to users
 *       - `ACTIVE` → `INACTIVE`: Review temporarily hidden
 *       - `INACTIVE` → `ACTIVE`: Review reactivated
 *       - `DELETED` status cannot be changed via this endpoint
 *       **Note:** Only admin users with valid access tokens can use this endpoint.
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
 *         description: The review ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 $ref: '#/components/schemas/ReviewStatus'
 *                 description: New status for the review
 *           examples:
 *             approve_review:
 *               summary: Approve a pending review
 *               value:
 *                 status: "ACTIVE"
 *             deactivate_review:
 *               summary: Deactivate an active review
 *               value:
 *                 status: "INACTIVE"
 *             reactivate_review:
 *               summary: Reactivate an inactive review
 *               value:
 *                 status: "ACTIVE"
 *     responses:
 *       200:
 *         description: Review status updated successfully
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
 *                   example: Review status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *             examples:
 *               status_updated:
 *                 summary: Review status successfully updated
 *                 value:
 *                   status: "success"
 *                   message: "Review status updated successfully"
 *                   data:
 *                     id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                     rating: "TWO"
 *                     status: "ACTIVE"
 *                     caption: "Poor service experience"
 *                     user:
 *                       id: "user-123"
 *                       username: "john_doe"
 *                       user_type: "INDIVIDUAL"
 *       400:
 *         description: Bad request - invalid status value or missing review ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_status:
 *                 summary: Invalid status value
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid status value"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - user is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_admin:
 *                 summary: User is not an admin
 *                 value:
 *                   status: "fail"
 *                   statusCode: 403
 *                   message: "Admin user not found or unauthorized"
 *                   details: null
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:reviewId/status', requireAuth(), ReviewController.updateReviewStatus);

/**
 * @swagger
 * /api/reviews/my/business-reviews:
 *   get:
 *     summary: Get my business reviews
 *     description: |
 *       Retrieves reviews for the authenticated business user with pagination support.
 *       Default limit is 5 reviews per page. Returns comprehensive review data
 *       including user information, likes, and comments.
 *       **Authentication:**
 *       - Requires BUSINESS user type
 *       - Uses authenticated user's ID as business ID
 *       **Pagination:**
 *       - Default: 5 reviews per page
 *       - Configurable page and limit parameters
 *       - Returns pagination metadata
 *       **Status Filtering:**
 *       - Default: Shows only non-deleted reviews
 *       - Optional status filter for specific review states
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
 *           default: 5
 *         description: Number of reviews per page (default 5)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PENDING, INACTIVE]
 *         description: Filter reviews by status (optional)
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
 *                   example: Your business reviews fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReviewsResponse'
 *             examples:
 *               success_response:
 *                 summary: Business reviews with pagination
 *                 value:
 *                   status: "success"
 *                   message: "Your business reviews fetched successfully"
 *                   data:
 *                     reviews:
 *                       - id: "60cc2365-74ae-4b50-b7f7-a356c4a417ea"
 *                         rating: "FIVE"
 *                         caption: "Amazing service and great food!"
 *                         hashtags: ["#great", "#food", "#service"]
 *                         title: "Best Restaurant Experience"
 *                         video_url: "https://s3.amazonaws.com/bucket/video.mp4"
 *                         views: 150
 *                         status: "ACTIVE"
 *                         createdAt: "2024-01-15T10:30:00Z"
 *                         user:
 *                           id: "user-123"
 *                           username: "john_doe"
 *                           user_type: "INDIVIDUAL"
 *                           logo_url: "https://example.com/avatar.jpg"
 *                         business:
 *                           id: "business-456"
 *                           username: "restaurant_name"
 *                           user_type: "BUSINESS"
 *                           logo_url: "https://example.com/logo.jpg"
 *                         likes:
 *                           - id: "like-1"
 *                             userId: "user-789"
 *                         comments:
 *                           - id: "comment-1"
 *                             comment: "I agree, great place!"
 *                             createdAt: "2024-01-15T11:00:00Z"
 *                             user:
 *                               id: "user-789"
 *                               username: "jane_doe"
 *                               logo_url: "https://example.com/avatar2.jpg"
 *                     pagination:
 *                       page: 1
 *                       limit: 5
 *                       total: 25
 *                       totalPages: 5
 *       400:
 *         description: Bad request - invalid business ID or query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_business_id:
 *                 summary: Invalid business ID format
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid business ID format. Must be a valid UUID"
 *                   details: null
 *               invalid_status:
 *                 summary: Invalid status value
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid status value. Must be ACTIVE, PENDING, or INACTIVE"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Business not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               business_not_found:
 *                 summary: Business not found
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "Business not found or inactive"
 *                   details: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/my/business-reviews',
  dataFetchLimiter,
  requireAuth('BUSINESS'),
  ReviewController.getBusinessReviews,
);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Soft delete a review
 *     description: |
 *       Soft deletes a review by setting its status to `DELETED`.
 *       Users can only delete their own reviews.
 *       **Soft Deletion Behavior:**
 *       - Review status is set to `DELETED` instead of permanent removal
 *       - Associated likes and comments are preserved
 *       - Deleted reviews are automatically excluded from all queries
 *       - Data integrity is maintained for analytics and audit purposes
 *       **Note:** This is a soft delete operation. The review data remains in the database
 *       but is hidden from user-facing queries.
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
 *         description: Review soft deleted successfully
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

/**
 * @swagger
 * /api/reviews/{reviewId}/seen:
 *   post:
 *     summary: Mark a review as seen and increment view count
 *     description: |
 *       Mark a specific review as seen by the authenticated user and increment its view count.
 *       This endpoint performs two actions in a single call:
 *       1. Marks the review as seen in Redis (prevents it from appearing in future feed requests)
 *       2. Increments the view count in the database
 *       **Use Cases:**
 *       - Track user engagement when viewing reviews
 *       - Prevent duplicate content in feeds
 *       - Maintain accurate view statistics
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the review to mark as seen and increment view count
 *     responses:
 *       200:
 *         description: Review marked as seen and view count incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Review marked as seen and view count incremented successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviewId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                       description: The ID of the review
 *                     viewCount:
 *                       type: integer
 *                       example: 150
 *                       description: Updated view count for the review
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174001"
 *                       description: The ID of the user who viewed the review
 *                     message:
 *                       type: string
 *                       example: "Review marked as seen and view count incremented successfully"
 *       400:
 *         description: Bad request - invalid review ID format
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */
router.post('/:reviewId/seen', requireAuth(), ReviewController.markReviewAsSeen);

/**
 * @swagger
 * /api/reviews/seen:
 *   post:
 *     summary: Mark multiple reviews as seen
 *     description: |
 *       Mark multiple reviews as seen by the authenticated user in a single request.
 *       This prevents the specified reviews from appearing in future feed requests.
 *       **Use Cases:**
 *       - Mark multiple reviews as seen after viewing them
 *       - Batch operation for better performance
 *       - Clear seen status for specific reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviewIds
 *             properties:
 *               reviewIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 100
 *                 description: Array of review IDs to mark as seen
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *           examples:
 *             mark_multiple_seen:
 *               summary: Mark multiple reviews as seen
 *               value:
 *                 reviewIds: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *             mark_single_seen:
 *               summary: Mark single review as seen
 *               value:
 *                 reviewIds: ["123e4567-e89b-12d3-a456-426614174000"]
 *     responses:
 *       200:
 *         description: Reviews marked as seen successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Reviews marked as seen successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviewIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       description: Array of review IDs that were marked as seen
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the user who marked the reviews as seen
 *                     count:
 *                       type: number
 *                       description: Number of reviews marked as seen
 *                       example: 2
 *             examples:
 *               success_response:
 *                 summary: Successfully marked reviews as seen
 *                 value:
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Reviews marked as seen successfully"
 *                   data:
 *                     reviewIds: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *                     userId: "123e4567-e89b-12d3-a456-426614174002"
 *                     count: 2
 *       400:
 *         description: Bad request - invalid review IDs or too many reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_review_ids:
 *                 summary: Invalid review ID format
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Invalid review ID format(s): invalid-id. Must be valid UUIDs"
 *                   details: null
 *               too_many_reviews:
 *                 summary: Too many reviews in single request
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Cannot mark more than 100 reviews as seen at once"
 *                   details: null
 *               no_valid_ids:
 *                 summary: No valid review IDs provided
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "No valid review IDs provided"
 *                   details: null
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/seen', requireAuth(), ReviewController.markReviewsAsSeen);

export default router;
