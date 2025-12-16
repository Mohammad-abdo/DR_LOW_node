import prisma from '../../../config/database.js';
import { COURSE_STATUS } from '../../../config/constants.js';
import { convertImageUrls } from '../../../utils/imageHelper.js';

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

/**
 * Advanced search for courses and categories
 * GET /api/mobile/student/search
 * 
 * Query Parameters:
 * - q: Search query (searches in course title, description, teacher name, category name)
 * - categoryId: Filter by category ID
 * - categoryName: Filter by category name (search)
 * - level: Filter by level (BEGINNER, INTERMEDIATE, ADVANCED)
 * - isBasic: Filter by basic courses (true/false)
 * - isFeatured: Filter by featured courses (true/false)
 * - minPrice: Minimum price
 * - maxPrice: Maximum price
 * - minRating: Minimum average rating
 * - sortBy: Sort by (popular, newest, price_asc, price_desc, rating)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const searchCourses = async (req, res, next) => {
  try {
    const {
      q, // Search query
      categoryId,
      categoryName, // Search in category names
      level,
      isBasic,
      isFeatured,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status: COURSE_STATUS.PUBLISHED,
    };

    // Search query - search in course title, description, teacher name, category name
    if (q) {
      const searchTerm = q.trim();
      where.OR = [
        { titleAr: { contains: searchTerm } },
        { titleEn: { contains: searchTerm } },
        { descriptionAr: { contains: searchTerm } },
        { descriptionEn: { contains: searchTerm } },
        {
          teacher: {
            OR: [
              { nameAr: { contains: searchTerm } },
              { nameEn: { contains: searchTerm } },
            ],
          },
        },
        {
          category: {
            OR: [
              { nameAr: { contains: searchTerm } },
              { nameEn: { contains: searchTerm } },
            ],
          },
        },
      ];
    }

    // Filter by category ID
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by category name (search)
    if (categoryName) {
      where.category = {
        OR: [
          { nameAr: { contains: categoryName.trim() } },
          { nameEn: { contains: categoryName.trim() } },
        ],
      };
    }

    // Filter by level
    if (level) {
      where.level = level;
    }

    // Filter by isBasic
    if (isBasic !== undefined) {
      where.isBasic = isBasic === 'true' || isBasic === true;
    }

    // Filter by isFeatured
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.finalPrice = {};
      if (minPrice) {
        where.finalPrice.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.finalPrice.lte = parseFloat(maxPrice);
      }
    }

    // Build orderBy based on sortBy
    let orderBy = { createdAt: 'desc' }; // Default: newest
    switch (sortBy) {
      case 'popular':
        orderBy = {
          purchases: {
            _count: 'desc',
          },
        };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { finalPrice: 'asc' };
        break;
      case 'price_desc':
        orderBy = { finalPrice: 'desc' };
        break;
      case 'rating':
        // Will be sorted after fetching (by average rating)
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get courses
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
              image: true,
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
        orderBy,
      }),
      prisma.course.count({ where }),
    ]);

    // Check if student has purchased each course and calculate average rating
    const coursesWithDetails = await Promise.all(
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
          averageRating: parseFloat(averageRating.toFixed(2)),
          ratingCount: course._count.ratings,
        };
      })
    );

    // Sort by rating if requested
    let sortedCourses = coursesWithDetails;
    if (sortBy === 'rating') {
      sortedCourses = coursesWithDetails.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Filter by minimum rating if specified
    let filteredCourses = sortedCourses;
    if (minRating) {
      filteredCourses = sortedCourses.filter(c => c.averageRating >= parseFloat(minRating));
    }

    // Get all categories for filter options
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        image: true,
        isBasic: true,
        _count: {
          select: {
            courses: {
              where: {
                status: COURSE_STATUS.PUBLISHED,
              },
            },
          },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    // Convert image URLs
    const coursesWithUrls = convertImageUrls(filteredCourses, ['coverImage', 'avatar', 'image']);
    const categoriesWithUrls = convertImageUrls(categories, ['image']);

    res.json({
      success: true,
      data: {
        courses: coursesWithUrls,
        categories: categoriesWithUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredCourses.length,
          totalAll: total,
          pages: Math.ceil(filteredCourses.length / parseInt(limit)),
        },
        filters: {
          applied: {
            q: q || null,
            categoryId: categoryId || null,
            categoryName: categoryName || null,
            level: level || null,
            isBasic: isBasic || null,
            isFeatured: isFeatured || null,
            minPrice: minPrice || null,
            maxPrice: maxPrice || null,
            minRating: minRating || null,
            sortBy: sortBy || 'newest',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error in searchCourses:', error);
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
            questions: {
              orderBy: { order: 'asc' },
              // Include all fields, we'll filter correctAnswer based on submission status
            },
            _count: {
              select: { questions: true },
            },
            results: {
              where: {
                studentId: req.user.id,
              },
              include: {
                answers: {
                  include: {
                    question: {
                      select: {
                        id: true,
                        type: true,
                        questionAr: true,
                        questionEn: true,
                        correctAnswer: true,
                        points: true,
                      },
                    },
                  },
                },
              },
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

    // Add isAccessible flag to each content item and enhance exams with types
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
      exams: course.exams.map(exam => {
        // Get unique exam types from questions (safe check)
        const examTypes = exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0
          ? [...new Set(exam.questions.map(q => q.type).filter(Boolean))]
          : [];
        
        // Get student result if exists
        const studentResult = exam.results && exam.results.length > 0 ? exam.results[0] : null;
        
        // Prepare questions (without correct answer if not submitted)
        const questions = exam.questions.map(q => {
          const questionData = {
            id: q.id,
            type: q.type,
            questionAr: q.questionAr,
            questionEn: q.questionEn,
            options: q.options,
            points: q.points,
            order: q.order,
          };
          
          // Only include correct answer if exam is already submitted
          if (studentResult && studentResult.submittedAt && studentResult.answers) {
            // Find student's answer for this question
            const studentAnswer = studentResult.answers.find(a => a.question && a.question.id === q.id);
            if (studentAnswer && studentAnswer.question) {
              questionData.correctAnswer = studentAnswer.question.correctAnswer;
              questionData.studentAnswer = studentAnswer.answer || null;
              questionData.isCorrect = studentAnswer.isCorrect || false;
              questionData.earnedPoints = parseFloat(studentAnswer.points) || 0;
            }
          }
          
          return questionData;
        });
        
        return {
          ...exam,
          examTypes, // Array of unique types: ["MCQ", "TRUE_FALSE", "ESSAY"]
          contentId: null, // Will be added later if exam is linked to content
          questions, // Include questions with answers if submitted
          result: studentResult ? {
            id: studentResult.id,
            score: studentResult.score,
            totalScore: studentResult.totalScore,
            percentage: studentResult.percentage,
            passed: studentResult.passed,
            startedAt: studentResult.startedAt,
            submittedAt: studentResult.submittedAt,
          } : null,
          results: undefined, // Remove results array, keep only single result
        };
      }),
      isPurchased,
      averageRating,
    };

    // Convert all image and video URLs to full URLs
    // Include all possible image/video fields: coverImage, avatar, videoUrl, fileUrl, image (for category)
    try {
      const courseWithFullUrls = convertImageUrls(courseWithAccess, ['image', 'coverImage', 'avatar', 'videoUrl', 'fileUrl']);
      
      // Debug: Log conversion result
      if (process.env.NODE_ENV === 'development') {
        console.log('Original coverImage:', courseWithAccess.coverImage);
        console.log('Converted coverImage:', courseWithFullUrls.coverImage);
        if (courseWithAccess.content && courseWithAccess.content.length > 0) {
          console.log('Original first videoUrl:', courseWithAccess.content[0]?.videoUrl);
          console.log('Converted first videoUrl:', courseWithFullUrls.content[0]?.videoUrl);
        }
      }

      res.json({
        success: true,
        data: {
          course: courseWithFullUrls,
        },
      });
    } catch (convertError) {
      console.error('Error converting image URLs:', convertError);
      // Return course without URL conversion if conversion fails
      res.json({
        success: true,
        data: {
          course: courseWithAccess,
        },
      });
    }
  } catch (error) {
    console.error('Error in getCourseById:', error);
    next(error);
  }
};



