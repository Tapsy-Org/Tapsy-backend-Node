import { NextFunction, Request, Response } from 'express';

import { UserCategoryService } from '../services/userCategory.service';

const userCategoryService = new UserCategoryService();

export const assignCategoryToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId, subcategories } = req.body;

    if (!userId || !categoryId) {
      return res.fail('userId and categoryId are required', 400);
    }

    // Use the updated method to add categories with optional subcategories
    const user = await userCategoryService.addUserCategories(userId, [categoryId], subcategories);
    res.created({ user }, 'Category assigned to user successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.fail('userId is required', 400);
    }

    // Get user with categories and subcategories
    const userCategories = await userCategoryService.getUserCategories(userId);
    res.success(userCategories, 'User categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const removeCategoryFromUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId } = req.body;

    if (!userId || !categoryId) {
      return res.fail('userId and categoryId are required', 400);
    }

    const user = await userCategoryService.removeCategoryFromUser(userId, categoryId);
    res.success({ user }, 'Category removed from user successfully');
  } catch (error) {
    next(error);
  }
};

export const assignMultipleCategoriesToUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, categoryIds, subcategories } = req.body;

    if (!userId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.fail('userId and categoryIds array are required', 400);
    }

    // Use the updated method to add multiple categories with optional subcategories
    const user = await userCategoryService.addUserCategories(userId, categoryIds, subcategories);
    res.created({ user }, 'Categories assigned to user successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCategorySubcategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, categoryId } = req.params;
    const { subcategories } = req.body;

    if (!userId || !categoryId) {
      return res.fail('userId and categoryId are required', 400);
    }

    if (!subcategories || !Array.isArray(subcategories)) {
      return res.fail('subcategories array is required', 400);
    }

    const user = await userCategoryService.updateUserCategorySubcategories(
      userId,
      categoryId,
      subcategories,
    );
    res.success({ user }, 'Category subcategories updated successfully');
  } catch (error) {
    next(error);
  }
};

export const addCategoriesAndSubcategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { categories } = req.body;

    if (!userId) {
      return res.fail('userId is required', 400);
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.fail('categories array is required and cannot be empty', 400);
    }

    // Validate structure: [{categoryId: string, subcategories: string[]}]
    for (const category of categories) {
      if (!category.categoryId || typeof category.categoryId !== 'string') {
        return res.fail('Each category must have a valid categoryId', 400);
      }
      if (!Array.isArray(category.subcategories)) {
        return res.fail('Each category must have a subcategories array', 400);
      }
    }

    const user = await userCategoryService.addUserCategoriesAndSubcategories(userId, categories);
    res.success({ user }, 'Categories and subcategories added successfully');
  } catch (error) {
    next(error);
  }
};
