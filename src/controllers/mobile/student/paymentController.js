import prisma from '../../../config/database.js';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../../../config/constants.js';
import { notifyPurchase } from '../../../services/notificationService.js';

export const createPayment = async (req, res, next) => {
  try {
    const { courseIds, paymentMethod, transactionId, metadata } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course IDs are required',
      });
    }

    if (!paymentMethod || !Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method is required',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
      include: {
        items: {
          where: {
            courseId: { in: courseIds },
          },
          include: {
            course: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items found in cart',
      });
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.course.finalPrice);
    }, 0);

    // Create purchases and payments
    const purchases = [];
    const payments = [];

    for (const item of cart.items) {
      // Check if already purchased
      const existingPurchase = await prisma.purchase.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: item.courseId,
          },
        },
      });

      if (existingPurchase) {
        continue; // Skip already purchased courses
      }

      // Create purchase
      const purchase = await prisma.purchase.create({
        data: {
          studentId: req.user.id,
          courseId: item.courseId,
          amount: item.course.finalPrice,
        },
      });

      purchases.push(purchase);

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          studentId: req.user.id,
          purchaseId: purchase.id,
          courseId: item.courseId,
          paymentMethod,
          transactionId,
          amount: item.course.finalPrice,
          status: paymentMethod === PAYMENT_METHOD.CASH || paymentMethod === PAYMENT_METHOD.BANK_TRANSFER
            ? PAYMENT_STATUS.PENDING
            : PAYMENT_STATUS.COMPLETED,
          metadata: metadata || {},
        },
      });

      payments.push(payment);

      // Send notification if payment completed
      if (payment.status === PAYMENT_STATUS.COMPLETED) {
        try {
          await notifyPurchase(req.user.id, item.courseId, parseFloat(item.course.finalPrice));
        } catch (notifError) {
          console.error('Error sending purchase notification:', notifError);
          // Don't fail the payment if notification fails
        }
      }
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        purchases,
        payments,
        totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { studentId: req.user.id };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          purchase: {
            include: {
              course: {
                select: {
                  id: true,
                  titleAr: true,
                  titleEn: true,
                  coverImage: true,
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



