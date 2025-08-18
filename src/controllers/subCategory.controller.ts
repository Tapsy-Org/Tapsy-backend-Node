import { NextFunction, Request, Response } from 'express';

import * as subCategoryService from '../services/subCategory.service';

export const createSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subCategory = await subCategoryService.createSubCategory(req.body);
    res.created(subCategory);
  } catch (error) {
    next(error);
  }
};

export const getSubCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query;
    const subCategories = await subCategoryService.getSubCategories(categoryId as string);
    res.success(subCategories);
  } catch (error) {
    next(error);
  }
};

export const getSubCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const subCategory = await subCategoryService.getSubCategoryById(id);
    res.success(subCategory);
  } catch (error) {
    next(error);
  }
};

export const updateSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedSubCategory = await subCategoryService.updateSubCategory(id, updates);
    res.success(updatedSubCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await subCategoryService.deleteSubCategory(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
