import prisma from '../../../config/database.js';
import { EXAM_TYPE } from '../../../config/constants.js';
import { notifyExam } from '../../../services/notificationService.js';

export const getMyExams = async (req, res, next) => {
  try {
    // Get exams for courses the student has purchased
    const purchases = await prisma.purchase.findMany({
      where: {
        studentId: req.user.id,
        payment: {
          status: 'COMPLETED',
        },
      },
      select: {
        courseId: true,
      },
    });

    const courseIds = purchases.map(p => p.courseId);

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
          },
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

    // Check if student has access to this exam
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
          },
        },
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            questionAr: true,
            questionEn: true,
            options: true,
            points: true,
            order: true,
            // Don't include correct answer
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

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: exam.courseId,
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

    // Check if exam already taken
    const existingResult = await prisma.examResult.findUnique({
      where: {
        examId_studentId: {
          examId: id,
          studentId: req.user.id,
        },
      },
    });

    if (existingResult && existingResult.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted',
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

export const submitExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body; // Array of { questionId, answer }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required',
      });
    }

    // Get exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true,
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    // Check if already submitted
    const existingResult = await prisma.examResult.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: req.user.id,
        },
      },
    });

    if (existingResult && existingResult.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted',
      });
    }

    // Calculate score
    let totalScore = 0;
    let earnedScore = 0;
    const examAnswers = [];

    for (const question of exam.questions) {
      totalScore += parseFloat(question.points);
      const studentAnswer = answers.find(a => a.questionId === question.id);
      const answerText = studentAnswer?.answer || '';
      const isCorrect = answerText.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      const points = isCorrect ? parseFloat(question.points) : 0;
      earnedScore += points;

      examAnswers.push({
        questionId: question.id,
        answer: answerText,
        isCorrect,
        points,
      });
    }

    const percentage = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
    const passed = percentage >= parseFloat(exam.passingScore);

    // Create or update result
    let result;
    if (existingResult) {
      result = await prisma.examResult.update({
        where: { id: existingResult.id },
        data: {
          score: earnedScore,
          totalScore,
          percentage,
          passed,
          submittedAt: new Date(),
        },
      });
    } else {
      result = await prisma.examResult.create({
        data: {
          examId,
          studentId: req.user.id,
          score: earnedScore,
          totalScore,
          percentage,
          passed,
          startedAt: existingResult?.startedAt || new Date(),
          submittedAt: new Date(),
        },
      });
    }

    // Create answers
    await Promise.all(
      examAnswers.map(answer =>
        prisma.examAnswer.create({
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
      message: 'Exam submitted successfully',
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

export const getExamResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await prisma.examResult.findUnique({
      where: {
        examId_studentId: {
          examId: id,
          studentId: req.user.id,
        },
      },
      include: {
        exam: {
          include: {
            course: {
              select: {
                titleAr: true,
                titleEn: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionAr: true,
                questionEn: true,
                correctAnswer: true,
                points: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Exam result not found',
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



