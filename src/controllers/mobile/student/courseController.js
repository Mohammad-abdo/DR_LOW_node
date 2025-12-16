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



