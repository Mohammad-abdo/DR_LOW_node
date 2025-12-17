import prisma from '../../../config/database.js';
import { hashPassword, comparePassword } from '../../../utils/password.js';
import { notifyOperationFailure } from '../../../services/notificationService.js';

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for account deletion',
        messageAr: 'كلمة المرور مطلوبة لحذف الحساب',
      });
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        messageAr: 'كلمة المرور غير صحيحة',
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
      messageAr: 'تم حذف الحساب بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

export const shareApp = async (req, res, next) => {
  try {
    // Return share information
    const shareData = {
      url: process.env.APP_URL || 'https://lms.edu.kw',
      titleAr: 'انضم إلى منصة التعلم الإلكتروني',
      titleEn: 'Join our Learning Management System',
      messageAr: 'انضم إلى منصة التعلم الإلكتروني وابدأ رحلتك التعليمية اليوم!',
      messageEn: 'Join our Learning Management System and start your learning journey today!',
    };

    res.json({
      success: true,
      data: shareData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for student (Mobile)
 * GET /api/mobile/student/notifications/unread-count
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

