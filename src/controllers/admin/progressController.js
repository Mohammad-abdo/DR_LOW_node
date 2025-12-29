import prisma from '../../config/database.js';
import { ROLES } from '../../config/constants.js';

/**
 * Get all students' progress for a specific course (Admin/Teacher)
 */
export const getCourseStudentsProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if user is admin or teacher of this course
    if (req.user.role === ROLES.TEACHER) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });

      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this course progress',
        });
      }
    }

    // Get all students who purchased this course
    const purchases = await prisma.purchase.findMany({
      where: {
        courseId,
        payment: {
          status: 'COMPLETED',
        },
      },
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Get progress for each student
    const studentsProgress = await Promise.all(
      purchases.map(async (purchase) => {
        // Get overall course progress
        const courseProgress = await prisma.progress.findFirst({
          where: {
            studentId: purchase.studentId,
            courseId,
            contentId: null,
          },
        });

        // Get content progress
        const contentProgress = await prisma.progress.findMany({
          where: {
            studentId: purchase.studentId,
            courseId,
            contentId: { not: null },
          },
          include: {
            course: {
              select: {
                titleAr: true,
                titleEn: true,
              },
            },
          },
        });

        // Count completed content
        const completedContent = contentProgress.filter(p => p.completed).length;
        const totalContent = contentProgress.length;

        // Get exam results
        const examResults = await prisma.examResult.findMany({
          where: {
            studentId: purchase.studentId,
            exam: {
              courseId,
            },
          },
          include: {
            exam: {
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        });

        // Get quiz results
        const quizResults = await prisma.quizResult.findMany({
          where: {
            studentId: purchase.studentId,
            quiz: {
              content: {
                courseId,
              },
            },
          },
          include: {
            quiz: {
              include: {
                content: {
                  select: {
                    id: true,
                    titleAr: true,
                    titleEn: true,
                  },
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        });

        return {
          student: purchase.student,
          purchasedAt: purchase.createdAt,
          courseProgress: courseProgress?.progress || 0,
          completedContent,
          totalContent,
          contentProgress: contentProgress.map(p => ({
            contentId: p.contentId,
            progress: p.progress,
            completed: p.completed,
            updatedAt: p.updatedAt,
          })),
          examResults: examResults.map(r => ({
            examId: r.exam.id,
            examTitle: r.exam.titleEn,
            score: r.score,
            totalScore: r.totalScore,
            percentage: r.percentage,
            passed: r.passed,
            submittedAt: r.submittedAt,
          })),
          quizResults: quizResults.map(r => ({
            quizId: r.quiz.id,
            contentId: r.quiz.content.id,
            contentTitle: r.quiz.content.titleEn,
            score: r.score,
            totalScore: r.totalScore,
            percentage: r.percentage,
            passed: r.passed,
            submittedAt: r.submittedAt,
          })),
        };
      })
    );

    res.json({
      success: true,
      data: {
        courseId,
        students: studentsProgress,
        totalStudents: studentsProgress.length,
      },
    });
  } catch (error) {
    console.error('Error in getCourseStudentsProgress:', error);
    next(error);
  }
};

/**
 * Get detailed progress for a specific student in a course (Admin/Teacher)
 */
export const getStudentCourseProgress = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;

    // Check if user is admin or teacher of this course
    if (req.user.role === ROLES.TEACHER) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });

      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this course progress',
        });
      }
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: ROLES.STUDENT },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        avatar: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if student purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!purchase || purchase.payment.status !== 'COMPLETED') {
      return res.status(404).json({
        success: false,
        message: 'Student has not purchased this course',
      });
    }

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        content: {
          orderBy: { order: 'asc' },
        },
        chapters: {
          include: {
            content: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        exams: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            duration: true,
            passingScore: true,
          },
        },
      },
    });

    // Get overall course progress
    const courseProgress = await prisma.progress.findFirst({
      where: {
        studentId,
        courseId,
        contentId: null,
      },
    });

    // Get all content progress
    const contentProgress = await prisma.progress.findMany({
      where: {
        studentId,
        courseId,
        contentId: { not: null },
      },
    });

    // Create progress map
    const progressMap = new Map();
    contentProgress.forEach(p => {
      progressMap.set(p.contentId, {
        progress: p.progress,
        completed: p.completed,
        updatedAt: p.updatedAt,
      });
    });

    // Get exam results
    const examResults = await prisma.examResult.findMany({
      where: {
        studentId,
        exam: {
          courseId,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            duration: true,
            passingScore: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Get quiz results
    const quizResults = await prisma.quizResult.findMany({
      where: {
        studentId,
        quiz: {
          content: {
            courseId,
          },
        },
      },
      include: {
        quiz: {
          include: {
            content: {
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Calculate statistics
    const totalVideos = course.content.filter(c => c.type === 'VIDEO').length;
    const completedVideos = contentProgress.filter(p => p.completed && course.content.find(c => c.id === p.contentId && c.type === 'VIDEO')).length;
    const totalExams = course.exams.length;
    const completedExams = examResults.filter(r => r.submittedAt).length;
    const passedExams = examResults.filter(r => r.passed).length;

    res.json({
      success: true,
      data: {
        student,
        course: {
          id: course.id,
          titleAr: course.titleAr,
          titleEn: course.titleEn,
        },
        purchasedAt: purchase.createdAt,
        overallProgress: courseProgress?.progress || 0,
        statistics: {
          totalVideos,
          completedVideos,
          totalExams,
          completedExams,
          passedExams,
        },
        contentProgress: course.content.map(c => ({
          id: c.id,
          titleAr: c.titleAr,
          titleEn: c.titleEn,
          type: c.type,
          progress: progressMap.get(c.id) || null,
        })),
        chaptersProgress: course.chapters.map(chapter => ({
          id: chapter.id,
          titleAr: chapter.titleAr,
          titleEn: chapter.titleEn,
          content: chapter.content.map(c => ({
            id: c.id,
            titleAr: c.titleAr,
            titleEn: c.titleEn,
            type: c.type,
            progress: progressMap.get(c.id) || null,
          })),
        })),
        examResults: examResults.map(r => ({
          examId: r.exam.id,
          examTitle: r.exam.titleEn,
          score: r.score,
          totalScore: r.totalScore,
          percentage: r.percentage,
          passed: r.passed,
          startedAt: r.startedAt,
          submittedAt: r.submittedAt,
        })),
        quizResults: quizResults.map(r => ({
          quizId: r.quiz.id,
          contentId: r.quiz.content.id,
          contentTitle: r.quiz.content.titleEn,
          score: r.score,
          totalScore: r.totalScore,
          percentage: r.percentage,
          passed: r.passed,
          submittedAt: r.submittedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getStudentCourseProgress:', error);
    next(error);
  }
};

/**
 * Get all courses progress for a specific student (Admin only)
 */
export const getStudentAllProgress = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Only admin can view all student progress
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all student progress',
      });
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: ROLES.STUDENT },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        email: true,
        avatar: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get all purchased courses
    const purchases = await prisma.purchase.findMany({
      where: {
        studentId,
        payment: {
          status: 'COMPLETED',
        },
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            coverImage: true,
            teacher: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    // Get progress for each course
    const coursesProgress = await Promise.all(
      purchases.map(async (purchase) => {
        const courseProgress = await prisma.progress.findFirst({
          where: {
            studentId,
            courseId: purchase.courseId,
            contentId: null,
          },
        });

        const contentProgress = await prisma.progress.count({
          where: {
            studentId,
            courseId: purchase.courseId,
            contentId: { not: null },
            completed: true,
          },
        });

        const examResults = await prisma.examResult.findMany({
          where: {
            studentId,
            exam: {
              courseId: purchase.courseId,
            },
          },
          select: {
            percentage: true,
            passed: true,
            submittedAt: true,
          },
        });

        return {
          course: purchase.course,
          purchasedAt: purchase.createdAt,
          progress: courseProgress?.progress || 0,
          completedContent: contentProgress,
          examResults: examResults.length,
          passedExams: examResults.filter(r => r.passed).length,
        };
      })
    );

    res.json({
      success: true,
      data: {
        student,
        courses: coursesProgress,
        totalCourses: coursesProgress.length,
      },
    });
  } catch (error) {
    console.error('Error in getStudentAllProgress:', error);
    next(error);
  }
};

























