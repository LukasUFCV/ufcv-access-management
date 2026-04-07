import type { NotificationItem } from '../../contracts/types.js';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../core/errors/app-error.js';

export class NotificationsService {
  async listForUser(userId: string): Promise<NotificationItem[]> {
    const items = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      type: item.type,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new AppError(404, 'Notification introuvable.');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

export const notificationsService = new NotificationsService();
