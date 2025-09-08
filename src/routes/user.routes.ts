import { Router } from 'express';

import UserController from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Unified user management for both individual and business users with OTP verification
 *
 * components:
 *   schemas:
 *     UserRegistration:
 *       type: object
 *       required: [username]
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
 *     description: |
 *       Register a new user with OTP verification.
 *       - **INDIVIDUAL users**: Mobile number is required
 *       - **BUSINESS users**: Either mobile number OR email is required (not both)
 *       - **File uploads**: Logo and video files can be uploaded for business users
 *       - **OTP verification**: Will be sent via SMS (Twilio) or email after registration
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Business logo file (required for business users)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Business video file (optional for business users)
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
 *                 logo: "[FILE]"
 *                 video: "[FILE]"
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
 *         description: Username, email, or mobile number already exists
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
 *     description: Login with either mobile number or email. OTP will be sent via SMS (Twilio) or email for verification.
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
 *                 description: Unique username
 *               name:
 *                 type: string
 *                 description: User's display name
 *               mobile_number:
 *                 type: string
 *                 description: Mobile number
 *               email:
 *                 type: string
 *                 description: Email address
 *               firebase_token:
 *                 type: string
 *                 description: Firebase messaging token
 *               otp_verified:
 *                 type: boolean
 *                 description: OTP verification status
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, PENDING, DELETED]
 *                 description: User status
 *               last_login:
 *                 type: string
 *                 format: date-time
 *                 description: Last login timestamp
 *               address:
 *                 type: string
 *                 description: Street address
 *               zip_code:
 *                 type: string
 *                 description: Postal/ZIP code
 *               website:
 *                 type: string
 *                 description: Website URL
 *               about:
 *                 type: string
 *                 description: About information
 *               logo_url:
 *                 type: string
 *                 description: Logo URL
 *               video_urls:
 *                 type: string
 *                 description: Video URLs
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
 *     description: Send OTP to user's email or mobile number for verification via SMS (Twilio) or email. Use this endpoint to resend OTP if needed.
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
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID
 *                     user_type:
 *                       type: string
 *                       enum: [INDIVIDUAL, BUSINESS]
 *                     mobile_number:
 *                       type: string
 *                       nullable: true
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     verification_method:
 *                       type: string
 *                       enum: [EMAIL, MOBILE]
 *                     website:
 *                       type: string
 *                       nullable: true
 *                     about:
 *                       type: string
 *                       nullable: true
 *                     logo_url:
 *                       type: string
 *                       nullable: true
 *                     video_url:
 *                       type: string
 *                       nullable: true
 *                     access_token:
 *                       type: string
 *                       description: JWT access token
 *                     refresh_token:
 *                       type: string
 *                       description: JWT refresh token
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

/**
 * @swagger
 * /api/users/check-username:
 *   post:
 *     summary: Check if username is available
 *     description: Check if a username is available for registration. This endpoint helps validate usernames before user registration to provide immediate feedback.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username to check for availability
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 example: "john_doe"
 *           examples:
 *             available_username:
 *               summary: Check available username
 *               value:
 *                 username: "john_doe"
 *             taken_username:
 *               summary: Check taken username
 *               value:
 *                 username: "admin"
 *     responses:
 *       200:
 *         description: Username availability checked successfully
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
 *                   example: "Username is available"
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       description: The checked username
 *                       example: "john_doe"
 *                     available:
 *                       type: boolean
 *                       description: Whether the username is available
 *                       example: true
 *             examples:
 *               available:
 *                 summary: Username is available
 *                 value:
 *                   status: "success"
 *                   message: "Username is available"
 *                   data:
 *                     username: "john_doe"
 *                     available: true
 *               taken:
 *                 summary: Username is already taken
 *                 value:
 *                   status: "success"
 *                   message: "Username is already taken"
 *                   data:
 *                     username: "admin"
 *                     available: false
 *       400:
 *         description: Invalid username format or missing username
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
 *                   example: "Username is required and must be a string"
 *       500:
 *         description: Internal server error
 */
router.post('/check-username', UserController.checkUsername);

/**
 * @swagger
 * /api/users/business/{id}:
 *   get:
 *     summary: Get business information by ID for QR code
 *     description: |
 *       Retrieve detailed business information for an active business user.
 *       Only returns data for users with:
 *       - user_type: 'BUSINESS'
 *       - status: 'ACTIVE'
 *       - only returns data for users with ACTIVE status
 *       Returns business-specific data including:
 *       - Basic info (username, name, website, logo)
 *       - Location details (address, coordinates, city, state, country)
 *       - Multiple location support (ordered by most recent update)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Business user ID (UUID format)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Business information retrieved successfully
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
 *                   example: "Business information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     business:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           description: Business user ID
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         username:
 *                           type: string
 *                           description: Unique business username
 *                           example: "coffee_shop_downtown"
 *                         name:
 *                           type: string
 *                           nullable: true
 *                           description: Business display name
 *                           example: "Downtown Coffee Shop"
 *                         website:
 *                           type: string
 *                           nullable: true
 *                           description: Business website URL
 *                           example: "https://downtowncoffee.com"
 *                         logo_url:
 *                           type: string
 *                           nullable: true
 *                           description: Business logo image URL
 *                           example: "https://s3.amazonaws.com/bucket/logo.jpg"
 *                         locations:
 *                           type: array
 *                           description: Business locations (ordered by most recent update)
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                                 description: Location ID
 *                                 example: "456e7890-e89b-12d3-a456-426614174001"
 *                               latitude:
 *                                 type: number
 *                                 nullable: true
 *                                 description: GPS latitude coordinate
 *                                 example: 40.7128
 *                               longitude:
 *                                 type: number
 *                                 nullable: true
 *                                 description: GPS longitude coordinate
 *                                 example: -74.0060
 *                               address:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Street address
 *                                 example: "123 Main Street"
 *                               zip_code:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Postal/ZIP code
 *                                 example: "10001"
 *                               location:
 *                                 type: string
 *                                 nullable: true
 *                                 description: General location description
 *                                 example: "Downtown Business District"
 *                               location_type:
 *                                 type: string
 *                                 enum: [HOME, WORK, OTHER]
 *                                 nullable: true
 *                                 description: Type of location
 *                                 example: "WORK"
 *                               city:
 *                                 type: string
 *                                 nullable: true
 *                                 description: City name
 *                                 example: "New York"
 *                               state:
 *                                 type: string
 *                                 nullable: true
 *                                 description: State/Province
 *                                 example: "NY"
 *                               country:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Country name
 *                                 example: "USA"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Location creation timestamp
 *                                 example: "2024-01-15T10:30:00Z"
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 description: Location last update timestamp
 *                                 example: "2024-01-20T14:45:00Z"
 *             examples:
 *               success:
 *                 summary: Successful business retrieval
 *                 value:
 *                   status: "success"
 *                   statusCode: 200
 *                   message: "Business information retrieved successfully"
 *                   data:
 *                     business:
 *                       id: "123e4567-e89b-12d3-a456-426614174000"
 *                       username: "coffee_shop_downtown"
 *                       name: "Downtown Coffee Shop"
 *                       website: "https://downtowncoffee.com"
 *                       logo_url: "https://s3.amazonaws.com/bucket/logo.jpg"
 *                       locations:
 *                         - id: "456e7890-e89b-12d3-a456-426614174001"
 *                           latitude: 40.7128
 *                           longitude: -74.0060
 *                           address: "123 Main Street"
 *                           zip_code: "10001"
 *                           location: "Downtown Business District"
 *                           location_type: "WORK"
 *                           city: "New York"
 *                           state: "NY"
 *                           country: "USA"
 *                           createdAt: "2024-01-15T10:30:00Z"
 *                           updatedAt: "2024-01-20T14:45:00Z"
 *       400:
 *         description: Bad request - Invalid business ID format or missing ID
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
 *                   example: "Invalid business ID format"
 *       404:
 *         description: Business not found or inactive
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
 *                   example: "Business not found or inactive"
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
 *                   example: "Failed to fetch business"
 */
router.get('/business/:id', UserController.getBusinessById);

export default router;
