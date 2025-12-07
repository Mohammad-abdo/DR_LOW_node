import prisma from '../config/database.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      recipients: {
        some: {
          userId: req.user.id,
          ...(read !== undefined && { read: read === 'true' }),
        },
      },
    };

    const [notifications, total, unreadCount] = await Promise.all([
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
          recipients: {
            where: {
              userId: req.user.id,
            },
            select: {
              read: true,
              readAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notificationRecipient.count({
        where: {
          userId: req.user.id,
          read: false,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: id,
        userId: req.user.id,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notificationRecipient.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};



