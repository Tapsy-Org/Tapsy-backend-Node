import { Router } from 'express';
import multer from 'multer';

import BusinessVideoController from '../controllers/businessvideo.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { businessVideoLimiter } from '../middlewares/rateLimit.middleware';
const router = Router();
const upload = multer();
/**
 * @swagger
 * tags:
 *   - name: Business Videos
 *     description: Business video management endpoints
 */
/**
 * @swagger
 * /api/business-videos/:
 *   post:
 *     summary: Create a new business video
 *     description: |
 *       Creates a new business video with title, caption, hashtags, and video file upload.
 *       The video file will be uploaded to AWS S3 and the URL will be stored in the database.
 *
 *       **File Requirements:**
 *       - Maximum size: 100MB
 *       - Supported formats: All video/* MIME types
 *       - File will be stored in S3 under `gallery/{userId}/video-{timestamp}.{extension}`
 *
 *       **Authentication:**
 *       - Requires valid JWT token for business users
 *       - User must be authenticated and have business user type
 *     tags: [Business Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - hashtags
 *               - video
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the business video
 *                 example: "Our Amazing Product Demo"
 *               caption:
 *                 type: string
 *                 description: Optional caption for the video
 *                 example: "Check out our latest product in action!"
 *               hashtags:
 *                 type: string
 *                 description: Comma-separated hashtags or array of hashtags
 *                 example: "product,demo,amazing,business"
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload
 *     responses:
 *       201:
 *         description: Business video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Business video uploaded successfully"
 *       400:
 *         description: Bad request - missing required fields or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Title and hashtags are required"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Business user not authenticated"
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
 *                 message:
 *                   type: string
 *                   example: "Failed to create business video"
 */
router.post(
  '/',
  businessVideoLimiter,
  requireAuth('BUSINESS'),
  upload.single('video'),
  BusinessVideoController.createBusinessVideo,
);

/**
 * @swagger
 * tags:
 *   - name: Business Videos
 *     description: Business video management endpoints
 *
 * /api/business-videos/{businessId}:
 *   get:
 *     summary: Get all business videos by business ID
 *     description: Retrieve all business videos for a specific business with optional pagination and hashtag filtering.
 *     tags: [Business Videos]
 *     security:
 *       - bearerAuth: []   # <--- Require JWT authentication
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of videos per page
 *       - in: query
 *         name: hashtag
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional hashtag to filter videos
 *     responses:
 *       200:
 *         description: List of business videos with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       businessId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       caption:
 *                         type: string
 *                       hashtags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       url:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid request parameters"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch business videos"
 */

router.get(
  'get-all-business-videos/:businessId',
  businessVideoLimiter,
  requireAuth(),
  BusinessVideoController.getAllBusinessVideosByBusinessId,
);

router.get(
  'get-business-video-by-id/:id',
  businessVideoLimiter,
  requireAuth(),
  BusinessVideoController.getBusinessVideoById,
);

export default router;
