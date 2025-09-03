import { Router } from 'express';

import UserController from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Unified user management for both individual and business users
 *
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required: [device_id, username]
 *       properties:
 *         firebase_token:
 *           type: string
 *           description: Firebase messaging token for push notifications
 *         user_type:
 *           type: string
 *           enum: [INDIVIDUAL, BUSINESS]
 *           default: INDIVIDUAL
 *           description: Type of user account
 *         mobile_number:
 *           type: string
 *           description: Mobile number (required for INDIVIDUAL, optional for BUSINESS)
 *         email:
 *           type: string
 *           description: Email address (optional for BUSINESS, not allowed for INDIVIDUAL)
 *         username:
 *           type: string
 *           description: Unique username
 *         name:
 *           type: string
 *           description: User's display name
 *         # Location fields (for business users)
 *         address:
 *           type: string
 *           description: Street address
 *         zip_code:
 *           type: string
 *           description: Postal/ZIP code
 *         latitude:
 *           type: number
 *           description: GPS latitude coordinate
 *         longitude:
 *           type: number
 *           description: GPS longitude coordinate
 *         location:
 *           type: string
 *           description: General location description
 *         location_type:
 *           type: string
 *           enum: [HOME, WORK, OTHER]
 *           description: Type of location
 *         city:
 *           type: string
 *           description: City name
 *         state:
 *           type: string
 *           description: State/Province
 *         country:
 *           type: string
 *           description: Country name
 *         # Business-specific fields
 *         website:
 *           type: string
 *           description: Business website URL
 *         about:
 *           type: string
 *           description: About the business
 *         logo_url:
 *           type: string
 *           description: Business logo URL
 *         video_url:
 *           type: string
 *           description: Business video URL
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Category IDs
 *         subcategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Subcategory names
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user (individual or business)
 *     description: For INDIVIDUAL users, mobile number is required. For BUSINESS users, either mobile number or email is required (but not both). OTP verification will be sent after registration.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               firebase_token:
 *                 type: string
 *                 description: Firebase messaging token for push notifications
 *               user_type:
 *                 type: string
 *                 enum: [INDIVIDUAL, BUSINESS]
 *                 default: INDIVIDUAL
 *               mobile_number:
 *                 type: string
 *                 description: Mobile number (required for INDIVIDUAL users, optional for BUSINESS)
 *               email:
 *                 type: string
 *                 description: Email (optional for BUSINESS users only, not allowed for INDIVIDUAL)
 *               username:
 *                 type: string
 *                 description: Unique username for the user
 *               name:
 *                 type: string
 *                 description: User's display name
 *               address:
 *                 type: string
 *                 description: Business address (for business users only)
 *               zip_code:
 *                 type: string
 *                 description: Business zip code (for business users only)
 *               latitude:
 *                 type: number
 *                 description: GPS latitude coordinate (for business users only)
 *               longitude:
 *                 type: number
 *                 description: GPS longitude coordinate (for business users only)
 *               location:
 *                 type: string
 *                 description: General location description (for business users only)
 *               location_type:
 *                 type: string
 *                 enum: [HOME, WORK, OTHER]
 *                 description: Type of location (for business users only)
 *               city:
 *                 type: string
 *                 description: City name (for business users only)
 *               state:
 *                 type: string
 *                 description: State/Province (for business users only)
 *               country:
 *                 type: string
 *                 description: Country name (for business users only)
 *               website:
 *                 type: string
 *                 description: Business website URL (for business users only)
 *               about:
 *                 type: string
 *                 description: About the business (for business users only)
 *               logo_url:
 *                 type: string
 *                 description: Business logo URL (for business users only)
 *               video_url:
 *                 type: string
 *                 description: Business video URL (for business users only)
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
 *               summary: Individual user registration with mobile number
 *               value:
 *                 firebase_token: "firebase-messaging-token"
 *                 user_type: "INDIVIDUAL"
 *                 mobile_number: "+1234567890"
 *                 username: "john_doe"
 *                 name: "John Doe"
 *             business_mobile:
 *               summary: Business user registration with mobile number
 *               value:
 *                 firebase_token: "firebase-messaging-token"
 *                 user_type: "BUSINESS"
 *                 mobile_number: "+1234567890"
 *                 username: "business_user"
 *                 name: "Business Name"
 *             business_email:
 *               summary: Business user registration with email
 *               value:
 *                 firebase_token: "firebase-messaging-token"
 *                 user_type: "BUSINESS"
 *                 email: "business@example.com"
 *                 username: "business_user"
 *                 name: "Business Name"
 *                 address: "123 Business Street"
 *                 zip_code: "12345"
 *                 latitude: 40.7128
 *                 longitude: -74.0060
 *                 location: "Downtown Business District"
 *                 location_type: "WORK"
 *                 city: "New York"
 *                 state: "NY"
 *                 country: "USA"
 *                 website: "https://mybusiness.com"
 *                 about: "We are a technology consulting company"
 *                 logo_url: "https://mybusiness.com/logo.png"
 *                 video_url: "https://youtube.com/watch?v=123"
 *                 categories: ["category-id-1", "category-id-2"]
 *                 subcategories: ["Web Development", "Mobile Apps"]
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OTP_SENT"
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please check your SMS/email for OTP verification."
 *                 verification_method:
 *                   type: string
 *                   enum: [EMAIL, MOBILE]
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
 *     description: Login with either mobile number or email. OTP will be sent for verification.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firebase_token:
 *                 type: string
 *                 description: Firebase messaging token for push notifications
 *               mobile_number:
 *                 type: string
 *                 description: Mobile number (for users who registered with mobile)
 *               email:
 *                 type: string
 *                 description: Email (for business users who registered with email)
 *           examples:
 *             mobile_login:
 *               summary: Login with mobile number
 *               value:
 *                 mobile_number: "+1234567890"
 *                 firebase_token: "firebase-messaging-token"
 *             email_login:
 *               summary: Login with email
 *               value:
 *                 email: "user@example.com"
 *                 firebase_token: "firebase-messaging-token"
 *     responses:
 *       200:
 *         description: OTP sent for verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OTP_SENT"
 *                 message:
 *                   type: string
 *                   example: "OTP has been sent to your mobile number/email"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     user_type:
 *                       type: string
 *                       enum: [INDIVIDUAL, BUSINESS]
 *                     verification_method:
 *                       type: string
 *                       enum: [EMAIL, MOBILE]
 *       400:
 *         description: Missing required fields
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
 *     description: Send OTP to user's email or mobile number for verification. Use this endpoint to resend OTP if needed.
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
 *           examples:
 *             email_otp:
 *               summary: Send OTP to email
 *               value:
 *                 email: "user@example.com"
 *             mobile_otp:
 *               summary: Send OTP to mobile
 *               value:
 *                 mobile_number: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP sent to email/mobile number successfully"
 *                 otp_expiry:
 *                   type: string
 *                   format: date-time
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
 *     description: Verify the OTP sent to user's email or mobile number. Upon successful verification, user gets access and refresh tokens.
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
 *           examples:
 *             email_verify:
 *               summary: Verify OTP sent to email
 *               value:
 *                 email: "user@example.com"
 *                 otp: "123456"
 *             mobile_verify:
 *               summary: Verify OTP sent to mobile
 *               value:
 *                 mobile_number: "+1234567890"
 *                 otp: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: JWT access token
 *                 refresh_token:
 *                   type: string
 *                   description: JWT refresh token
 *                 user:
 *                   type: object
 *                   description: User information
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
