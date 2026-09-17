import { Notification, User } from '@/models';
import { getRedisClient } from '@/utils/redis';
import { logger } from '@/utils/logger';

export class NotificationService {
  static async createNotification(data: any) {
    const notification = await Notification.create(data);
    return notification;
  }

  static async getUserNotifications(userId: string, page: number = 1, limit: number = 20, unreadOnly = false) {
    const query: any = { user: userId };
    if (unreleased) query.isRead = false;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await Notification.updateOne({ _id: notificationId, user: userId }, { isRead: true, readAt: new Date() });
    } else {
      await Notification.updateMany({ user: userId, isRead: false }, { isRead: true, readAt: new Date() });
    }
  }

  static async sendEmailNotification(userId: string, subject: string, html: string) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.preferences.emailNotifications) return;

      const { sendEmail } = await import('@/utils/email');
      await sendEmail(user.email, subject, html);
      await Notification.updateMany({ user: userId }, { emailSent: true }, { sort: { createdAt: -1 }, limit: 1 });
    } catch (error) {
      logger.error('Email notification failed', { error, userId });
    }
  }

  static async sendPushNotification(userId: string, title: string, body: string) {
    try {
      const client = getRedisClient();
      if (!client) return;
      await client.publish(`push:${userId}`, JSON.stringify({ title, body }));
    } catch (error) {
      logger.error('Push notification failed', { error, userId });
    }
  }
}

export default NotificationService;