import prisma from '../../config/database.js';
import { NOTIFICATION_TYPE } from '../../config/constants.js';

export const getAllNotifications = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          sender: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              recipients: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const { titleAr, titleEn, messageAr, messageEn, type, courseId, recipientIds } = req.body;

    if (!titleAr || !titleEn || !messageAr || !messageEn) {
      return res.status(400).json({
        success: false,
        message: 'Title and message (Arabic and English) are required',
      });
    }

    const notification = await prisma.notification.create({
      data: {
        senderId: req.user.id,
        titleAr,
        titleEn,
        messageAr,
        messageEn,
        type: type || NOTIFICATION_TYPE.GENERAL,
        courseId,
      },
    });

    // Create recipients
    if (recipientIds && recipientIds.length > 0) {
      await prisma.notificationRecipient.createMany({
        data: recipientIds.map(userId => ({
          notificationId: notification.id,
          userId,
        })),
      });
    } else {
      // Send to all users if no specific recipients
      const allUsers = await prisma.user.findMany({
        select: { id: true },
      });
      await prisma.notificationRecipient.createMany({
        data: allUsers.map(user => ({
          notificationId: notification.id,
          userId: user.id,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for admin
 * GET /api/admin/notifications/unread-count
 * GET /api/mobile/admin/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await prisma.notificationRecipient.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};



