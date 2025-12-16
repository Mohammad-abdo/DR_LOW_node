import prisma from '../../../config/database.js';
import { notifyCourseCompletion, notifyProgress } from '../../../services/notificationService.js';
import { convertImageUrls } from '../../../utils/imageHelper.js';

export const getMyCourses = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        studentId: req.user.id,
        payment: {
          status: 'COMPLETED',
        },
      },
      include: {
        course: {
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
            content: {
              orderBy: { order: 'asc' },
            },
        exams: {
          include: {
            _count: {
              select: { questions: true },
            },
            results: {
              where: {
                studentId: req.user.id,
              },
              select: {
                score: true,
                totalScore: true,
                percentage: true,
                passed: true,
                submittedAt: true,
              },
            },
            questions: {
              select: {
                type: true,
              },
            },
          },
        },
            _count: {
              select: {
                content: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      purchases.map(async (purchase) => {
        // Get overall course progress
        const courseProgress = await prisma.progress.findFirst({
          where: {
            studentId: req.user.id,
            courseId: purchase.courseId,
            contentId: null, // Overall course progress
          },
        });

        // Count completed content items
        const completedContent = await prisma.progress.count({
          where: {
            studentId: req.user.id,
            courseId: purchase.courseId,
            contentId: { not: null },
            completed: true,
          },
        });

        const totalContent = purchase.course.content.length;
        const progressPercentage = totalContent > 0
          ? (completedContent / totalContent) * 100
          : 0;

        // Check if course is completed (all content watched + final exam passed)
        const isCompleted = progressPercentage === 100;
        
        // Check if course has started (at least one content item watched)
        const hasStarted = completedContent > 0;

        // Determine course status
        let status = 'not_started';
        if (isCompleted) {
          status = 'completed';
        } else if (hasStarted) {
          status = 'in_progress';
        }

        return {
          ...purchase.course,
          progress: progressPercentage,
          completed: isCompleted,
          status,
          purchasedAt: purchase.createdAt,
          completedContent,
          totalContent,
        };
      })
    );

    // Categorize courses
    const notStarted = coursesWithProgress.filter(c => c.status === 'not_started');
    const inProgress = coursesWithProgress.filter(c => c.status === 'in_progress');
    const completed = coursesWithProgress.filter(c => c.status === 'completed');

    // Convert all image and video URLs to full URLs
    const coursesWithFullUrls = convertImageUrls(coursesWithProgress, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: {
        courses: coursesWithFullUrls,
        categorized: {
          notStarted: convertImageUrls(notStarted, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']),
          inProgress: convertImageUrls(inProgress, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']),
          completed: convertImageUrls(completed, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!purchase || purchase.payment.status !== 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Course not purchased',
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        content: {
          where: { chapterId: null },
          include: {
            quiz: {
              include: {
                _count: {
                  select: { questions: true },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        chapters: {
          include: {
            content: {
              include: {
                quiz: {
                  include: {
                    _count: {
                      select: { questions: true },
                    },
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        teacher: {
          select: {
            nameAr: true,
            nameEn: true,
          },
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
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Get student progress for this course
    const studentProgress = await prisma.progress.findMany({
      where: {
        studentId: req.user.id,
        courseId: course.id,
      },
    });

    // Create a map of contentId -> progress for quick lookup
    const progressMap = new Map();
    studentProgress.forEach(p => {
      if (p.contentId) {
        progressMap.set(p.contentId, {
          progress: p.progress,
          completed: p.completed,
          updatedAt: p.updatedAt,
        });
      }
    });

    // Enhance exams with types and add student results
    const courseWithExamTypes = {
      ...course,
      content: course.content.map(c => ({
        ...c,
        studentProgress: progressMap.get(c.id) || null,
      })),
      chapters: course.chapters.map(chapter => ({
        ...chapter,
        content: chapter.content.map(c => ({
          ...c,
          studentProgress: progressMap.get(c.id) || null,
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
    };

    // Convert all image and video URLs to full URLs
    const courseWithFullUrls = convertImageUrls(courseWithExamTypes, ['coverImage', 'avatar', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: { course: courseWithFullUrls },
    });
  } catch (error) {
    next(error);
  }
};

export const markContentComplete = async (req, res, next) => {
  try {
    const { courseId, contentId, watchedDuration, totalDuration } = req.body;

    if (!courseId || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and Content ID are required',
      });
    }

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!purchase || purchase.payment.status !== 'COMPLETED') {
      return res.status(403).json({
        success: false,
        message: 'Course not purchased',
      });
    }

    // Get content item
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
    });

    if (!content || content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Mark content as watched (80% watched = completed)
    const watchPercentage = totalDuration > 0 && watchedDuration
      ? (watchedDuration / totalDuration) * 100
      : 100; // If no duration info, mark as complete

    const isCompleted = watchPercentage >= 80;

    // Create or update content progress
    await prisma.progress.upsert({
      where: {
        studentId_courseId_contentId: {
          studentId: req.user.id,
          courseId,
          contentId,
        },
      },
      create: {
        studentId: req.user.id,
        courseId,
        contentId,
        completed: isCompleted,
        progress: watchPercentage,
      },
      update: {
        completed: isCompleted,
        progress: watchPercentage,
      },
    });

    // Get total content count (only videos count for progress)
    const totalVideos = await prisma.courseContent.count({
      where: {
        courseId,
        type: 'VIDEO',
      },
    });

    // Get completed video count
    const completedVideos = await prisma.progress.count({
      where: {
        studentId: req.user.id,
        courseId,
        contentId: { not: null },
        completed: true,
        content: {
          type: 'VIDEO',
        },
      },
    });

    // Calculate overall course progress percentage
    const courseProgressPercentage = totalVideos > 0
      ? (completedVideos / totalVideos) * 100
      : 0;

    // Get or create overall course progress
    const courseProgress = await prisma.progress.upsert({
      where: {
        studentId_courseId_contentId: {
          studentId: req.user.id,
          courseId,
          contentId: null,
        },
      },
      create: {
        studentId: req.user.id,
        courseId,
        contentId: null,
        progress: courseProgressPercentage,
        completed: false, // Will be true only after final exam passed
      },
      update: {
        progress: courseProgressPercentage,
      },
    });

    // Send progress notifications at milestones
    try {
      const previousProgress = courseProgress.progress;
      const roundedProgress = Math.round(courseProgressPercentage);
      const roundedPrevious = Math.round(previousProgress);
      
      // Check if we crossed a milestone (25, 50, 75, 100)
      const milestones = [25, 50, 75, 100];
      const crossedMilestone = milestones.find(m => roundedPrevious < m && roundedProgress >= m);
      
      if (crossedMilestone) {
        await notifyProgress(req.user.id, courseId, crossedMilestone);
      }

      // Notify on completion
      if (roundedProgress === 100 && !courseProgress.completed) {
        await notifyCourseCompletion(req.user.id, courseId);
      }
    } catch (notifError) {
      console.error('Error sending progress notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: 'Content progress updated',
      data: {
        contentProgress: watchPercentage,
        courseProgress: courseProgressPercentage,
        completed: isCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};




