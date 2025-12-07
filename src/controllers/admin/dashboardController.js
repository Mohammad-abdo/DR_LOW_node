import prisma from '../../config/database.js';
import { ROLES, PAYMENT_STATUS } from '../../config/constants.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalRevenue,
      recentPayments,
      recentEnrollments,
      topCourses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: ROLES.STUDENT } }),
      prisma.user.count({ where: { role: ROLES.TEACHER } }),
      prisma.course.count(),
      prisma.payment.aggregate({
        where: { status: PAYMENT_STATUS.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { status: PAYMENT_STATUS.COMPLETED },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
        },
      }),
      prisma.purchase.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
            },
          },
        },
      }),
      prisma.course.findMany({
        take: 5,
        orderBy: {
          purchases: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: {
              purchases: true,
              ratings: true,
            },
          },
          teacher: {
            select: {
              nameAr: true,
              nameEn: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalCourses,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        recentPayments,
        recentEnrollments,
        topCourses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      revenueData,
      enrollmentData,
      courseSales,
      teacherEarnings,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: PAYMENT_STATUS.COMPLETED,
          createdAt: { gte: startDate },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
      prisma.purchase.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.course.findMany({
        include: {
          _count: {
            select: { purchases: true },
          },
          purchases: {
            include: {
              payment: {
                where: {
                  status: PAYMENT_STATUS.COMPLETED,
                },
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: ROLES.TEACHER },
        include: {
          coursesCreated: {
            include: {
              purchases: {
                include: {
                  payment: {
                    where: {
                      status: PAYMENT_STATUS.COMPLETED,
                    },
                    select: {
                      amount: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate earnings per course
    const courseEarnings = courseSales.map(course => ({
      courseId: course.id,
      courseTitle: course.titleEn,
      sales: course._count.purchases,
      earnings: course.purchases.reduce((sum, purchase) => {
        return sum + (purchase.payment?.amount || 0);
      }, 0),
    }));

    // Calculate earnings per teacher
    const teacherEarningsData = teacherEarnings.map(teacher => {
      const earnings = teacher.coursesCreated.reduce((sum, course) => {
        return sum + course.purchases.reduce((courseSum, purchase) => {
          return courseSum + (purchase.payment?.amount || 0);
        }, 0);
      }, 0);

      return {
        teacherId: teacher.id,
        teacherName: teacher.nameEn,
        coursesCount: teacher.coursesCreated.length,
        earnings,
      };
    });

    res.json({
      success: true,
      data: {
        revenueData,
        enrollmentData,
        courseEarnings,
        teacherEarnings: teacherEarningsData,
      },
    });
  } catch (error) {
    next(error);
  }
};

