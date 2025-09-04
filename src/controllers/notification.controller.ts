import { NotificationType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';

import * as notificationService from '../services/notification.service';
import { AuthRequest } from '../types/express';
import AppError from '../utils/AppError';

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.created(notification, 'Notification created successfully');
  } catch (error) {
    next(error);
  }
}

export async function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { page = '1', limit = '20', type } = req.query;

    const filters = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      type: type as NotificationType,
    };

    const notifications = await notificationService.getNotificationsWithFilters(userId, filters);
    res.success(notifications, 'Your notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getUsersUnreadNotificationCount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.params.userId;
    const count = await notificationService.getUnreadNotificationCount(userId);
    res.success(count, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function markMyNotificationAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const notification = await notificationService.markAsReadForUser(id, userId);
    res.success(notification, 'Notification marked as read successfully');
  } catch (error) {
    next(error);
  }
}

export async function markAllMyNotificationsAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const result = await notificationService.markAllAsReadforUser(userId);
    res.success(result, 'All notifications marked as read successfully');
  } catch (error) {
    next(error);
  }
}
