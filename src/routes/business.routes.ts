import { Router } from 'express';

import * as controller from '../controllers/business.controller';
import { authenticate } from '../middlewares/auth.middleware';

const businessRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Business
 *     description: Business details management
 */

/**
 * @swagger
 * /business/{userId}:
 *   patch:
 *     summary: Update business details
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Business details updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
businessRouter.patch('/:userId', authenticate, controller.updateBusinessDetails);

export default businessRouter;