import { Router } from 'express';

import BusinessVideoController from '../controllers/businessvideo.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { businessVideoLimiter } from '../middlewares/rateLimit.middleware';
import { upload } from '../middlewares/upload.middleware';
const router = Router();

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
 *     summary: Get all business videos of particular business ID
 *     description: Retrieve all business videos for a specific business with optional pagination and hashtag filtering.
 *     tags:
 *       - Business Videos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the business
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of videos per page
 *       - in: query
 *         name: hashtag
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
 *                         example: "video-uuid"
 *                       businessId:
 *                         type: string
 *                         example: "business-uuid"
 *                       title:
 *                         type: string
 *                         example: "Promotional Video"
 *                       caption:
 *                         type: string
 *                         example: "Summer Sale Launch"
 *                       hashtags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["#sale", "#summer"]
 *                       url:
 *                         type: string
 *                         example: "https://cdn.example.com/video.mp4"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-12T16:58:51.554Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */

router.get(
  '/:businessId',
  businessVideoLimiter,
  requireAuth(),
  BusinessVideoController.getAllBusinessVideosByBusinessId,
);
/**
 * @swagger
 * /api/business-videos/businessvidoeId/{id}:
 *   get:
 *     summary: Get a business video by ID
 *     description: Retrieve a single business video by its unique ID.
 *     tags: [Business Videos]
 *     security:
 *       - bearerAuth: []   # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique ID of the business video
 *     responses:
 *       200:
 *         description: Business video fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 businessId:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 caption:
 *                   type: string
 *                 hashtags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 vidoe_url:
 *                   type: string
 *                   format: uri
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, INACTIVE, DELETED]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid ID supplied
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
 *       404:
 *         description: Business video not found
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
 *                   example: "Business video not found"
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
 *                   example: "Failed to fetch business video"
 */

router.get(
  '/businessvidoeId/:id',
  businessVideoLimiter,
  requireAuth(),
  BusinessVideoController.getBusinessVideoById,
);

/**
 * @swagger
 * /api/business-videos/update/{id}:
 *   patch:
 *     summary: Update a business video by ID
 *     description: Update one or more fields of a business video. Users can update all fields or partial fields. Only the owner of the video can update it.
 *     tags: [Business Videos]
 *     security:
 *       - bearerAuth: []   # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the business video to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Video title
 *                 example: "Promotional Video"
 *               caption:
 *                 type: string
 *                 description: Video caption
 *                 example: "Check out our latest services"
 *               hashtags:
 *                 type: string
 *                 description: Comma-separated hashtags (e.g., "#promo,#business") or array of strings
 *                 example: "#promo,#business"
 *               status:
 *                 type: string
 *                 description: Status of the video
 *                 enum: [ACTIVE, INACTIVE, DELETED]
 *                 example: "ACTIVE"
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload
 *     responses:
 *       200:
 *         description: Business video updated successfully
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
 *                   example: Business video updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "video-uuid"
 *                     businessId:
 *                       type: string
 *                       format: uuid
 *                       example: "business-uuid"
 *                     title:
 *                       type: string
 *                       example: "Updated Video Title"
 *                     caption:
 *                       type: string
 *                       example: "Updated video caption"
 *                     hashtags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["#updated", "#business"]
 *                     video_url:
 *                       type: string
 *                       format: uri
 *                       example: "https://cdn.example.com/updated-video.mp4"
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, INACTIVE, DELETED]
 *                       example: "ACTIVE"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-12T16:58:51.554Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-12T17:30:15.123Z"
 *       400:
 *         description: Invalid request or invalid status value
 *       403:
 *         description: User not authorized to update this video
 *       404:
 *         description: Business video not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/update/:id',
  businessVideoLimiter,
  requireAuth('BUSINESS'),
  upload.single('video'),
  BusinessVideoController.updateBusinessVideo,
);
/**
 * @swagger
 * /api/business-videos/delete/{id}:
 *   delete:
 *     summary: Delete a business video by ID
 *     description: Permanently delete a business video. Only the video owner (business) or an admin can delete it.
 *     tags: [Business Videos]
 *     security:
 *       - bearerAuth: []   # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the business video to delete
 *     responses:
 *       200:
 *         description: Business video deleted successfully
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
 *                   example: Business video deleted successfully
 *       400:
 *         description: Invalid ID supplied
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
 *                   example: Invalid ID supplied
 *       403:
 *         description: Forbidden - User does not own the video and is not an admin
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
 *                   example: You can only delete your own business videos
 *       404:
 *         description: Business video not found
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
 *                   example: Business video not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */
router.delete(
  '/delete/:id',
  businessVideoLimiter,
  requireAuth('BUSINESS', 'ADMIN'),
  BusinessVideoController.deleteBusinessVideo,
);

export default router;
