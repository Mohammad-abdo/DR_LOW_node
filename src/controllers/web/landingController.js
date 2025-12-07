import prisma from '../../config/database.js';
import { COURSE_STATUS } from '../../config/constants.js';

export const getLandingPageData = async (req, res, next) => {
  try {
    const [
      banners,
      featuredCourses,
      stats,
    ] = await Promise.all([
      // Active banners
      prisma.banner.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      // Featured courses (top purchased)
      prisma.course.findMany({
        where: { status: COURSE_STATUS.PUBLISHED },
        take: 8,
        include: {
          teacher: {
            select: {
              nameAr: true,
              nameEn: true,
              avatar: true,
            },
          },
          category: {
            select: {
              nameAr: true,
              nameEn: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              ratings: true,
            },
          },
        },
        orderBy: {
          purchases: {
            _count: 'desc',
          },
        },
      }),
      // Stats
      Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.course.count({ where: { status: COURSE_STATUS.PUBLISHED } }),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]),
    ]);

    res.json({
      success: true,
      data: {
        hero: {
          titleAr: 'نظام إدارة التعلم',
          titleEn: 'Learning Management System',
          subtitleAr: 'تعلم من أفضل المعلمين في الكويت',
          subtitleEn: 'Learn from the best teachers in Kuwait',
        },
        banners,
        featuredCourses,
        stats: {
          students: stats[0],
          teachers: stats[1],
          courses: stats[2],
          sales: stats[3]._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAboutSection = async (req, res, next) => {
  try {
    // This could be stored in system_settings or hardcoded
    const aboutData = {
      titleAr: 'من نحن',
      titleEn: 'About Us',
      descriptionAr: 'نظام إدارة التعلم الشامل للجامعات في الكويت',
      descriptionEn: 'Comprehensive Learning Management System for Universities in Kuwait',
      features: [
        {
          titleAr: 'تعلم مرن',
          titleEn: 'Flexible Learning',
          descriptionAr: 'تعلم في الوقت والمكان المناسبين لك',
          descriptionEn: 'Learn at your own pace and convenience',
        },
        {
          titleAr: 'معلمون محترفون',
          titleEn: 'Professional Teachers',
          descriptionAr: 'تعلم من أفضل المعلمين المؤهلين',
          descriptionEn: 'Learn from the best qualified teachers',
        },
        {
          titleAr: 'دعم متعدد اللغات',
          titleEn: 'Multi-language Support',
          descriptionAr: 'دعم كامل للغة العربية والإنجليزية',
          descriptionEn: 'Full support for Arabic and English',
        },
      ],
    };

    res.json({
      success: true,
      data: aboutData,
    });
  } catch (error) {
    next(error);
  }
};



