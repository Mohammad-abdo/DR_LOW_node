import prisma from '../config/database.js';
import { NOTIFICATION_TYPE } from '../config/constants.js';

/**
 * Send notification to student(s)
 */
export const sendNotification = async ({
  studentIds,
  titleAr,
  titleEn,
  messageAr,
  messageEn,
  type = NOTIFICATION_TYPE.GENERAL,
  courseId = null,
  senderId = null,
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        senderId,
        titleAr,
        titleEn,
        messageAr,
        messageEn,
        type,
        courseId,
      },
    });

    if (studentIds && studentIds.length > 0) {
      await prisma.notificationRecipient.createMany({
        data: studentIds.map(userId => ({
          notificationId: notification.id,
          userId,
        })),
      });
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Notify student about purchase
 */
export const notifyPurchase = async (studentId, courseId, amount) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { titleAr: true, titleEn: true },
  });

  return sendNotification({
    studentIds: [studentId],
    titleAr: 'تم شراء الدورة بنجاح',
    titleEn: 'Course Purchased Successfully',
    messageAr: `تم شراء الدورة "${course?.titleAr}" بنجاح بمبلغ ${amount} دينار كويتي`,
    messageEn: `Course "${course?.titleEn}" purchased successfully for ${amount} KWD`,
    type: NOTIFICATION_TYPE.PAYMENT,
    courseId,
  });
};

/**
 * Notify student about course completion
 */
export const notifyCourseCompletion = async (studentId, courseId) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { titleAr: true, titleEn: true },
  });

  return sendNotification({
    studentIds: [studentId],
    titleAr: 'تهانينا! أكملت الدورة',
    titleEn: 'Congratulations! Course Completed',
    messageAr: `تهانينا! لقد أكملت الدورة "${course?.titleAr}" بنجاح`,
    messageEn: `Congratulations! You have successfully completed the course "${course?.titleEn}"`,
    type: NOTIFICATION_TYPE.COURSE,
    courseId,
  });
};

/**
 * Notify student about exam
 */
export const notifyExam = async (studentId, examId, courseId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { titleAr: true, titleEn: true },
  });

  return sendNotification({
    studentIds: [studentId],
    titleAr: 'امتحان جديد متاح',
    titleEn: 'New Exam Available',
    messageAr: `امتحان جديد "${exam?.titleAr}" متاح الآن`,
    messageEn: `New exam "${exam?.titleEn}" is now available`,
    type: NOTIFICATION_TYPE.EXAM,
    courseId,
  });
};

/**
 * Notify student about progress milestone
 */
export const notifyProgress = async (studentId, courseId, progress) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { titleAr: true, titleEn: true },
  });

  const milestones = [25, 50, 75, 100];
  if (!milestones.includes(progress)) {
    return null; // Only notify at milestones
  }

  return sendNotification({
    studentIds: [studentId],
    titleAr: `تقدم في الدورة - ${progress}%`,
    titleEn: `Course Progress - ${progress}%`,
    messageAr: `رائع! لقد أكملت ${progress}% من الدورة "${course?.titleAr}"`,
    messageEn: `Great! You've completed ${progress}% of the course "${course?.titleEn}"`,
    type: NOTIFICATION_TYPE.COURSE,
    courseId,
  });
};

/**
 * Notify student about operation failure
 */
export const notifyOperationFailure = async (studentId, operationAr, operationEn, errorMessage) => {
  return sendNotification({
    studentIds: [studentId],
    titleAr: 'فشل العملية',
    titleEn: 'Operation Failed',
    messageAr: `فشلت عملية ${operationAr}: ${errorMessage}`,
    messageEn: `Operation ${operationEn} failed: ${errorMessage}`,
    type: NOTIFICATION_TYPE.SYSTEM,
  });
};

/**
 * Notify student from teacher
 */
export const notifyFromTeacher = async (studentIds, teacherId, titleAr, titleEn, messageAr, messageEn, courseId = null) => {
  return sendNotification({
    studentIds,
    senderId: teacherId,
    titleAr,
    titleEn,
    messageAr,
    messageEn,
    type: NOTIFICATION_TYPE.GENERAL,
    courseId,
  });
};

