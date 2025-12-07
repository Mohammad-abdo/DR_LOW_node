import prisma from '../../config/database.js';
import { EXAM_TYPE } from '../../config/constants.js';

/**
 * Get quiz for a content item
 */
export const getQuizByContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;

    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!content || content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: { quiz: content.quiz },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create quiz for a content item
 */
export const createQuiz = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;
    const { titleAr, titleEn, passingScore, timeLimit } = req.body;

    if (!titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Title (Arabic and English) are required',
      });
    }

    // Check if content exists
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
    });

    if (!content || content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if quiz already exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { contentId },
    });

    if (existingQuiz) {
      return res.status(409).json({
        success: false,
        message: 'Quiz already exists for this content',
      });
    }

    const quiz = await prisma.quiz.create({
      data: {
        contentId,
        titleAr,
        titleEn,
        passingScore: passingScore ? parseFloat(passingScore) : 60,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update quiz
 */
export const updateQuiz = async (req, res, next) => {
  try {
    const { courseId, contentId, quizId } = req.params;
    const { titleAr, titleEn, passingScore, timeLimit } = req.body;

    // Verify content belongs to course
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
    });

    if (!content || content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    const updateData = {};
    if (titleAr) updateData.titleAr = titleAr;
    if (titleEn) updateData.titleEn = titleEn;
    if (passingScore !== undefined) updateData.passingScore = parseFloat(passingScore);
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit ? parseInt(timeLimit) : null;

    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: { quiz },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete quiz
 */
export const deleteQuiz = async (req, res, next) => {
  try {
    const { courseId, contentId, quizId } = req.params;

    // Verify content belongs to course
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
    });

    if (!content || content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add question to quiz
 */
export const addQuizQuestion = async (req, res, next) => {
  try {
    const { courseId, contentId, quizId } = req.params;
    const {
      type,
      questionAr,
      questionEn,
      options,
      correctAnswer,
      points,
      order,
    } = req.body;

    if (!type || !questionAr || !questionEn) {
      return res.status(400).json({
        success: false,
        message: 'Type, question (Arabic and English) are required',
      });
    }

    // Verify quiz exists and belongs to content
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { content: true },
    });

    if (!quiz || quiz.contentId !== contentId || quiz.content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const question = await prisma.quizQuestion.create({
      data: {
        quizId,
        type,
        questionAr,
        questionEn,
        options: options ? JSON.parse(options) : null,
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

/**
 * Update quiz question
 */
export const updateQuizQuestion = async (req, res, next) => {
  try {
    const { courseId, contentId, quizId, questionId } = req.params;
    const {
      type,
      questionAr,
      questionEn,
      options,
      correctAnswer,
      points,
      order,
    } = req.body;

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { content: true },
    });

    if (!quiz || quiz.contentId !== contentId || quiz.content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const updateData = {};
    if (type) updateData.type = type;
    if (questionAr) updateData.questionAr = questionAr;
    if (questionEn) updateData.questionEn = questionEn;
    if (options !== undefined) updateData.options = typeof options === 'string' ? JSON.parse(options) : options;
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
    if (points !== undefined) updateData.points = parseFloat(points);
    if (order !== undefined) updateData.order = parseInt(order);

    const question = await prisma.quizQuestion.update({
      where: { id: questionId },
      data: updateData,
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

/**
 * Delete quiz question
 */
export const deleteQuizQuestion = async (req, res, next) => {
  try {
    const { courseId, contentId, quizId, questionId } = req.params;

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { content: true },
    });

    if (!quiz || quiz.contentId !== contentId || quiz.content.courseId !== courseId) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    await prisma.quizQuestion.delete({
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

