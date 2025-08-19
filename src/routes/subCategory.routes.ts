import { Router } from 'express';

import * as subCategoryController from '../controllers/subCategory.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: SubCategories
 *     description: SubCategory management
 */

/**
 * @swagger
 * /subcategories:
 *   post:
 *     summary: Create subcategory
 *     tags: [SubCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               generated_by_ai:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: SubCategory created successfully
 */
router.post('/', subCategoryController.createSubCategory);

/**
 * @swagger
 * /subcategories:
 *   get:
 *     summary: Get all subcategories
 *     tags: [SubCategories]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: A list of subcategories
 */
router.get('/', subCategoryController.getSubCategories);

/**
 * @swagger
 * /subcategories/{id}:
 *   get:
 *     summary: Get subcategory by ID
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The subcategory ID
 *     responses:
 *       200:
 *         description: SubCategory found
 *       404:
 *         description: SubCategory not found
 */
router.get('/:id', subCategoryController.getSubCategoryById);

/**
 * @swagger
 * /subcategories/{id}:
 *   put:
 *     summary: Update subcategory
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The subcategory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: SubCategory updated successfully
 */
router.put('/:id', subCategoryController.updateSubCategory);

/**
 * @swagger
 * /subcategories/{id}:
 *   delete:
 *     summary: Delete subcategory
 *     tags: [SubCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The subcategory ID
 *     responses:
 *       204:
 *         description: SubCategory deleted successfully
 */
router.delete('/:id', subCategoryController.deleteSubCategory);

export default router;
