import prisma from '../config/database.js';
import { COURSE_STATUS } from '../config/constants.js';

/**
 * Middleware to check if course is expired
 * Should be used before allowing access to course content
 */
export const checkCourseExpiration = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return next(); // No courseId, skip check
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        status: true,
        publishStartDate: true,
        publishEndDate: true,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        messageAr: 'الدورة غير موجودة',
      });
    }

    const now = new Date();

    // Check if course has expired
    if (course.publishEndDate && new Date(course.publishEndDate) < now) {
      // Auto-archive expired courses
      if (course.status !== 'EXPIRED' && course.status !== 'ARCHIVED') {
        await prisma.course.update({
          where: { id: courseId },
          data: { status: 'EXPIRED' },
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Course has expired and is no longer accessible',
        messageAr: 'انتهت صلاحية الدورة ولم تعد متاحة',
        expired: true,
      });
    }

    // Check if course hasn't started yet
    if (course.publishStartDate && new Date(course.publishStartDate) > now) {
      return res.status(403).json({
        success: false,
        message: 'Course is not yet available',
        messageAr: 'الدورة غير متاحة بعد',
      });
    }

    // Check if course is published
    if (course.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: 'Course is not published',
        messageAr: 'الدورة غير منشورة',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to filter expired courses from query results
 */
export const filterExpiredCourses = (courses) => {
  const now = new Date();
  return courses.filter(course => {
    // If course has publishEndDate and it's passed, exclude it
    if (course.publishEndDate && new Date(course.publishEndDate) < now) {
      return false;
    }
    // If course status is EXPIRED or ARCHIVED, exclude it
    if (course.status === 'EXPIRED' || course.status === 'ARCHIVED') {
      return false;
    }
    // Only include published courses
    return course.status === 'PUBLISHED';
  });
};

/**
 * Helper function to build where clause excluding expired courses
 */
export const buildActiveCoursesWhere = (additionalWhere = {}) => {
  const now = new Date();
  return {
    ...additionalWhere,
    status: COURSE_STATUS.PUBLISHED,
    OR: [
      { publishEndDate: null }, // No expiration date
      { publishEndDate: { gt: now } }, // Not expired yet
    ],
  };
};








