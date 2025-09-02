import { NotificationStatus, NotificationType } from '@prisma/client'; // import enums

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

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, is_read: false },
  });
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId },
    data: { is_read: true },
  });
}
