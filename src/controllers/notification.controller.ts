import { NextFunction, Request, Response } from 'express';

import * as notificationService from '../services/notification.service';

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.created(notification, 'Notification created successfully');
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await notificationService.getNotifications(req.params.userId);
    res.success(notifications, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.params.userId);
    res.success(unreadCount, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.success(notification, 'Notification marked as read successfully');
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markAllAsRead(req.params.userId);
    res.success(notification, 'All notifications marked as read successfully');
  } catch (error) {
    next(error);
  }
}
