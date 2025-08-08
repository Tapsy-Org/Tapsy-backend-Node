import { NextFunction, Request, Response } from 'express';

import * as userPersonalizationService from '../services/userPersonalization.service';

export const createUserPersonalization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userPersonalization = await userPersonalizationService.createUserPersonalization(
      req.body,
    );
    res.created(userPersonalization);
  } catch (error) {
    next(error);
  }
};

export const getUserPersonalizations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userPersonalizations = await userPersonalizationService.getAllUserPersonalizations();
    res.success(userPersonalizations);
  } catch (error) {
    next(error);
  }
};

export const getUserPersonalization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userPersonalization = await userPersonalizationService.getUserPersonalizationById(id);
    res.success(userPersonalization);
  } catch (error) {
    next(error);
  }
};

export const updateUserPersonalization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedUserPersonalization = await userPersonalizationService.updateUserPersonalization(
      id,
      updates,
    );
    res.success(updatedUserPersonalization);
  } catch (error) {
    next(error);
  }
};

export const deleteUserPersonalization = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await userPersonalizationService.deleteUserPersonalization(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
