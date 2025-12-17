import prisma from '../../../config/database.js';

export const getCart = async (req, res, next) => {
  try {
    let cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
      include: {
        items: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    nameAr: true,
                    nameEn: true,
                  },
                },
                category: {
                  select: {
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: { studentId: req.user.id },
        include: {
          items: {
            include: {
              course: {
                include: {
                  teacher: {
                    select: {
                      nameAr: true,
                      nameEn: true,
                    },
                  },
                  category: {
                    select: {
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
    }

    const total = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.course?.finalPrice || item.course?.price || 0);
      return sum + price;
    }, 0);

    res.json({
      success: true,
      data: {
        cart: {
          ...cart,
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if already purchased
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
    });

    if (purchase) {
      return res.status(400).json({
        success: false,
        message: 'Course already purchased',
        messageAr: 'الدورة مسجلة بالفعل',
      });
    }

    // Check if there's a pending or approved request
    const existingRequest = await prisma.courseRequest.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
    });

    if (existingRequest && (existingRequest.status === 'pending' || existingRequest.status === 'approved')) {
      return res.status(400).json({
        success: false,
        message: existingRequest.status === 'pending' 
          ? 'Course request already pending' 
          : 'Course already approved',
        messageAr: existingRequest.status === 'pending'
          ? 'طلب الدورة قيد الانتظار بالفعل'
          : 'الدورة معتمدة بالفعل',
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { studentId: req.user.id },
      });
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_courseId: {
          cartId: cart.id,
          courseId,
        },
      },
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Course already in cart',
      });
    }

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId,
      },
    });

    res.json({
      success: true,
      message: 'Course added to cart successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        courseId,
      },
    });

    res.json({
      success: true,
      message: 'Course removed from cart successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      messageAr: 'تم مسح السلة بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Cart as Course Requests
 * POST /api/mobile/student/cart/submit
 * 
 * Converts all cart items into course requests with status "pending"
 */
export const submitCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { studentId: req.user.id },
      include: {
        items: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty',
        messageAr: 'السلة فارغة',
      });
    }

    const requests = [];
    const errors = [];

    // Create course requests for each cart item
    for (const item of cart.items) {
      try {
        // Check if already purchased
        const purchase = await prisma.purchase.findUnique({
          where: {
            studentId_courseId: {
              studentId: req.user.id,
              courseId: item.courseId,
            },
          },
        });

        if (purchase) {
          errors.push({
            courseId: item.courseId,
            courseTitle: item.course.titleEn || item.course.titleAr,
            error: 'Course already purchased',
          });
          continue;
        }

        // Check if request already exists
        const existingRequest = await prisma.courseRequest.findUnique({
          where: {
            studentId_courseId: {
              studentId: req.user.id,
              courseId: item.courseId,
            },
          },
        });

        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            errors.push({
              courseId: item.courseId,
              courseTitle: item.course.titleEn || item.course.titleAr,
              error: 'Request already pending',
            });
            continue;
          } else if (existingRequest.status === 'approved') {
            errors.push({
              courseId: item.courseId,
              courseTitle: item.course.titleEn || item.course.titleAr,
              error: 'Course already approved',
            });
            continue;
          } else if (existingRequest.status === 'rejected') {
            // Update rejected request to pending
            const updatedRequest = await prisma.courseRequest.update({
              where: { id: existingRequest.id },
              data: {
                status: 'pending',
                rejectionReason: null,
              },
            });
            requests.push(updatedRequest);
            continue;
          }
        }

        // Create new request
        const courseRequest = await prisma.courseRequest.create({
          data: {
            studentId: req.user.id,
            courseId: item.courseId,
            status: 'pending',
          },
        });

        requests.push(courseRequest);
      } catch (itemError) {
        errors.push({
          courseId: item.courseId,
          courseTitle: item.course.titleEn || item.course.titleAr,
          error: itemError.message,
        });
      }
    }

    // Clear cart after successful submission
    if (requests.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(201).json({
      success: true,
      message: `${requests.length} course request(s) submitted successfully`,
      messageAr: `تم تقديم ${requests.length} طلب دورة بنجاح`,
      data: {
        requests,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};



