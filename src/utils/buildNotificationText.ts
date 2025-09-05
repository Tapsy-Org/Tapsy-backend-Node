import { NotificationType } from '@prisma/client';

export function buildNotificationText(type: NotificationType, senderUsername: string) {
  switch (type) {
    case NotificationType.LIKE:
      return {
        title: 'New Like',
        content: `${senderUsername} liked your post`,
      };
    case NotificationType.COMMENT:
      return {
        title: 'New Comment',
        content: `${senderUsername} commented on your post`,
      };
    case NotificationType.FOLLOW:
      return {
        title: 'New Follower',
        content: `${senderUsername} started following you`,
      };
    case NotificationType.MESSAGE:
      return {
        title: 'New Message',
        content: `${senderUsername} sent you a message`,
      };
    default:
      return {
        title: 'Notification',
        content: `${senderUsername} performed an action`,
      };
  }
}
