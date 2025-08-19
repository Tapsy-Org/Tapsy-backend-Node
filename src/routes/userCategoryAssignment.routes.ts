import { Router } from 'express';

import * as userCategoryAssignmentController from '../controllers/userCategoryAssignment.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: UserCategoryAssignments
 *     description: User and Business category assignments
 */

/**
 * @swagger
 * /user-category-assignments/assign/user-category:
 *   post:
 *     summary: Assign multiple categories to individual user
 *     tags: [UserCategoryAssignments]
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
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Categories assigned to user successfully
 */
router.post('/assign/user-category', userCategoryAssignmentController.assignCategoriesToUser);

/**
 * @swagger
 * /user-category-assignments/assign/user-subcategory:
 *   post:
 *     summary: Assign subcategory to individual user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, subCategoryId]
 *             properties:
 *               userId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: SubCategory assigned to user successfully
 */
router.post('/assign/user-subcategory', userCategoryAssignmentController.assignSubCategoryToUser);

/**
 * @swagger
 * /user-category-assignments/assign/business-category:
 *   post:
 *     summary: Assign single category to business user (replaces any existing category)
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId, categoryId]
 *             properties:
 *               businessId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category assigned to business successfully
 */
router.post('/assign/business-category', userCategoryAssignmentController.assignCategoryToBusiness);

/**
 * @swagger
 * /user-category-assignments/assign/business-subcategory:
 *   post:
 *     summary: Assign single subcategory to business user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId, subCategoryId]
 *             properties:
 *               businessId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: SubCategory assigned to business successfully
 */
router.post(
  '/assign/business-subcategory',
  userCategoryAssignmentController.assignSubCategoryToBusiness,
);

/**
 * @swagger
 * /user-category-assignments/assign/business-subcategories:
 *   post:
 *     summary: Assign multiple subcategories to business user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId, subCategoryIds]
 *             properties:
 *               businessId:
 *                 type: string
 *               subCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: SubCategories assigned to business successfully
 */
router.post(
  '/assign/business-subcategories',
  userCategoryAssignmentController.assignMultipleSubCategoriesToBusiness,
);

/**
 * @swagger
 * /user-category-assignments/user/{userId}:
 *   get:
 *     summary: Get user's assigned categories and subcategories
 *     tags: [UserCategoryAssignments]
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
 */
router.get('/user/:userId', userCategoryAssignmentController.getUserCategories);

/**
 * @swagger
 * /user-category-assignments/business/{businessId}:
 *   get:
 *     summary: Get business's assigned subcategories
 *     tags: [UserCategoryAssignments]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: The business ID
 *     responses:
 *       200:
 *         description: Business categories retrieved successfully
 */
router.get('/business/:businessId', userCategoryAssignmentController.getBusinessCategories);

/**
 * @swagger
 * /user-category-assignments/remove/user-category:
 *   delete:
 *     summary: Remove category from individual user
 *     tags: [UserCategoryAssignments]
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
 *               categoryId:
 *                 type: string
 *     responses:
 *       204:
 *         description: Category removed from user successfully
 */
router.delete('/remove/user-category', userCategoryAssignmentController.removeCategoryFromUser);

/**
 * @swagger
 * /user-category-assignments/remove/user-subcategory:
 *   delete:
 *     summary: Remove subcategory from individual user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, subCategoryId]
 *             properties:
 *               userId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *     responses:
 *       204:
 *         description: SubCategory removed from user successfully
 */
router.delete(
  '/remove/user-subcategory',
  userCategoryAssignmentController.removeSubCategoryFromUser,
);

/**
 * @swagger
 * /user-category-assignments/remove/business-category:
 *   delete:
 *     summary: Remove category from business user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId]
 *             properties:
 *               businessId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category removed from business successfully
 */
router.delete(
  '/remove/business-category',
  userCategoryAssignmentController.removeCategoryFromBusiness,
);

/**
 * @swagger
 * /user-category-assignments/remove/business-subcategory:
 *   delete:
 *     summary: Remove subcategory from business user
 *     tags: [UserCategoryAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId, subCategoryId]
 *             properties:
 *               businessId:
 *                 type: string
 *               subCategoryId:
 *                 type: string
 *     responses:
 *       204:
 *         description: SubCategory removed from business successfully
 */
router.delete(
  '/remove/business-subcategory',
  userCategoryAssignmentController.removeSubCategoryFromBusiness,
);

export default router;
