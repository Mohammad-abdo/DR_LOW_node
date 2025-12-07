import prisma from '../../../config/database.js';
import { NOTIFICATION_TYPE } from '../../../config/constants.js';

export const sendNotification = async (req, res, next) => {
  try {
    const { titleAr, titleEn, messageAr, messageEn, courseId, studentIds } = req.body;

    if (!titleAr || !titleEn || !messageAr || !messageEn) {
      return res.status(400).json({
        success: false,
        message: 'Title and message (Arabic and English) are required',
      });
    }

    // If courseId provided, verify it belongs to teacher
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId, teacherId: req.user.id },
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        senderId: req.user.id,
        titleAr,
        titleEn,
        messageAr,
        messageEn,
        type: NOTIFICATION_TYPE.COURSE,
        courseId,
      },
    });

    // Create recipients
    if (studentIds && studentIds.length > 0) {
      // Verify students are enrolled in the course if courseId provided
      if (courseId) {
        const enrolledStudents = await prisma.purchase.findMany({
          where: {
            courseId,
            studentId: { in: studentIds },
            payment: {
              status: 'COMPLETED',
            },
          },
          select: {
            studentId: true,
          },
        });

        const enrolledIds = enrolledStudents.map(e => e.studentId);
        await prisma.notificationRecipient.createMany({
          data: enrolledIds.map(userId => ({
            notificationId: notification.id,
            userId,
          })),
        });
      } else {
        await prisma.notificationRecipient.createMany({
          data: studentIds.map(userId => ({
            notificationId: notification.id,
            userId,
          })),
        });
      }
    } else if (courseId) {
      // Send to all students enrolled in the course
      const enrollments = await prisma.purchase.findMany({
        where: {
          courseId,
          payment: {
            status: 'COMPLETED',
          },
        },
        select: {
          studentId: true,
        },
      });

      await prisma.notificationRecipient.createMany({
        data: enrollments.map(e => ({
          notificationId: notification.id,
          userId: e.studentId,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { senderId: req.user.id },
      include: {
        _count: {
          select: {
            recipients: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};



