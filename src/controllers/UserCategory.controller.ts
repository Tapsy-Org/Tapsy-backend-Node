import { NextFunction, Response } from 'express';

import { AuthRequest } from '../middlewares/auth.middleware';
import { UserCategoryService } from '../services/userCategory.service';

const userCategoryService = new UserCategoryService();

export const addCategoriesAndSubcategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { categoryIds, subcategories } = req.body;
    const userId = req.user?.id;

    // 1. Validate input
    if (!userId) {
      return res.unauthorized('Unauthorized: user not found in token');
    }

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.fail('categoryIds must be a non-empty array of strings', 400);
    }

    if (!subcategories || !Array.isArray(subcategories)) {
      return res.fail('subcategories must be an array of strings', 400);
    }

    if (subcategories.some((s: string) => typeof s !== 'string')) {
      return res.fail('All subcategories must be strings', 400);
    }

    // 2. Call service
    const user = await userCategoryService.addUserCategoriesAndSubcategories(
      userId,
      categoryIds,
      subcategories,
    );

    // 3. Respond
    return res.success({ user }, 'Categories and subcategories added successfully');
  } catch (error) {
    next(error);
  }
};

// export const assignCategoryToUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, categoryId, subcategories } = req.body;

//     if (!userId || !categoryId) {
//       return res.fail('userId and categoryId are required', 400);
//     }

//     // Use the updated method to add categories with optional subcategories
//     const user = await userCategoryService.addUserCategories(userId, [categoryId], subcategories);
//     res.created({ user }, 'Category assigned to user successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// export const getUserCategories = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.fail('userId is required', 400);
//     }

//     // Get user with categories and subcategories
//     const userCategories = await userCategoryService.getUserCategories(userId);
//     res.success(userCategories, 'User categories retrieved successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// export const removeCategoryFromUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, categoryId } = req.body;

//     if (!userId || !categoryId) {
//       return res.fail('userId and categoryId are required', 400);
//     }

//     const user = await userCategoryService.removeCategoryFromUser(userId, categoryId);
//     res.success({ user }, 'Category removed from user successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// export const assignMultipleCategoriesToUser = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { userId, categoryIds, subcategories } = req.body;

//     if (!userId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
//       return res.fail('userId and categoryIds array are required', 400);
//     }

//     // Use the updated method to add multiple categories with optional subcategories
//     const user = await userCategoryService.addUserCategories(userId, categoryIds, subcategories);
//     res.created({ user }, 'Categories assigned to user successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// export const updateCategorySubcategories = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { userId, categoryId } = req.params;
//     const { subcategories } = req.body;

//     if (!userId || !categoryId) {
//       return res.fail('userId and categoryId are required', 400);
//     }

//     if (!subcategories || !Array.isArray(subcategories)) {
//       return res.fail('subcategories array is required', 400);
//     }

//     const user = await userCategoryService.updateUserCategorySubcategories(
//       userId,
//       categoryId,
//       subcategories,
//     );
//     res.success({ user }, 'Category subcategories updated successfully');
//   } catch (error) {
//     next(error);
//   }
// };

// export async function addUserCategories(req: Request, res: Response, next: NextFunction) {
//   try {
//     const { userId } = req.params;
//     const { categories, subcategories } = req.body;

//     if (!userId) {
//       return res.fail('User ID is required', 400);
//     }

//     if (!categories || !Array.isArray(categories) || categories.length === 0) {
//       return res.fail('Categories array is required and cannot be empty', 400);
//     }

//     if (subcategories && !Array.isArray(subcategories)) {
//       return res.fail('Subcategories must be an array if provided', 400);
//     }

//     const user = await userCategoryService.addUserCategories(
//       userId,
//       categories,
//       subcategories ?? [], // default to empty array
//     );

//     return res.success({ user }, 'Categories added successfully');
//   } catch (error) {
//     next(error);
//   }
// }

// export async function updateUserCategorySubcategories(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) {
//   try {
//     const { userId, categoryId } = req.params;
//     const { subcategories } = req.body;

//     if (!userId) {
//       return res.fail('User ID is required', 400);
//     }

//     if (!categoryId) {
//       return res.fail('Category ID is required', 400);
//     }

//     if (!subcategories || !Array.isArray(subcategories) || subcategories.length === 0) {
//       return res.fail('Subcategories array is required and cannot be empty', 400);
//     }

//     const user = await userCategoryService.updateUserCategorySubcategories(
//       userId,
//       categoryId,
//       subcategories,
//     );

//     return res.success({ user }, 'Category subcategories updated successfully');
//   } catch (error) {
//     next(error);
//   }
// }
