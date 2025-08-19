import { Router } from 'express';

import * as individualUserCategoryController from '../controllers/individualUserCategory.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Categories
 *     description: Individual user category assignment management
 */

/**
 * @swagger
 * /user-categories/assign:
 *   post:
 *     summary: Assign a category to user
 *     tags: [User Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, categoryId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               categoryId:
 *                 type: string
 *                 description: ID of the category to assign
 *           example:
 *             userId: "user-123"
 *             categoryId: "cat-456"
 *     responses:
 *       201:
 *         description: Category assigned to user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 categoryId:
 *                   type: string
 *                 user:
 *                   type: object
 *                 category:
 *                   type: object
 *                 created_at:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User or category not found
 *       409:
 *         description: Category already assigned to user
 */
router.post('/assign', individualUserCategoryController.assignCategoryToUser);

/**
 * @swagger
 * /user-categories/assign-multiple:
 *   post:
 *     summary: Assign multiple categories to user
 *     tags: [User Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, categoryIds]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs to assign
 *           example:
 *             userId: "user-123"
 *             categoryIds: ["cat-456", "cat-789"]
 *     responses:
 *       201:
 *         description: Categories assigned to user successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       404:
 *         description: User not found
 *       409:
 *         description: All categories already assigned to user
 */
router.post('/assign-multiple', individualUserCategoryController.assignMultipleCategoriesToUser);

/**
 * @swagger
 * /user-categories/user/{userId}:
 *   get:
 *     summary: Get user's assigned categories
 *     tags: [User Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   categoryId:
 *                     type: string
 *                   category:
 *                     type: object
 *                   created_at:
 *                     type: string
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', individualUserCategoryController.getUserCategories);

/**
 * @swagger
 * /user-categories/remove:
 *   delete:
 *     summary: Remove category assignment from user
 *     tags: [User Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, categoryId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               categoryId:
 *                 type: string
 *                 description: ID of the category to remove
 *           example:
 *             userId: "user-123"
 *             categoryId: "cat-456"
 *     responses:
 *       200:
 *         description: Category removed from user successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Category assignment not found
 */
router.delete('/remove', individualUserCategoryController.removeCategoryFromUser);

export default router;
