import prisma from '../../../config/database.js';
import { COURSE_STATUS } from '../../../config/constants.js';
import { convertImageUrls, getImageUrl } from '../../../utils/imageHelper.js';

/**
 * Get home page data for mobile
 * Returns: banners, popular courses, courses by categories
 */
export const getHomeData = async (req, res, next) => {
  try {
    // Get student year if available
    let studentYear = null;
    if (req.user && req.user.id) {
      const student = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { year: true },
      });
      studentYear = student?.year;
    }

    // Build where clause for popular courses (featured courses)
    // IMPORTANT: Only return courses where isFeatured = true
    // isFeatured must be outside OR to ensure it's always applied
    const popularCoursesWhere = {
      status: COURSE_STATUS.PUBLISHED,
      isFeatured: true, // Only featured courses - MUST be true
    };

    // Add year filter if student has a year
    if (studentYear) {
      popularCoursesWhere.AND = [
        {
          OR: [
            { targetYear: studentYear },
            { targetYear: null }, // Also include courses without specific target year
          ],
        },
      ];
    }

    const [banners, popularCourses, basicCourses, categoriesWithCourses] = await Promise.all([
      // Get active banners
      prisma.banner.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          image: true,
          titleAr: true,
          titleEn: true,
          link: true,
          order: true,
        },
      }),

      // Get popular courses (featured courses) - filtered by student year if available
      prisma.course.findMany({
        where: popularCoursesWhere,
        take: 8,
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
        orderBy: [
          studentYear ? { targetYear: 'asc' } : {}, // Prioritize matching year if available
          {
            purchases: {
              _count: 'desc',
            },
          },
        ],
      }),

      // Get basic courses for student's year (if available)
      studentYear ? prisma.course.findMany({
        where: {
          status: COURSE_STATUS.PUBLISHED,
          isBasic: true,
          OR: [
            { targetYear: studentYear },
            { targetYear: null },
          ],
        },
        take: 8,
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
        orderBy: [
          { targetYear: 'asc' },
          { purchases: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      }) : Promise.resolve([]),

      // Get all categories with their courses (top 4 courses per category, prioritize basic courses)
      prisma.category.findMany({
        include: {
          courses: {
            where: { status: COURSE_STATUS.PUBLISHED },
            take: 4,
            include: {
              teacher: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  avatar: true,
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
            orderBy: [
              { isBasic: 'desc' },
              {
                purchases: {
                  _count: 'desc',
                },
              },
            ],
          },
          _count: {
            select: {
              courses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate average ratings for popular courses
    const popularCoursesWithRatings = popularCourses.map((course) => {
      const averageRating = course.ratings.length > 0
        ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
        : 0;

      // Check if student has purchased
      const isPurchased = false; // Will be set below if needed

      return {
        id: course.id,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        descriptionAr: course.descriptionAr,
        descriptionEn: course.descriptionEn,
        price: course.price,
        discount: course.discount,
        finalPrice: course.finalPrice,
        coverImage: course.coverImage,
        level: course.level,
        teacher: course.teacher,
        category: course.category,
        averageRating,
        ratingCount: course._count.ratings,
        purchaseCount: course._count.purchases,
        contentCount: course._count.content,
        isPurchased,
        isFeatured: course.isFeatured,
        targetYear: course.targetYear,
      };
    });

    // Calculate average ratings for basic courses
    const basicCoursesWithRatings = (basicCourses || []).map((course) => {
      const averageRating = course.ratings.length > 0
        ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
        : 0;

      // Check if student has purchased
      const isPurchased = false; // Will be set below if needed

      return {
        id: course.id,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        descriptionAr: course.descriptionAr,
        descriptionEn: course.descriptionEn,
        price: course.price,
        discount: course.discount,
        finalPrice: course.finalPrice,
        coverImage: course.coverImage,
        level: course.level,
        teacher: course.teacher,
        category: course.category,
        averageRating,
        ratingCount: course._count.ratings,
        purchaseCount: course._count.purchases,
        contentCount: course._count.content,
        isPurchased,
        isBasic: course.isBasic,
        targetYear: course.targetYear,
      };
    });

    // Calculate average ratings for courses by category
    const categoriesWithCoursesData = categoriesWithCourses.map((category) => {
      const coursesData = category.courses.map((course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
        };
      });

      return {
        id: category.id,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        descriptionAr: category.descriptionAr,
        descriptionEn: category.descriptionEn,
        image: category.image,
        courseCount: category._count.courses,
        courses: coursesData,
      };
    });

    // Check purchase status for courses if student is authenticated
    if (req.user && req.user.id) {
      const studentId = req.user.id;
      const allCourseIds = [
        ...popularCoursesWithRatings.map(c => c.id),
        ...basicCoursesWithRatings.map(c => c.id),
      ];
      
      const purchases = await prisma.purchase.findMany({
        where: {
          studentId,
          courseId: { in: allCourseIds },
        },
        select: {
          courseId: true,
        },
      });

      const purchasedCourseIds = new Set(purchases.map(p => p.courseId));
      popularCoursesWithRatings.forEach(course => {
        course.isPurchased = purchasedCourseIds.has(course.id);
      });
      basicCoursesWithRatings.forEach(course => {
        course.isPurchased = purchasedCourseIds.has(course.id);
      });
    }

    // Convert all image and video paths to full URLs with error handling
    let bannersWithFullUrls = banners;
    let popularCoursesWithFullUrls = popularCoursesWithRatings;
    let basicCoursesWithFullUrls = basicCoursesWithRatings;
    let categoriesWithFullUrls = categoriesWithCoursesData;

    try {
      bannersWithFullUrls = convertImageUrls(banners, ['image']);
    } catch (err) {
      console.warn('Error converting banner URLs:', err);
    }

    try {
      popularCoursesWithFullUrls = convertImageUrls(popularCoursesWithRatings, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);
    } catch (err) {
      console.warn('Error converting popular courses URLs:', err);
    }

    try {
      basicCoursesWithFullUrls = convertImageUrls(basicCoursesWithRatings, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);
    } catch (err) {
      console.warn('Error converting basic courses URLs:', err);
    }

    try {
      categoriesWithFullUrls = convertImageUrls(categoriesWithCoursesData, ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']);
    } catch (err) {
      console.warn('Error converting categories URLs:', err);
    }

    res.json({
      success: true,
      data: {
        banners: bannersWithFullUrls,
        popularCourses: popularCoursesWithFullUrls,
        basicCourses: basicCoursesWithFullUrls,
        categories: categoriesWithFullUrls,
        studentYear: studentYear,
      },
    });
  } catch (error) {
    console.error('Error in getHomeData:', error);
    next(error);
  }
};

/**
 * Get courses by category ID
 */
export const getCoursesByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12, level, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        descriptionAr: true,
        descriptionEn: true,
        image: true,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Build where clause
    const where = {
      categoryId,
      status: COURSE_STATUS.PUBLISHED,
    };

    if (level) {
      where.level = level;
    }

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
        orderBy: {
          purchases: {
            _count: 'desc',
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: {
            id: category.id,
            nameAr: category.nameAr,
            nameEn: category.nameEn,
          },
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
        };
      })
    );

    // Convert all image paths to full URLs
    const categoryWithFullUrl = convertImageUrls(category, ['image']);
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: {
        category: categoryWithFullUrl,
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

/**
 * Get featured/popular courses for mobile
 * Supports filtering by year
 */
export const getFeaturedCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, year } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get student year if not provided in query
    let studentYear = year ? parseInt(year) : null;
    if (!studentYear && req.user && req.user.id) {
      const student = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { year: true },
      });
      studentYear = student?.year;
    }

    // IMPORTANT: Only return courses where isFeatured = true
    // isFeatured must be outside OR to ensure it's always applied
    const where = {
      status: COURSE_STATUS.PUBLISHED,
      isFeatured: true, // Only featured courses - MUST be true
    };

    // Add year filter if student has a year
    if (studentYear) {
      where.AND = [
        {
          OR: [
            { targetYear: studentYear },
            { targetYear: null },
          ],
        },
      ];
    }

    // Debug: Log the where clause to ensure isFeatured is always true
    console.log('🔍 Featured Courses Where Clause:', JSON.stringify(where, null, 2));

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
        orderBy: [
          studentYear ? { targetYear: 'asc' } : {},
          {
            purchases: {
              _count: 'desc',
            },
          },
          { createdAt: 'desc' },
        ],
      }),
      prisma.course.count({ where }),
    ]);

    // Filter out any courses that don't have isFeatured = true (safety check)
    const featuredCoursesOnly = courses.filter(course => course.isFeatured === true);
    
    if (featuredCoursesOnly.length !== courses.length) {
      console.warn(`⚠️ Warning: Found ${courses.length - featuredCoursesOnly.length} courses without isFeatured=true. Filtering them out.`);
    }

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      featuredCoursesOnly.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: course.category,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
          isFeatured: course.isFeatured,
          isBasic: course.isBasic,
        };
      })
    );

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    // Update total count to match filtered courses
    const actualTotal = featuredCoursesOnly.length;

    res.json({
      success: true,
      data: {
        courses: coursesWithFullUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: actualTotal,
          pages: Math.ceil(actualTotal / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get basic courses by student year
 * Returns basic courses that match the student's study year
 */
export const getBasicCoursesByYear = async (req, res, next) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required',
        messageAr: 'معامل السنة مطلوب',
      });
    }

    const studentYear = parseInt(year);

    const where = {
      status: COURSE_STATUS.PUBLISHED,
      isBasic: true,
      OR: [
        { targetYear: studentYear },
        { targetYear: null }, // Courses without specific target year
      ],
    };

    const courses = await prisma.course.findMany({
      where,
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
      orderBy: [
        { targetYear: 'asc' }, // Prioritize courses with matching targetYear
        { purchases: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
      take: 20,
    });

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: course.category,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
          isBasic: course.isBasic,
          targetYear: course.targetYear,
        };
      })
    );

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: {
        courses: coursesWithFullUrls,
        year: studentYear,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured courses by year
 * Returns featured courses that match the provided study year
 */
export const getFeaturedCoursesByYear = async (req, res, next) => {
  try {
    const { year, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required for featured courses by year',
        messageAr: 'السنة مطلوبة لعرض الدورات المميزة حسب السنة',
      });
    }

    const studentYear = parseInt(year);

    const where = {
      status: COURSE_STATUS.PUBLISHED,
      isFeatured: true,
      targetYear: studentYear,
    };

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
        orderBy: [
          { purchases: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: course.category,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
          isFeatured: course.isFeatured,
          targetYear: course.targetYear,
        };
      })
    );

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

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

/**
 * Get basic courses for mobile
 */
export const getBasicCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, categoryId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: COURSE_STATUS.PUBLISHED,
      isBasic: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
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
        orderBy: [
          { isBasic: 'desc' },
          {
            purchases: {
              _count: 'desc',
            },
          },
          { createdAt: 'desc' },
        ],
      }),
      prisma.course.count({ where }),
    ]);

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: course.category,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
          isFeatured: course.isFeatured,
          isBasic: course.isBasic,
        };
      })
    );

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

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

/**
 * Get featured courses for all study years
 * Returns featured courses grouped by targetYear
 */
export const getFeaturedCoursesByAllYears = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        status: COURSE_STATUS.PUBLISHED,
        isFeatured: true,
      },
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
      orderBy: [
        { targetYear: 'asc' },
        { purchases: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    // Calculate average ratings and check purchase status
    const coursesWithData = await Promise.all(
      courses.map(async (course) => {
        const averageRating = course.ratings.length > 0
          ? course.ratings.reduce((sum, r) => sum + r.rating, 0) / course.ratings.length
          : 0;

        let isPurchased = false;
        if (req.user && req.user.id) {
          const purchase = await prisma.purchase.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: course.id,
              },
            },
          });
          isPurchased = !!purchase;
        }

        return {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
          descriptionAr: course.descriptionAr,
          descriptionEn: course.descriptionEn,
          price: course.price,
          discount: course.discount,
          finalPrice: course.finalPrice,
          coverImage: course.coverImage,
          level: course.level,
          teacher: course.teacher,
          category: course.category,
          averageRating,
          ratingCount: course._count.ratings,
          purchaseCount: course._count.purchases,
          contentCount: course._count.content,
          isPurchased,
          isFeatured: course.isFeatured,
          targetYear: course.targetYear,
        };
      })
    );

    // Group courses by targetYear
    const coursesByYear = {};
    coursesWithData.forEach(course => {
      const year = course.targetYear || 'general';
      if (!coursesByYear[year]) {
        coursesByYear[year] = [];
      }
      coursesByYear[year].push(course);
    });

    // Convert all image paths to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithData, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);
    const coursesByYearWithFullUrls = {};
    Object.keys(coursesByYear).forEach(year => {
      coursesByYearWithFullUrls[year] = convertImageUrls(coursesByYear[year], ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);
    });

    res.json({
      success: true,
      data: {
        courses: coursesWithFullUrls,
        coursesByYear: coursesByYearWithFullUrls,
        years: Object.keys(coursesByYearWithFullUrls).sort((a, b) => {
          if (a === 'general') return 1;
          if (b === 'general') return -1;
          return parseInt(a) - parseInt(b);
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};