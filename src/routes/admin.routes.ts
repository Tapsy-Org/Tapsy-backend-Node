import { Router } from 'express';

import { loginAdmin } from '../controllers/adminauth.controller';
const router = Router();
/**
 * @swagger
 * tags:
 *   name: AdminAuth
 *   description: Admin authentication and login APIs
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     description: Logs in an admin using email and password, returns access and refresh tokens.
 *     tags: [AdminAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Admin logged in successfully
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
 *                   example: Admin logged in successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refresh_token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */

router.post('/login', loginAdmin);

export default router;
