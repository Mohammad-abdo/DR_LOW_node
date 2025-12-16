import prisma from '../../config/database.js';
import { COURSE_STATUS } from '../../config/constants.js';
import { convertImageUrls } from '../../utils/imageHelper.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const { categoryId, level, page = 1, limit = 12, search } = req.query;
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
          _count: {
            select: {
              purchases: true,
              ratings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate average ratings
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
        const ratings = await prisma.rating.findMany({
          where: { courseId: course.id },
          select: { rating: true },
        });
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        return {
          ...course,
          averageRating,
        };
      })
    );

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithRatings, ['coverImage', 'avatar']);

    res.json({
      success: true,
      data: {
        courses: coursesWithFullUrls,
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

    // Convert all image paths to full URLs
    const courseWithFullUrls = convertImageUrls({
      ...course,
      averageRating,
    }, ['coverImage', 'avatar']);

    res.json({
      success: true,
      data: {
        course: courseWithFullUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert all image paths to full URLs
    const categoriesWithFullUrls = convertImageUrls(categories, ['image']);

    res.json({
      success: true,
      data: { categories: categoriesWithFullUrls },
    });
  } catch (error) {
    next(error);
  }
};



