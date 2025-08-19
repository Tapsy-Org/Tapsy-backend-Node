import { NextFunction, Request, Response } from 'express';

import * as subcategoryService from '../services/individualusersubcategory.service';

export const assignMultipleSubcategoriesToUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, subcategories } = req.body;

    if (!userId || !Array.isArray(subcategories) || subcategories.length === 0) {
      return res.fail('userId and subcategories array are required', 400);
    }

    const created = await subcategoryService.assignMultipleSubcategoriesToUser(
      userId,
      subcategories,
    );

    res.created(created, 'Subcategories assigned to user successfully');
  } catch (error) {
    next(error);
  }
};
