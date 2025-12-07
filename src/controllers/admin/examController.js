import prisma from '../../config/database.js';
import { EXAM_TYPE } from '../../config/constants.js';
import { notifyExam } from '../../services/notificationService.js';

export const getAllExams = async (req, res, next) => {
  try {
    const { courseId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (courseId) where.courseId = courseId;

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
              teacher: {
                select: {
                  nameAr: true,
                  nameEn: true,
                },
              },
            },
          },
          _count: {
            select: {
              questions: true,
              results: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exam.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        exams,
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

export const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
        results: {
          include: {
            student: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.json({
      success: true,
      data: { exam },
    });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const {
      courseId,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      duration,
      passingScore,
      startDate,
      endDate,
    } = req.body;

    if (!courseId || !titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, title (Arabic and English) are required',
      });
    }

    const exam = await prisma.exam.create({
      data: {
        courseId,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        duration: duration ? parseInt(duration) : null,
        passingScore: passingScore ? parseFloat(passingScore) : 60,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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

    // Notify all students enrolled in the course
    try {
      const enrollments = await prisma.purchase.findMany({
        where: {
          courseId,
          payment: {
            status: 'COMPLETED',
          },
        },
        select: {
          studentId: true,
        },
      });

      const studentIds = enrollments.map(e => e.studentId);
      if (studentIds.length > 0) {
        await Promise.all(
          studentIds.map(studentId =>
            notifyExam(studentId, exam.id, courseId)
          )
        );
      }
    } catch (notifError) {
      console.error('Error sending exam notifications:', notifError);
      // Don't fail exam creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      messageAr: 'تم إنشاء الامتحان بنجاح',
      data: { exam },
    });
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      duration,
      passingScore,
      startDate,
      endDate,
    } = req.body;

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(titleAr && { titleAr }),
        ...(titleEn && { titleEn }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(passingScore !== undefined && { passingScore: parseFloat(passingScore) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    res.json({
      success: true,
      message: 'Exam updated successfully',
      data: { exam },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.exam.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addExamQuestion = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const {
      type,
      questionAr,
      questionEn,
      options,
      correctAnswer,
      points,
      order,
    } = req.body;

    if (!type || !questionAr || !questionEn || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Type, question (Arabic and English), and correct answer are required',
      });
    }

    if (!Object.values(EXAM_TYPE).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam type',
      });
    }

    const question = await prisma.examQuestion.create({
      data: {
        examId,
        type,
        questionAr,
        questionEn,
        options: options || null,
        correctAnswer,
        points: points ? parseFloat(points) : 1,
        order: order ? parseInt(order) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

export const updateExamQuestion = async (req, res, next) => {
  try {
    const { examId, questionId } = req.params;
    const {
      type,
      questionAr,
      questionEn,
      options,
      correctAnswer,
      points,
      order,
    } = req.body;

    const question = await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        ...(type && { type }),
        ...(questionAr && { questionAr }),
        ...(questionEn && { questionEn }),
        ...(options !== undefined && { options }),
        ...(correctAnswer && { correctAnswer }),
        ...(points !== undefined && { points: parseFloat(points) }),
        ...(order !== undefined && { order: parseInt(order) }),
      },
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExamQuestion = async (req, res, next) => {
  try {
    const { examId, questionId } = req.params;

    await prisma.examQuestion.delete({
      where: { id: questionId },
    });

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



