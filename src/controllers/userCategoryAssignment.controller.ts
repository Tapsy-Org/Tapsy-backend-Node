import { NextFunction, Request, Response } from 'express';

import * as userCategoryAssignmentService from '../services/userCategoryAssignment.service';

export const assignCategoriesToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryIds } = req.body; // categoryIds should be an array

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'categoryIds must be a non-empty array' });
    }

    const assignments = await userCategoryAssignmentService.assignCategoriesToIndividualUser(
      userId,
      categoryIds,
    );

    res.created(assignments);
  } catch (error) {
    next(error);
  }
};

export const assignSubCategoryToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, subCategoryId } = req.body;
    const assignment = await userCategoryAssignmentService.assignSubCategoryToIndividualUser(
      userId,
      subCategoryId,
    );
    res.created(assignment);
  } catch (error) {
    next(error);
  }
};

export const assignCategoryToBusiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, categoryId } = req.body;
    const business = await userCategoryAssignmentService.assignCategoryToBusinessUser(
      businessId,
      categoryId,
    );
    res.success(business);
  } catch (error) {
    next(error);
  }
};

export const assignSubCategoryToBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, subCategoryId } = req.body;
    const assignment = await userCategoryAssignmentService.assignSubCategoryToBusinessUser(
      businessId,
      subCategoryId,
    );
    res.created(assignment);
  } catch (error) {
    next(error);
  }
};

export const assignMultipleSubCategoriesToBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, subCategoryIds } = req.body;

    if (!Array.isArray(subCategoryIds) || subCategoryIds.length === 0) {
      return res.status(400).json({ message: 'subCategoryIds must be a non-empty array' });
    }

    const assignments =
      await userCategoryAssignmentService.assignMultipleSubCategoriesToBusinessUser(
        businessId,
        subCategoryIds,
      );
    res.created(assignments);
  } catch (error) {
    next(error);
  }
};

export const getUserCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userCategories = await userCategoryAssignmentService.getUserCategories(userId);
    res.success(userCategories);
  } catch (error) {
    next(error);
  }
};

export const getBusinessCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const businessCategories =
      await userCategoryAssignmentService.getBusinessCategories(businessId);
    res.success(businessCategories);
  } catch (error) {
    next(error);
  }
};

export const removeCategoryFromUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId } = req.body;
    await userCategoryAssignmentService.removeCategoryFromIndividualUser(userId, categoryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const removeSubCategoryFromUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, subCategoryId } = req.body;
    await userCategoryAssignmentService.removeSubCategoryFromIndividualUser(userId, subCategoryId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const removeSubCategoryFromBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId, subCategoryId } = req.body;
    await userCategoryAssignmentService.removeSubCategoryFromBusinessUser(
      businessId,
      subCategoryId,
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const removeCategoryFromBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { businessId } = req.body;
    const business = await userCategoryAssignmentService.removeCategoryFromBusinessUser(businessId);
    res.success(business);
  } catch (error) {
    next(error);
  }
};
