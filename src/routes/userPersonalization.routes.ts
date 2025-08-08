import { Router } from 'express';

import * as userPersonalizationController from '../controllers/userPersonalization.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: UserPersonalization
 *     description: User personalization management
 */

/**
 * @swagger
 * /user-personalization:
 *   post:
 *     summary: Create user personalization
 *     tags: [UserPersonalization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: User personalization created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', userPersonalizationController.createUserPersonalization);

/**
 * @swagger
 * /user-personalization:
 *   get:
 *     summary: Get all user personalizations
 *     tags: [UserPersonalization]
 *     responses:
 *       200:
 *         description: A list of user personalizations
 */
router.get('/', userPersonalizationController.getUserPersonalizations);

/**
 * @swagger
 * /user-personalization/{id}:
 *   get:
 *     summary: Get user personalization by ID
 *     tags: [UserPersonalization]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user personalization ID
 *     responses:
 *       200:
 *         description: User personalization found
 *       404:
 *         description: User personalization not found
 */
router.get('/:id', userPersonalizationController.getUserPersonalization);

/**
 * @swagger
 * /user-personalization/{id}:
 *   put:
 *     summary: Update user personalization
 *     tags: [UserPersonalization]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user personalization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User personalization updated successfully
 *       400:
 *         description: Bad request
 */
router.put('/:id', userPersonalizationController.updateUserPersonalization);

/**
 * @swagger
 * /user-personalization/{id}:
 *   delete:
 *     summary: Delete user personalization
 *     tags: [UserPersonalization]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user personalization ID
 *     responses:
 *       204:
 *         description: User personalization deleted successfully
 */
router.delete('/:id', userPersonalizationController.deleteUserPersonalization);

export default router;
