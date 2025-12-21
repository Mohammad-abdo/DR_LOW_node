import prisma from '../../../config/database.js';
import { EXAM_TYPE } from '../../../config/constants.js';

/**
 * Get quiz for a specific content item
 */
export const getQuizByContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // Check if student has access to this content
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        course: {
          include: {
            purchases: {
              where: {
                studentId: req.user.id,
              },
            },
          },
        },
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if student has access to the course (admin approved)
    // No payment check needed - access is based on admin approval only
    if (content.course.purchases.length === 0 && !content.isFree) {
      return res.status(403).json({
        success: false,
        message: 'Course not available. Please request access first.',
        messageAr: 'الدورة غير متاحة. يرجى طلب الوصول أولاً.',
      });
    }

    if (!content.quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found for this content',
      });
    }

    // Check if student already completed the quiz
    const existingResult = await prisma.quizResult.findUnique({
      where: {
        quizId_studentId: {
          quizId: content.quiz.id,
          studentId: req.user.id,
        },
      },
    });

    res.json({
      success: true,
      data: {
        quiz: {
          ...content.quiz,
          questions: content.quiz.questions.map(q => ({
            id: q.id,
            type: q.type,
            questionAr: q.questionAr,
            questionEn: q.questionEn,
            options: q.options,
            points: q.points,
            order: q.order,
            // Don't send correctAnswer to student
          })),
        },
        alreadyCompleted: !!existingResult,
        previousResult: existingResult ? {
          score: existingResult.score,
          totalScore: existingResult.totalScore,
          percentage: existingResult.percentage,
          passed: existingResult.passed,
          submittedAt: existingResult.submittedAt,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { answers } = req.body; // Array of { questionId, answer }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required',
      });
    }

    // Get content and quiz
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        course: {
          include: {
            purchases: {
              where: {
                studentId: req.user.id,
              },
            },
          },
        },
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!content || !content.quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    // Check if student has access to the course (admin approved)
    // No payment check needed - access is based on admin approval only
    if (content.course.purchases.length === 0 && !content.isFree) {
      return res.status(403).json({
        success: false,
        message: 'Course not available. Please request access first.',
        messageAr: 'الدورة غير متاحة. يرجى طلب الوصول أولاً.',
      });
    }

    // Check if already submitted
    const existingResult = await prisma.quizResult.findUnique({
      where: {
        quizId_studentId: {
          quizId: content.quiz.id,
          studentId: req.user.id,
        },
      },
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted',
        data: {
          result: {
            score: existingResult.score,
            totalScore: existingResult.totalScore,
            percentage: existingResult.percentage,
            passed: existingResult.passed,
          },
        },
      });
    }

    // Calculate score
    let totalScore = 0;
    let earnedScore = 0;
    const quizAnswers = [];

    for (const question of content.quiz.questions) {
      totalScore += parseFloat(question.points);
      const studentAnswer = answers.find(a => a.questionId === question.id);
      const answerText = studentAnswer?.answer || '';

      let isCorrect = false;
      if (question.type === 'MCQ') {
        // For MCQ, compare with correctAnswer index or text
        isCorrect = answerText.toString() === question.correctAnswer.toString();
      } else if (question.type === 'TRUE_FALSE') {
        isCorrect = answerText.toUpperCase().trim() === question.correctAnswer.toUpperCase().trim();
      } else {
        // For essay, we'll mark as correct for now (manual grading later)
        isCorrect = answerText.trim().length > 0;
      }

      const points = isCorrect ? parseFloat(question.points) : 0;
      earnedScore += points;

      quizAnswers.push({
        questionId: question.id,
        answer: answerText,
        isCorrect,
        points,
      });
    }

    const percentage = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
    const passed = percentage >= parseFloat(content.quiz.passingScore);

    // Create result
    const result = await prisma.quizResult.create({
      data: {
        quizId: content.quiz.id,
        studentId: req.user.id,
        score: earnedScore,
        totalScore,
        percentage,
        passed,
      },
    });

    // Create answers
    await Promise.all(
      quizAnswers.map(answer =>
        prisma.quizAnswer.create({
          data: {
            resultId: result.id,
            questionId: answer.questionId,
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            points: answer.points,
          },
        })
      )
    );

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        result: {
          score: earnedScore,
          totalScore,
          percentage,
          passed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz result
 */
export const getQuizResult = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        quiz: true,
      },
    });

    if (!content || !content.quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
    }

    const result = await prisma.quizResult.findUnique({
      where: {
        quizId_studentId: {
          quizId: content.quiz.id,
          studentId: req.user.id,
        },
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found',
      });
    }

    res.json({
      success: true,
      data: { result },
    });
  } catch (error) {
    next(error);
  }
};

