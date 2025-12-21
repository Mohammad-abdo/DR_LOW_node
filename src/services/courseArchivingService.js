import prisma from '../config/database.js';
import { COURSE_STATUS } from '../config/constants.js';

/**
 * Archive an expired course
 * Moves course to EXPIRED status and preserves essential data
 */
export const archiveExpiredCourse = async (courseId) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        purchases: {
          select: {
            id: true,
            studentId: true,
            amount: true,
            createdAt: true,
          },
        },
        ratings: {
          select: {
            id: true,
            rating: true,
            commentAr: true,
            commentEn: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            purchases: true,
            ratings: true,
            content: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    // Calculate total revenue
    const totalRevenue = course.purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Update course status to EXPIRED
    const archivedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'EXPIRED',
        // Keep all data, just change status
        // Videos and attachments remain in database but are not accessible via streaming
      },
    });

    // Log archiving action (you can create a CourseArchiveLog table if needed)
    console.log(`Course ${courseId} archived. Revenue: ${totalRevenue}, Enrollments: ${course._count.purchases}`);

    return {
      courseId: archivedCourse.id,
      title: archivedCourse.titleEn || archivedCourse.titleAr,
      status: archivedCourse.status,
      totalRevenue,
      enrollmentCount: course._count.purchases,
      ratingCount: course._count.ratings,
      contentCount: course._count.content,
      archivedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error archiving course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Archive all expired courses
 * Called by scheduled job
 */
export const archiveAllExpiredCourses = async () => {
  try {
    const now = new Date();

    // Find all courses that have expired
    const expiredCourses = await prisma.course.findMany({
      where: {
        status: {
          in: ['PUBLISHED', 'DRAFT'],
        },
        publishEndDate: {
          lt: now,
        },
      },
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
      },
    });

    console.log(`Found ${expiredCourses.length} expired courses to archive`);

    const archived = [];
    const errors = [];

    for (const course of expiredCourses) {
      try {
        const result = await archiveExpiredCourse(course.id);
        archived.push(result);
      } catch (error) {
        errors.push({
          courseId: course.id,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      archived: archived.length,
      errors: errors.length,
      details: {
        archived,
        errors,
      },
    };
  } catch (error) {
    console.error('Error in archiveAllExpiredCourses:', error);
    throw error;
  }
};

/**
 * Reactivate an expired course
 * Admin can extend publishEndDate or reactivate
 */
export const reactivateCourse = async (courseId, newPublishEndDate = null) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    const updateData = {
      status: 'PUBLISHED',
    };

    if (newPublishEndDate) {
      updateData.publishEndDate = new Date(newPublishEndDate);
    } else {
      // If no new date provided, set to 1 year from now
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      updateData.publishEndDate = oneYearFromNow;
    }

    const reactivatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });

    console.log(`Course ${courseId} reactivated. New end date: ${updateData.publishEndDate}`);

    return reactivatedCourse;
  } catch (error) {
    console.error(`Error reactivating course ${courseId}:`, error);
    throw error;
  }
};








