import prisma from '../../config/database.js';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../config/constants.js';

export const getAllPayments = async (req, res, next) => {
  try {
    const { status, method, studentId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (method) where.paymentMethod = method;
    if (studentId) where.studentId = studentId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          student: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              email: true,
            },
          },
          purchase: {
            include: {
              course: {
                select: {
                  id: true,
                  titleAr: true,
                  titleEn: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        payments,
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

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            phone: true,
          },
        },
        purchase: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    nameAr: true,
                    nameEn: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};



