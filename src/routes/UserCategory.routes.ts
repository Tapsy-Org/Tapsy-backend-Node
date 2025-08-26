import { Router } from 'express';

import * as UserCategoryController from '../controllers/UserCategory.controller';
import { requireAuth } from '../middlewares/auth.middleware';
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Categories
 *     description: User category assignment management
 */

// /**
//  * @swagger
//  * /user-categories/assign:
//  *   post:
//  *     summary: Assign a category to user
//  *     tags: [User Categories]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [userId, categoryId]
//  *             properties:
//  *               userId:
//  *                 type: string
//  *                 description: ID of the user
//  *               categoryId:
//  *                 type: string
//  *                 description: ID of the category to assign
//  *           example:
//  *             userId: "user-123"
//  *             categoryId: "cat-456"
//  *     responses:
//  *       201:
//  *         description: Category assigned to user successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 id:
//  *                   type: string
//  *                 userId:
//  *                   type: string
//  *                 categoryId:
//  *                   type: string
//  *                 user:
//  *                   type: object
//  *                 category:
//  *                   type: object
//  *                 created_at:
//  *                   type: string
//  *       400:
//  *         description: Missing required fields
//  *       404:
//  *         description: User or category not found
//  *       409:
//  *         description: Category already assigned to user
//  */
// router.post('/assign', UserCategoryController.assignCategoryToUser);

// /**
//  * @swagger
//  * /user-categories/assign-multiple:
//  *   post:
//  *     summary: Assign multiple categories to user
//  *     tags: [User Categories]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [userId, categoryIds]
//  *             properties:
//  *               userId:
//  *                 type: string
//  *                 description: ID of the user
//  *               categoryIds:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of category IDs to assign
//  *           example:
//  *             userId: "user-123"
//  *             categoryIds: ["cat-456", "cat-789"]
//  *     responses:
//  *       201:
//  *         description: Categories assigned to user successfully
//  *       400:
//  *         description: Missing required fields or invalid data
//  *       404:
//  *         description: User not found
//  *       409:
//  *         description: All categories already assigned to user
//  */
// router.post('/assign-multiple', UserCategoryController.assignMultipleCategoriesToUser);

// /**
//  * @swagger
//  * /user-categories/user/{userId}:
//  *   get:
//  *     summary: Get user's assigned categories
//  *     tags: [User Categories]
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The user ID
//  *     responses:
//  *       200:
//  *         description: User categories retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   id:
//  *                     type: string
//  *                   userId:
//  *                     type: string
//  *                   categoryId:
//  *                     type: string
//  *                   category:
//  *                     type: object
//  *                   created_at:
//  *                     type: string
//  *       404:
//  *         description: User not found
//  */
// router.get('/user/:userId', UserCategoryController.getUserCategories);

// /**
//  * @swagger
//  * /user-categories/remove:
//  *   delete:
//  *     summary: Remove category assignment from user
//  *     tags: [User Categories]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [userId, categoryId]
//  *             properties:
//  *               userId:
//  *                 type: string
//  *                 description: ID of the user
//  *               categoryId:
//  *                 type: string
//  *                 description: ID of the category to remove
//  *           example:
//  *             userId: "user-123"
//  *             categoryId: "cat-456"
//  *     responses:
//  *       200:
//  *         description: Category removed from user successfully
//  *       400:
//  *         description: Missing required fields
//  *       404:
//  *         description: Category assignment not found
//  */
// router.delete('/remove', UserCategoryController.removeCategoryFromUser);

// /**
//  * @swagger
//  * /user-categories/{userId}/categories/{categoryId}/subcategories:
//  *   put:
//  *     summary: Update subcategories for a specific category of an individual user
//  *     description: This endpoint allows updating subcategories for a specific category assignment of an individual user.
//  *     tags: [User Categories]
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: User ID (must be INDIVIDUAL user type)
//  *       - in: path
//  *         name: categoryId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Category ID to update subcategories for
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [subcategories]
//  *             properties:
//  *               subcategories:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of subcategory names for this category
//  *           example:
//  *             subcategories: ["React Development", "Node.js Development", "Mobile Apps"]
//  *     responses:
//  *       200:
//  *         description: Category subcategories updated successfully
//  *       400:
//  *         description: Invalid request, user is not individual, or category not assigned
//  *       404:
//  *         description: User not found
//  */
// router.put(
//   '/:userId/categories/:categoryId/subcategories',
//   UserCategoryController.updateCategorySubcategories,
// );
// /**
//  * @swagger
//  * /users/{userId}/categories:
//  *   post:
//  *     summary: Add categories with subcategories to an individual user
//  *     description: This endpoint is only for INDIVIDUAL users. Business users should include categories during registration. Subcategories are stored within each category assignment.
//  *     tags: [Users]
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: User ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [categories]
//  *             properties:
//  *               categories:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of category IDs
//  *               subcategories:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of subcategory names to be applied to all categories
//  *           example:
//  *             categories: ["category-id-1", "category-id-2"]
//  *             subcategories: ["React Development", "Node.js Development"]
//  *     responses:
//  *       200:
//  *         description: Categories added successfully
//  *       400:
//  *         description: Invalid request or user is not individual
//  *       404:
//  *         description: User not found
//  */
// router.post('/:userId/categories', UserCategoryController.addUserCategories);

// /**
//  * @swagger
//  * /users/{userId}/categories/{categoryId}/subcategories:
//  *   put:
//  *     summary: Update subcategories for a specific category of an individual user
//  *     description: This endpoint is only for INDIVIDUAL users. Updates the subcategories for a specific category assignment.
//  *     tags: [Users]
//  *     parameters:
//  *       - in: path
//  *         name: userId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: User ID
//  *       - in: path
//  *         name: categoryId
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Category ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [subcategories]
//  *             properties:
//  *               subcategories:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *                 description: Array of subcategory names for this category
//  *           example:
//  *             subcategories: ["React Development", "Node.js Development", "Mobile Apps"]
//  *     responses:
//  *       200:
//  *         description: Category subcategories updated successfully
//  *       400:
//  *         description: Invalid request, user is not individual, or category not assigned
//  *       404:
//  *         description: User not found
//  */
// router.put(
//   '/:userId/categories/:categoryId/subcategories',
//   UserCategoryController.updateUserCategorySubcategories,
// );
/**
 * @swagger
 * /api/user-categories/{userId}/categories-and-subcategories:
 *   post:
 *     summary: Add categories and subcategories to an individual user (single API)
 *     description: This endpoint allows individual users to add multiple categories with their respective subcategories in one API call. Each category can have different subcategories.
 *     tags: [User Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID (must be INDIVIDUAL user type)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categories]
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [categoryId, subcategories]
 *                   properties:
 *                     categoryId:
 *                       type: string
 *                       description: Category ID to assign
 *                     subcategories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Array of subcategory names for this category
 *           example:
 *             categories:
 *               - categoryId: "category-id-1"
 *                 subcategories: ["React Development", "Node.js Development"]
 *               - categoryId: "category-id-2"
 *                 subcategories: ["UI Design", "UX Research"]
 *     responses:
 *       200:
 *         description: Categories and subcategories added successfully
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
 *                   example: "Categories and subcategories added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       description: Updated user object with categories
 *       400:
 *         description: Invalid request, user is not individual, or categories already assigned
 *       404:
 *         description: User not found or invalid category IDs
 */
router.post(
  '/categories-and-subcategories',
  requireAuth(),
  UserCategoryController.addCategoriesAndSubcategories,
);
export default router;
