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
    });
  } catch (error) {
    next(error);
  }
};



