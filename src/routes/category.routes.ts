import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, status]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', requireAuth('ADMIN'), categoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories with subcategories
 */
router.get('/', requireAuth('ADMIN'), categoryController.getCategories);

/**
 * @swagger
 * /categories/active:
 *   get:
 *     summary: Get active categories for user selection
 *     tags: [Categories]
 *     description: Returns only active categories that users can select from
 *     responses:
 *       200:
 *         description: A list of active categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   status:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 */
router.get('/active', requireAuth('ADMIN'), categoryController.getActiveCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 */
router.get('/:id', requireAuth('ADMIN'), categoryController.getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 */
router.put('/:id', requireAuth('ADMIN'), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 */
router.delete('/:id', requireAuth('ADMIN'), categoryController.deleteCategory);

export default router;
