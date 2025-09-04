import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { Limiter } from '../middlewares/rateLimit';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification management endpoints
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to receive the notification
 *                 example: "user123"
 *               senderId:
 *                 type: string
 *                 description: ID of the user sending the notification (optional)
 *                 example: "sender456"
 *               type:
 *                 type: string
 *                 enum: [LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, SYSTEM]
 *                 description: Type of notification
 *                 example: "LIKE"
 *               referenceId:
 *                 type: string
 *                 description: ID of the referenced object (post, comment, etc.)
 *                 example: "post789"
 *               image_url:
 *                 type: string
 *                 description: URL of the notification image
 *                 example: "https://example.com/image.jpg"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 description: Status of the notification
 *                 example: "ACTIVE"
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/', Limiter, requireAuth('ADMIN'), notificationController.createNotification);

/**
 * @swagger
 * /notifications/my:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *         example: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, SYSTEM]
 *         description: Filter notifications by type
 *         example: "LIKE"
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Your notifications retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 *                       description: Cursor for pagination
 *                       example: "notification123"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/my', Limiter, requireAuth(), notificationController.getMyNotifications);
/**
 * @swagger
 * /notifications/my/unread-count:
 *   get:
 *     summary: Get my unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Unread count retrieved successfully"
 *                 data:
 *                   type: integer
 *                   description: Number of unread notifications
 *                   example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

router.get(
  '/my/unread-count',
  Limiter,
  requireAuth(),
  notificationController.getUsersUnreadNotificationCount,
);

/**
 * @swagger
 * /notifications/my/{id}/mark-read:
 *   patch:
 *     summary: Mark my notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification
 *         example: "notification123"
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification marked as read successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
// User route - mark own notification as read
router.patch(
  '/my/:id/mark-read',
  Limiter,
  requireAuth(),
  notificationController.markMyNotificationAsRead,
);

/**
 * @swagger
 * /notifications/my/mark-all-read:
 *   patch:
 *     summary: Mark all my notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All notifications marked as read successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of notifications marked as read
 *                       example: 5
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
// User route - mark all own notifications as read
router.patch(
  '/my/mark-all-read',
  Limiter,
  requireAuth(),
  notificationController.markAllMyNotificationsAsRead,
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the notification
 *           example: "notification123"
 *         userId:
 *           type: string
 *           description: ID of the user who receives the notification
 *           example: "user123"
 *         senderId:
 *           type: string
 *           nullable: true
 *           description: ID of the user who sent the notification
 *           example: "sender456"
 *         type:
 *           type: string
 *           enum: [LIKE, COMMENT, FOLLOW, MENTION, MESSAGE, SYSTEM]
 *           description: Type of notification
 *           example: "LIKE"
 *         referenceId:
 *           type: string
 *           nullable: true
 *           description: ID of the referenced object
 *           example: "post789"
 *         title:
 *           type: string
 *           description: Notification title
 *           example: "New Like"
 *         content:
 *           type: string
 *           description: Notification content
 *           example: "John Doe liked your post"
 *         image_url:
 *           type: string
 *           nullable: true
 *           description: URL of the notification image
 *           example: "https://example.com/avatar.jpg"
 *         is_read:
 *           type: boolean
 *           description: Whether the notification has been read
 *           example: false
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: Status of the notification
 *           example: "ACTIVE"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was created
 *           example: "2023-12-01T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the notification was last updated
 *           example: "2023-12-01T10:30:00Z"
 */

export default router;
