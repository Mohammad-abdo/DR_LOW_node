import prisma from '../../../config/database.js';
import { EXAM_TYPE } from '../../../config/constants.js';
import { notifyExam } from '../../../services/notificationService.js';

/**
 * Get all exams for a specific course by courseID
 * GET /api/mobile/student/exams/course/:courseID
 */
export const getExamsByCourseId = async (req, res, next) => {
  try {
    const { courseID } = req.params;

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: courseID,
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
        messageAr: 'الدورة غير مشتراة',
      });
    }

    // Get all exams for this course
    const exams = await prisma.exam.findMany({
      where: {
        courseId: courseID,
      },
      include: {
        questions: {
          select: {
            type: true,
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

    // Format response according to specification
    const formattedExams = exams.map(exam => {
      // Get unique exam types from questions
      const types = exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0
        ? [...new Set(exam.questions.map(q => {
            // Map database types to API types
            if (q.type === 'MCQ') return 'multiple-choice';
            if (q.type === 'TRUE_FALSE') return 'true-false';
            if (q.type === 'ESSAY') return 'essay';
            return q.type.toLowerCase();
          }))]
        : [];

      return {
        examID: exam.id,
        title: exam.titleEn || exam.titleAr,
        titleAr: exam.titleAr,
        titleEn: exam.titleEn,
        description: exam.descriptionEn || exam.descriptionAr,
        descriptionAr: exam.descriptionAr,
        descriptionEn: exam.descriptionEn,
        types,
        questionsCount: exam._count.questions,
        duration: exam.duration,
        passingScore: exam.passingScore,
        startDate: exam.startDate,
        endDate: exam.endDate,
        result: exam.results && exam.results.length > 0 ? exam.results[0] : null,
      };
    });

    res.json({
      success: true,
      data: formattedExams,
    });
  } catch (error) {
    console.error('Error in getExamsByCourseId:', error);
    next(error);
  }
};

export const getMyExams = async (req, res, next) => {
  try {
    console.log('📝 Fetching exams for student:', req.user.id);
    
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

    console.log('🛒 Purchases found:', purchases.length);
    const courseIds = purchases.map(p => p.courseId);

    // If no purchased courses, return empty array
    if (courseIds.length === 0) {
      console.log('⚠️ No purchased courses found');
      return res.json({
        success: true,
        data: { exams: [] },
        message: 'No exams available. Please purchase courses first.',
        messageAr: 'لا توجد امتحانات متاحة. يرجى شراء الكورسات أولاً.',
      });
    }

    console.log('📚 Course IDs:', courseIds);

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

    console.log('✅ Exams found:', exams.length);

    res.json({
      success: true,
      data: { exams },
    });
  } catch (error) {
    console.error('❌ Error in getMyExams:', error);
    next(error);
  }
};

/**
 * Get exam details with all questions (for taking the exam)
 * GET /api/mobile/student/exams/:id
 * 
 * This endpoint returns:
 * - Exam information (title, description, duration, etc.)
 * - All questions with their options (NO correct answers)
 * - Course information
 */
export const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get exam with all questions
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
          // Include all question fields EXCEPT correctAnswer
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        messageAr: 'الامتحان غير موجود',
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
        messageAr: 'الدورة غير مشتراة',
      });
    }

    // Check if exam already submitted
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
        messageAr: 'تم إرسال الامتحان مسبقاً',
      });
    }

    // Get unique exam types from questions
    const types = exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0
      ? [...new Set(exam.questions.map(q => {
          if (q.type === 'MCQ') return 'multiple-choice';
          if (q.type === 'TRUE_FALSE') return 'true-false';
          if (q.type === 'ESSAY') return 'essay';
          return q.type.toLowerCase();
        }))]
      : [];

    // Format questions for mobile
    const formattedQuestions = exam.questions.map(q => {
      // Parse options if it's a string
      let parsedOptions = q.options;
      if (typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch (e) {
          parsedOptions = null;
        }
      }
      
      return {
        questionID: q.id,
        type: q.type === 'MCQ' ? 'multiple-choice' : 
              q.type === 'TRUE_FALSE' ? 'true-false' : 
              q.type === 'ESSAY' ? 'essay' : q.type.toLowerCase(),
        questionAr: q.questionAr,
        questionEn: q.questionEn,
        options: parsedOptions, // For MCQ: {a: {...}, b: {...}, c: {...}, d: {...}}
        points: parseFloat(q.points) || 0,
        order: q.order,
      };
    });

    // Format response
    const response = {
      success: true,
      data: {
        exam: {
          examID: exam.id,
          title: exam.titleEn || exam.titleAr,
          titleAr: exam.titleAr,
          titleEn: exam.titleEn,
          description: exam.descriptionEn || exam.descriptionAr,
          descriptionAr: exam.descriptionAr,
          descriptionEn: exam.descriptionEn,
          types, // Array: ["multiple-choice", "true-false", "essay"]
          questionsCount: exam.questions.length,
          duration: exam.duration, // in minutes
          passingScore: parseFloat(exam.passingScore) || 60,
          startDate: exam.startDate,
          endDate: exam.endDate,
          course: {
            courseID: exam.course.id,
            titleAr: exam.course.titleAr,
            titleEn: exam.course.titleEn,
          },
          questions: formattedQuestions, // All questions with options
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getExamById:', error);
    next(error);
  }
};

/**
 * Submit exam answers
 * POST /api/mobile/student/exams/:examId/submit
 * 
 * Request Body:
 * {
 *   "answers": [
 *     {
 *       "questionID": "question-uuid",
 *       "answerBody": "a" // or "true"/"false" for true-false, or text for essay
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "resultID": "result-uuid",
 *     "finalScore": 85.5,
 *     "score": 12.75,
 *     "totalScore": 15,
 *     "percentage": 85.5,
 *     "passed": true,
 *     "detailedResults": [...]
 *   }
 * }
 */
export const submitExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    // Validate input
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Answers are required and must be a non-empty array',
        messageAr: 'الإجابات مطلوبة ويجب أن تكون مصفوفة غير فارغة',
      });
    }

    // Get exam with all questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
        messageAr: 'الامتحان غير موجود',
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
        messageAr: 'الدورة غير مشتراة',
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
        messageAr: 'تم إرسال الامتحان مسبقاً',
      });
    }

    // Calculate score and detailed results
    let totalScore = 0;
    let earnedScore = 0;
    const detailedResults = [];
    const examAnswers = [];

    for (const question of exam.questions) {
      totalScore += parseFloat(question.points);
      
      // Find student answer for this question
      const studentAnswerData = answers.find(a => a.questionID === question.id);
      let studentAnswer = '';
      let isCorrect = false;

      if (studentAnswerData) {
        // Handle different answer formats
        if (typeof studentAnswerData.answerBody === 'string') {
          studentAnswer = studentAnswerData.answerBody.trim();
        } else if (Array.isArray(studentAnswerData.answerBody)) {
          studentAnswer = JSON.stringify(studentAnswerData.answerBody);
        } else {
          studentAnswer = String(studentAnswerData.answerBody || '');
        }
      }

      // Compare answers based on question type
      if (question.type === 'MCQ') {
        // For MCQ, compare as strings (index or option text)
        const normalizedStudent = studentAnswer.toLowerCase().trim();
        const normalizedCorrect = question.correctAnswer.toString().toLowerCase().trim();
        isCorrect = normalizedStudent === normalizedCorrect;
      } else if (question.type === 'TRUE_FALSE') {
        // For TRUE_FALSE, normalize both answers
        const normalizedStudent = studentAnswer.toLowerCase().trim();
        const normalizedCorrect = question.correctAnswer.toString().toLowerCase().trim();
        isCorrect = normalizedStudent === normalizedCorrect || 
                   (normalizedStudent === 'true' && normalizedCorrect === '1') ||
                   (normalizedStudent === 'false' && normalizedCorrect === '0') ||
                   (normalizedStudent === '1' && normalizedCorrect === 'true') ||
                   (normalizedStudent === '0' && normalizedCorrect === 'false');
      } else if (question.type === 'ESSAY') {
        // For ESSAY, check if answer is not empty (manual grading later)
        isCorrect = studentAnswer.trim().length > 0;
      }

      const points = isCorrect ? parseFloat(question.points) : 0;
      earnedScore += points;

      // Format correct answer for response
      let correctAnswerFormatted = question.correctAnswer;
      if (question.type === 'MCQ' && question.options) {
        // If MCQ with options, try to get the option text
        try {
          const options = typeof question.options === 'string' 
            ? JSON.parse(question.options) 
            : question.options;
          
          if (options && typeof options === 'object') {
            // Handle different option formats
            if (Array.isArray(options)) {
              const correctIndex = parseInt(question.correctAnswer);
              if (!isNaN(correctIndex) && options[correctIndex]) {
                correctAnswerFormatted = options[correctIndex].textEn || 
                                        options[correctIndex].textAr || 
                                        question.correctAnswer;
              }
            } else {
              // Object format: {a: {...}, b: {...}}
              const correctKey = question.correctAnswer.toLowerCase();
              if (options[correctKey]) {
                correctAnswerFormatted = options[correctKey].en || 
                                        options[correctKey].ar || 
                                        question.correctAnswer;
              }
            }
          }
        } catch (e) {
          // Keep original correctAnswer if parsing fails
          console.warn('Error parsing options:', e);
        }
      }

      detailedResults.push({
        questionID: question.id,
        yourAnswer: studentAnswer,
        correctAnswer: correctAnswerFormatted,
        isCorrect,
        points: parseFloat(question.points),
        earnedPoints: points,
      });

      examAnswers.push({
        questionId: question.id,
        answer: studentAnswer,
        isCorrect,
        points,
      });
    }

    const finalScore = totalScore > 0 ? (earnedScore / totalScore) * 100 : 0;
    const passed = finalScore >= parseFloat(exam.passingScore);

    // Create result
    const result = await prisma.examResult.create({
      data: {
        examId,
        studentId: req.user.id,
        score: earnedScore,
        totalScore,
        percentage: finalScore,
        passed,
        startedAt: new Date(),
        submittedAt: new Date(),
      },
    });

    // Create answer records
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

    // Send notification
    try {
      await notifyExam(req.user.id, exam.id, passed, finalScore);
    } catch (notifError) {
      console.warn('Failed to send notification:', notifError);
    }

    // Return response
    res.json({
      success: true,
      message: 'Exam submitted successfully',
      messageAr: 'تم إرسال الامتحان بنجاح',
      data: {
        resultID: result.id,
        finalScore: parseFloat(finalScore.toFixed(2)),
        score: parseFloat(earnedScore.toFixed(2)),
        totalScore: parseFloat(totalScore.toFixed(2)),
        percentage: parseFloat(finalScore.toFixed(2)),
        passed: passed,
        detailedResults: detailedResults,
      },
    });
  } catch (error) {
    console.error('Error in submitExam:', error);
    next(error);
  }
};

/**
 * Get exam result (after submission)
 * GET /api/mobile/student/exams/:id/result
 */
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
                type: true,
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
        messageAr: 'نتيجة الامتحان غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { result },
    });
  } catch (error) {
    console.error('Error in getExamResult:', error);
    next(error);
  }
};
