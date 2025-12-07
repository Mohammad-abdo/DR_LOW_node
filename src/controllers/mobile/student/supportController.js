import prisma from '../../../config/database.js';
import { TICKET_STATUS } from '../../../config/constants.js';

export const createTicket = async (req, res, next) => {
  try {
    const { title, message, attachments } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
        messageAr: 'العنوان والرسالة مطلوبان',
      });
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user.id,
        title,
        message,
        attachments: attachments || null,
        status: TICKET_STATUS.OPEN,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      messageAr: 'تم إنشاء تذكرة الدعم بنجاح',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
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

export const getHelpContent = async (req, res, next) => {
  try {
    // This could be stored in system_settings or database
    const helpContent = {
      faq: [
        {
          questionAr: 'كيف يمكنني شراء دورة؟',
          questionEn: 'How can I purchase a course?',
          answerAr: 'يمكنك إضافة الدورة إلى السلة ثم إتمام عملية الدفع.',
          answerEn: 'You can add the course to your cart and then complete the payment process.',
        },
        {
          questionAr: 'كيف أتابع تقدمي في الدورة؟',
          questionEn: 'How can I track my progress in a course?',
          answerAr: 'يمكنك متابعة تقدمك من صفحة "دوراتي" حيث يتم تحديث التقدم تلقائياً.',
          answerEn: 'You can track your progress from the "My Courses" page where progress is updated automatically.',
        },
        {
          questionAr: 'ماذا أفعل إذا واجهت مشكلة تقنية؟',
          questionEn: 'What should I do if I encounter a technical issue?',
          answerAr: 'يمكنك إنشاء تذكرة دعم من صفحة المساعدة والدعم.',
          answerEn: 'You can create a support ticket from the Help & Support page.',
        },
      ],
      contact: {
        email: 'support@lms.edu.kw',
        phone: '+96512345678',
        hoursAr: 'من السبت إلى الخميس: 9 صباحاً - 5 مساءً',
        hoursEn: 'Saturday to Thursday: 9 AM - 5 PM',
      },
    };

    res.json({
      success: true,
      data: helpContent,
    });
  } catch (error) {
    next(error);
  }
};

