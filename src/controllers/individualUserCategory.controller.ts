import { NextFunction, Request, Response } from 'express';

import * as individualUserCategoryService from '../services/individualusercategory.service';

export const assignCategoryToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId } = req.body;

    if (!userId || !categoryId) {
      return res.fail('userId and categoryId are required', 400);
    }

    const assignment = await individualUserCategoryService.assignCategoryToUser(userId, categoryId);
    res.created(assignment, 'Category assigned to user successfully');
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

    const userCategories = await individualUserCategoryService.getUserCategories(userId);
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

    const result = await individualUserCategoryService.removeCategoryFromUser(userId, categoryId);
    res.success(result, 'Category removed from user successfully');
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
    const { userId, categoryIds } = req.body;

    if (!userId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.fail('userId and categoryIds array are required', 400);
    }

    const assignments = await individualUserCategoryService.assignMultipleCategoriesToUser(
      userId,
      categoryIds,
    );
    res.created(assignments, 'Categories assigned to user successfully');
  } catch (error) {
    next(error);
  }
};
