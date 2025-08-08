import { NextFunction, Request, Response } from 'express';

import * as businessService from '../services/business.service';

export const updateBusinessDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const details = req.body;
    const updated = await businessService.updateBusinessDetails(userId, details);
    res.success(updated);
  } catch (error) {
    next(error);
  }
};
