import { NotificationStatus, NotificationType, Prisma } from '@prisma/client'; // import enums

import prisma from '../config/db';
import { io, onlineUsers } from '../server';
import { buildNotificationText } from '../utils/buildNotificationText';

export async function createNotification(data: {
  userId: string;
  senderId?: string;
  type: NotificationType;
  referenceId?: string;
  image_url?: string;
  status?: NotificationStatus;
}) {
  // 1️⃣ Get sender username
  let senderUsername = 'Someone';
  let senderAvatarUrl: string | null = null;
  if (data.senderId) {
    const sender = await prisma.user.findUnique({
      where: { id: data.senderId },
      select: { username: true, avatarUrl: true },
    });
    if (sender) {
      senderUsername = sender.username;
      senderAvatarUrl = sender.avatarUrl || null;
    }
  }

  // 2️⃣ Build title and content
  const { title, content } = buildNotificationText(data.type, senderUsername);

  // 3️⃣ Create notification object for Prisma
  const notificationData = {
    userId: data.userId,
    senderId: data.senderId,
    type: data.type,
    referenceId: data.referenceId,
    title,
    content,
    image_url: senderAvatarUrl || data.image_url,
    status: data.status ?? NotificationStatus.ACTIVE,
  };

  // 4️⃣ Save notification in DB
  const notification = await prisma.notification.create({ data: notificationData });

  // 5️⃣ Emit real-time event if receiver is online
  const receiverSocket = onlineUsers.get(data.userId);
  if (receiverSocket) {
    io.to(receiverSocket).emit('NEW_NOTIFICATION', notification);
  }

  return notification;
}

export async function getNotificationsWithFilters(
  userId: string,
  filters: {
    limit?: number; // how many notifications to fetch
    cursor?: string; // the last notification id from previous fetch
    type?: NotificationType;
  } = {},
) {
  const { limit = 20, cursor, type } = filters;

  const where: Prisma.NotificationWhereInput = { userId, is_read: false };

  if (type) {
    where.type = type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // fetch one extra to check if there's more
    ...(cursor
      ? { skip: 1, cursor: { id: cursor } } // start after the given cursor
      : {}),
  });

  // determine if more notifications exist
  const hasMore = notifications.length > limit;

  // return only the requested limit
  const result = notifications.slice(0, limit);

  return {
    notifications: result,
    nextCursor: hasMore ? result[result.length - 1].id : null,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, is_read: false },
  });
}

export async function markAsReadForUser(notificationId: string, userId: string) {
  // First verify the notification belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found or does not belong to user');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { is_read: true, status: NotificationStatus.ARCHIVED },
  });
}

export async function markAllAsReadforUser(userId: string) {
  return prisma.notification.updateMany({
    where: { userId },
    data: { is_read: true, status: NotificationStatus.ARCHIVED },
  });
}
