import prisma from '../../../config/database.js';
import { EXAM_TYPE } from '../../../config/constants.js';

export const getMyExams = async (req, res, next) => {
  try {
    // Get exams for courses created by teacher
    const courses = await prisma.course.findMany({
      where: { teacherId: req.user.id },
      select: { id: true },
    });

    const courseIds = courses.map(c => c.id);

    const exams = await prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
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
    });

    res.json({
      success: true,
      data: { exams },
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
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            teacherId: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            results: true,
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

    // Verify exam belongs to teacher's course
    if (exam.course.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
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

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId, teacherId: req.user.id },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
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
    });

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
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

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam || exam.course.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const updatedExam = await prisma.exam.update({
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
      data: { exam: updatedExam },
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

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam || exam.course.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

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

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam || exam.course.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

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

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam || exam.course.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

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

export const getExamResults = async (req, res, next) => {
  try {
    const { examId } = req.params;

    // Verify exam belongs to teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          select: {
            teacherId: true,
          },
        },
      },
    });

    if (!exam || exam.course.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const results = await prisma.examResult.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};



