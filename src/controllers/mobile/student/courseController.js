import prisma from '../../../config/database.js';
import { COURSE_STATUS } from '../../../config/constants.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const { categoryId, level, page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: COURSE_STATUS.PUBLISHED,
    };
    if (categoryId) where.categoryId = categoryId;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          teacher: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          ratings: {
            select: {
              rating: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    // Check if student has purchased each course and calculate average rating
    const coursesWithPurchaseStatus = await Promise.all(
      courses.map(async (course) => {
        const purchase = await prisma.purchase.findUnique({
          where: {
            studentId_courseId: {
              studentId: req.user.id,
              courseId: course.id,
            },
          },
        });
        
        // Calculate average rating
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;
        
        return {
          ...course,
          isPurchased: !!purchase,
          averageRating,
          ratingCount: course._count.ratings,
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithPurchaseStatus,
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

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: id,
        },
      },
    });

    const isPurchased = !!purchase;

    const course = await prisma.course.findUnique({
      where: { id, status: COURSE_STATUS.PUBLISHED },
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            avatar: true,
          },
        },
        category: true,
        // Show ALL content for preview in course detail page
        // Students can see titles but access is restricted in learning page
        content: {
          orderBy: { order: 'asc' },
        },
        chapters: {
          include: {
            // Show ALL content for preview
            content: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        exams: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
        ratings: {
          include: {
            student: {
              select: {
                nameAr: true,
                nameEn: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
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
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const averageRating = course.ratings.length > 0
      ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
      : 0;

    // Mark which content is accessible (free or purchased)
    const accessibleContentIds = new Set();
    course.content.forEach(c => {
      if (c.isFree || isPurchased) {
        accessibleContentIds.add(c.id);
      }
    });
    course.chapters.forEach(chapter => {
      chapter.content.forEach(c => {
        if (c.isFree || isPurchased) {
          accessibleContentIds.add(c.id);
        }
      });
    });

    // Add isAccessible flag to each content item
    const courseWithAccess = {
      ...course,
      content: course.content.map(c => ({
        ...c,
        isAccessible: accessibleContentIds.has(c.id),
      })),
      chapters: course.chapters.map(chapter => ({
        ...chapter,
        content: chapter.content.map(c => ({
          ...c,
          isAccessible: accessibleContentIds.has(c.id),
        })),
      })),
      isPurchased,
      averageRating,
    };

    res.json({
      success: true,
      data: {
        course: courseWithAccess,
      },
    });
  } catch (error) {
    next(error);
  }
};



