import { Router } from 'express';

import UserController from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Unified user management for both individual and business users
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user (individual or business)
 *     description: For INDIVIDUAL users, mobile number is extracted from Firebase ID token. For BUSINESS users, all business details including categories and subcategories are provided in the same request.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken, firebase_token]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *               firebase_token:
 *                 type: string
 *                 description: Firebase messaging token
 *               user_type:
 *                 type: string
 *                 enum: [INDIVIDUAL, BUSINESS]
 *                 default: INDIVIDUAL
 *               mobile_number:
 *                 type: string
 *                 description: Mobile number (for business users only - individual users get it from Firebase token)
 *               email:
 *                 type: string
 *                 description: Email (required if mobile_number not provided)
 *               username:
 *                 type: string
 *               device_id:
 *                 type: string
 *               business_name:
 *                 type: string
 *                 description: Required for business users
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Business tags (for business users only)
 *               address:
 *                 type: string
 *                 description: Business address (for business users only)
 *               zip_code:
 *                 type: string
 *                 description: Business zip code (for business users only)
 *               website:
 *                 type: string
 *                 description: Business website URL (for business users only)
 *               about:
 *                 type: string
 *                 description: About the business (for business users only)
 *               bio:
 *                 type: string
 *                 description: Business bio (for business users only)
 *               logo_url:
 *                 type: string
 *                 description: Business logo URL (for business users only)
 *               video_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Business video URLs (for business users only)
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Category IDs (for business users only)
 *               subcategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Subcategory names (for business users only)
 *           examples:
 *             individual:
 *               summary: Individual user registration (mobile number extracted from Firebase ID token)
 *               value:
 *                 idToken: "firebase-id-token"
 *                 firebase_token: "firebase-messaging-token"
 *                 user_type: "INDIVIDUAL"
 *                 username: "john_doe"
 *                 device_id: "device-123"
 *             business:
 *               summary: Business user registration with all business details
 *               value:
 *                 idToken: "firebase-id-token"
 *                 firebase_token: "firebase-messaging-token"
 *                 user_type: "BUSINESS"
 *                 mobile_number: "+1234567890"
 *                 username: "business_user"
 *                 business_name: "My Business"
 *                 tags: ["technology", "software", "consulting"]
 *                 address: "123 Business Street, City, State"
 *                 zip_code: "12345"
 *                 website: "https://mybusiness.com"
 *                 about: "We are a technology consulting company"
 *                 bio: "Helping businesses grow with technology"
 *                 logo_url: "https://mybusiness.com/logo.png"
 *                 video_urls: ["https://youtube.com/watch?v=123", "https://vimeo.com/456"]
 *                 categories: ["category-id-1", "category-id-2"]
 *                 subcategories: ["Web Development", "Mobile Apps"]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields or validation errors
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  upload.fields([{ name: 'logo' }, { name: 'video' }]),
  UserController.register,
);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken, firebase_token]
 *             properties:
 *               idToken:
 *                 type: string
 *               firebase_token:
 *                 type: string
 *               mobile_number:
 *                 type: string
 *               email:
 *                 type: string
 *               device_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       404:
 *         description: User not found
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/:id', UserController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               mobile_number:
 *                 type: string
 *               email:
 *                 type: string
 *               business_name:
 *                 type: string
 *               address:
 *                 type: string
 *               website:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', UserController.update);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   post:
 *     summary: Deactivate user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/deactivate', UserController.softDelete);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   post:
 *     summary: Restore deactivated user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored successfully
 *       404:
 *         description: User not found
 */
router.post('/:id/restore', UserController.restore);

/**
 * @swagger
 * /api/users/type/{user_type}:
 *   get:
 *     summary: Get users by type
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_type
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, BUSINESS]
 *         required: true
 *         description: User type
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Invalid user type
 */
router.get('/type/:user_type', UserController.getUsersByType);

/**
 * @swagger
 * /api/users/send-otp:
 *   post:
 *     summary: Send OTP to user
 *     description: Send OTP to user's email or mobile number for verification
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               mobile_number:
 *                 type: string
 *                 description: User's mobile number
 *           example:
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Email or mobile number is required
 *       404:
 *         description: User not found
 */
router.post('/send-otp', UserController.sendOtp);

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to user's email or mobile number
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               mobile_number:
 *                 type: string
 *                 description: User's mobile number
 *               otp:
 *                 type: string
 *                 description: The OTP code to verify
 *           example:
 *             email: "user@example.com"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', UserController.verifyOtp);
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       404:
 *         description: No users found
 */
router.get('/', UserController.getAllUsers);

// Note: Refresh token and logout are now handled by unified /auth endpoints
// Use /auth/refresh-token and /auth/logout for all user types
/**
 * @swagger
 * /api/users/refresh-token:
 *   post:
 *     summary: Refresh user's JWT token
 *     description: Generate a new access token using the provided refresh token. This allows users to stay logged in without re-authentication.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token previously issued to the user
 *           example:
 *             refresh_token: "user-refresh-token"
 *     responses:
 *       200:
 *         description: New access token issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: New access token
 *                 refresh_token:
 *                   type: string
 *                   description: Rotated refresh token
 *       401:
 *         description: Invalid or expired refresh token
 */

router.post('/refresh-token', UserController.refreshToken);
/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate the current refresh token and log the user out from the system.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token to invalidate
 *           example:
 *             refresh_token: "user-refresh-token"
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Refresh token missing or invalid
 */
router.post('/logout', UserController.logout);

export default router;
