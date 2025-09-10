import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management for organizing users and content
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT access token for authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryAudience:
 *       type: string
 *       enum: [INDIVIDUAL, BUSINESS, BOTH]
 *       description: Target audience for the category
 *       example: BOTH
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique category identifier
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: Category display name
 *           example: "Restaurants"
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (must be unique)
 *           example: "restaurants"
 *         audience:
 *           $ref: '#/components/schemas/CategoryAudience'
 *         status:
 *           type: boolean
 *           description: Whether category is active
 *           example: true
 *         sort_order:
 *           type: integer
 *           description: Display order (lower numbers appear first)
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Category creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *     CategoryWithCount:
 *       allOf:
 *         - $ref: '#/components/schemas/Category'
 *         - type: object
 *           properties:
 *             _count:
 *               type: object
 *               properties:
 *                 users:
 *                   type: integer
 *                   description: Number of users in this category
 *                   example: 42
 *     CreateCategoryRequest:
 *       type: object
 *       required: [name, slug, status, audience, sort_order]
 *       properties:
 *         name:
 *           type: string
 *           description: Category display name
 *           example: "Restaurants"
 *           minLength: 1
 *           maxLength: 100
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (must be unique)
 *           example: "restaurants"
 *           pattern: '^[a-z0-9-]+$'
 *           minLength: 1
 *           maxLength: 50
 *         status:
 *           type: boolean
 *           description: Whether category is active
 *           example: true
 *         audience:
 *           $ref: '#/components/schemas/CategoryAudience'
 *         sort_order:
 *           type: integer
 *           description: Display order (lower numbers appear first)
 *           example: 1
 *           minimum: 1
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Category display name
 *           example: "Food & Dining"
 *           minLength: 1
 *           maxLength: 100
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (must be unique)
 *           example: "food-dining"
 *           pattern: '^[a-z0-9-]+$'
 *           minLength: 1
 *           maxLength: 50
 *         status:
 *           type: boolean
 *           description: Whether category is active
 *           example: false
 *         audience:
 *           $ref: '#/components/schemas/CategoryAudience'
 *         sort_order:
 *           type: integer
 *           description: Display order (lower numbers appear first)
 *           example: 5
 *           minimum: 1
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: fail
 *         statusCode:
 *           type: integer
 *         message:
 *           type: string
 *         details:
 *           type: object
 *           nullable: true
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     description: |
 *       Creates a new category in the system. Categories help organize users and content
 *       for better discovery and filtering capabilities.
 *
 *       **Required Fields:**
 *       - `name`: Display name for the category
 *       - `slug`: URL-friendly identifier (must be unique)
 *       - `status`: Whether the category is active
 *       - `audience`: Target audience (INDIVIDUAL, BUSINESS, or BOTH)
 *       - `sort_order`: Display order (lower numbers appear first)
 *
 *       **Slug Requirements:**
 *       - Must be lowercase
 *       - Can contain letters, numbers, and hyphens only
 *       - Must be unique across all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *           examples:
 *             individual_category:
 *               summary: Individual user category
 *               value:
 *                 name: "Personal Interests"
 *                 slug: "personal-interests"
 *                 status: true
 *                 audience: "INDIVIDUAL"
 *                 sort_order: 1
 *             business_category:
 *               summary: Business category
 *               value:
 *                 name: "Professional Services"
 *                 slug: "professional-services"
 *                 status: true
 *                 audience: "BUSINESS"
 *                 sort_order: 2
 *             universal_category:
 *               summary: Universal category for both user types
 *               value:
 *                 name: "Food & Dining"
 *                 slug: "food-dining"
 *                 status: true
 *                 audience: "BOTH"
 *                 sort_order: 3
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *             examples:
 *               success_response:
 *                 summary: Category created successfully
 *                 value:
 *                   status: "success"
 *                   message: "Category created successfully"
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Restaurants"
 *                     slug: "restaurants"
 *                     audience: "BOTH"
 *                     status: true
 *                     sort_order: 1
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Validation error"
 *                   details: {
 *                     "name": "Name is required",
 *                     "slug": "Slug must be unique"
 *                   }
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_admin:
 *                 summary: User is not an admin
 *                 value:
 *                   status: "fail"
 *                   statusCode: 403
 *                   message: "Admin access required"
 *                   details: null
 *       409:
 *         description: Conflict - category already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               duplicate_slug:
 *                 summary: Category with slug already exists
 *                 value:
 *                   status: "fail"
 *                   statusCode: 409
 *                   message: "Category already exists with the given unique field(s)"
 *                   details: {
 *                     "target": ["slug"]
 *                   }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', requireAuth('ADMIN'), categoryController.createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories with user counts
 *     description: |
 *       Retrieves all categories in the system with user count information.
 *       This endpoint is useful for admin interfaces and analytics.
 *
 *       **Response includes:**
 *       - All categories (active and inactive)
 *       - User count for each category
 *       - Complete category details
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryWithCount'
 *             examples:
 *               success_response:
 *                 summary: Categories with user counts
 *                 value:
 *                   status: "success"
 *                   message: "Categories retrieved successfully"
 *                   data:
 *                     - id: "550e8400-e29b-41d4-a716-446655440000"
 *                       name: "Restaurants"
 *                       slug: "restaurants"
 *                       audience: "BOTH"
 *                       status: true
 *                       sort_order: 1
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                       updatedAt: "2024-01-15T10:30:00Z"
 *                       _count:
 *                         users: 42
 *                     - id: "550e8400-e29b-41d4-a716-446655440001"
 *                       name: "Retail"
 *                       slug: "retail"
 *                       audience: "BUSINESS"
 *                       status: true
 *                       sort_order: 2
 *                       createdAt: "2024-01-15T10:31:00Z"
 *                       updatedAt: "2024-01-15T10:31:00Z"
 *                       _count:
 *                         users: 18
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories/active:
 *   get:
 *     summary: Get active categories for user selection
 *     description: |
 *       Retrieves only active categories that users can select from.
 *       This endpoint is optimized for user selection interfaces and forms.
 *
 *       **Use cases:**
 *       - User registration category selection
 *       - Profile update category selection
 *       - Content filtering by category
 *
 *       **Response includes:**
 *       - Only categories with `status: true`
 *       - Essential fields only (id, name, slug, status, createdAt)
 *       - Sorted by name in ascending order
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Active categories retrieved successfully
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
 *                   example: Active categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Unique category identifier
 *                         example: "550e8400-e29b-41d4-a716-446655440000"
 *                       name:
 *                         type: string
 *                         description: Category display name
 *                         example: "Restaurants"
 *                       slug:
 *                         type: string
 *                         description: URL-friendly identifier
 *                         example: "restaurants"
 *                       status:
 *                         type: boolean
 *                         description: Category status (always true for this endpoint)
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Category creation timestamp
 *                         example: "2024-01-15T10:30:00Z"
 *             examples:
 *               success_response:
 *                 summary: Active categories for user selection
 *                 value:
 *                   status: "success"
 *                   message: "Active categories retrieved successfully"
 *                   data:
 *                     - id: "550e8400-e29b-41d4-a716-446655440000"
 *                       name: "Food & Dining"
 *                       slug: "food-dining"
 *                       status: true
 *                       createdAt: "2024-01-15T10:30:00Z"
 *                     - id: "550e8400-e29b-41d4-a716-446655440001"
 *                       name: "Professional Services"
 *                       slug: "professional-services"
 *                       status: true
 *                       createdAt: "2024-01-15T10:31:00Z"
 *                     - id: "550e8400-e29b-41d4-a716-446655440002"
 *                       name: "Retail"
 *                       slug: "retail"
 *                       status: true
 *                       createdAt: "2024-01-15T10:32:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/active', categoryController.getActiveCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: |
 *       Retrieves a specific category by its ID with user count information.
 *       Useful for displaying detailed category information and analytics.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The category ID (UUID format)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Category found successfully
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
 *                   example: Category retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/CategoryWithCount'
 *             examples:
 *               success_response:
 *                 summary: Category with user count
 *                 value:
 *                   status: "success"
 *                   message: "Category retrieved successfully"
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Restaurants"
 *                     slug: "restaurants"
 *                     audience: "BOTH"
 *                     status: true
 *                     sort_order: 1
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                     _count:
 *                       users: 42
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Category not found
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "Category not found"
 *                   details: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category (Admin only)
 *     description: |
 *       Updates an existing category. All fields are optional - only provided fields will be updated.
 *
 *       **Updateable Fields:**
 *       - `name`: Category display name
 *       - `slug`: URL-friendly identifier (must be unique)
 *       - `status`: Whether category is active
 *       - `audience`: Target audience (INDIVIDUAL, BUSINESS, or BOTH)
 *       - `sort_order`: Display order (lower numbers appear first)
 *
 *       **Note:** If updating slug, it must remain unique across all categories.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The category ID (UUID format)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *           examples:
 *             update_name_and_status:
 *               summary: Update category name and status
 *               value:
 *                 name: "Food & Dining"
 *                 status: false
 *             update_slug_and_audience:
 *               summary: Update category slug and audience
 *               value:
 *                 slug: "food-dining"
 *                 audience: "BOTH"
 *             update_sort_order:
 *               summary: Update category sort order
 *               value:
 *                 sort_order: 5
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *             examples:
 *               success_response:
 *                 summary: Category updated successfully
 *                 value:
 *                   status: "success"
 *                   message: "Category updated successfully"
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "Food & Dining"
 *                     slug: "food-dining"
 *                     audience: "BOTH"
 *                     status: false
 *                     sort_order: 5
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T11:45:00Z"
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Validation error"
 *                   details: {
 *                     "slug": "Slug must be unique"
 *                   }
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_admin:
 *                 summary: User is not an admin
 *                 value:
 *                   status: "fail"
 *                   statusCode: 403
 *                   message: "Admin access required"
 *                   details: null
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Category not found
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "Category not found"
 *                   details: null
 *       409:
 *         description: Conflict - category with slug already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               duplicate_slug:
 *                 summary: Category with slug already exists
 *                 value:
 *                   status: "fail"
 *                   statusCode: 409
 *                   message: "Category already exists with the given unique field(s)"
 *                   details: {
 *                     "target": ["slug"]
 *                   }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', requireAuth('ADMIN'), categoryController.updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category (Admin only)
 *     description: |
 *       Permanently deletes a category from the system.
 *
 *       **Warning:** This action cannot be undone. All user-category associations
 *       will be affected. Consider deactivating the category instead of deleting it.
 *
 *       **Before deleting:**
 *       - Check if any users are associated with this category
 *       - Consider the impact on existing content and user profiles
 *       - Ensure this is the intended action
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The category ID (UUID format)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Category deleted successfully
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
 *                   example: Category deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_admin:
 *                 summary: User is not an admin
 *                 value:
 *                   status: "fail"
 *                   statusCode: 403
 *                   message: "Admin access required"
 *                   details: null
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               not_found:
 *                 summary: Category not found
 *                 value:
 *                   status: "fail"
 *                   statusCode: 404
 *                   message: "Category not found"
 *                   details: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Bad request - category cannot be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               category_in_use:
 *                 summary: Category is being used by users
 *                 value:
 *                   status: "fail"
 *                   statusCode: 400
 *                   message: "Cannot delete this category because users are currently using it. Please update the category instead of deleting it."
 *                   details: null
 */
router.delete('/:id', requireAuth('ADMIN'), categoryController.deleteCategory);

export default router;
