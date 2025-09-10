import { NextFunction, Request, Response } from 'express';

import * as categoryService from '../services/category.service';
import AppError from '../utils/AppError';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.created(category);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getCategories();
    res.success(categories);
  } catch (error) {
    next(error);
  }
};

export const getActiveCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getActiveCategories();
    res.success(categories, 'Active categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const categoriesByid = await categoryService.getCategoryById(id);
    res.success(categoriesByid);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedCategory = await categoryService.updateCategory(id, updates);
    res.success(updatedCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    return res.success(null, 'Category deleted successfully');
  } catch (error) {
    if (
      error instanceof AppError &&
      error.statusCode === 400 &&
      error.message.includes('Cannot delete this category because users are currently using it')
    ) {
      return res.fail(error.message, 400);
    }

    next(error);
  }
};
