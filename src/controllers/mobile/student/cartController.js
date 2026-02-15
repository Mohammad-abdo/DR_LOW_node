import prisma from '../../../config/database.js';
import { convertImageUrls } from '../../../utils/imageHelper.js';
import { notifyPurchase } from '../../../services/notificationService.js';

/**
 * Auto-approve course request and enroll student (add course to student's courses).
 * Creates/updates CourseRequest to approved and creates Purchase.
 */
async function autoApproveAndEnroll(studentId, courseId, course) {
  const existingPurchase = await prisma.purchase.findUnique({
    where: {
      studentId_courseId: { studentId, courseId },
    },
  });
  if (existingPurchase) {
    const existing = await prisma.courseRequest.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing && existing.status !== 'approved') {
      await prisma.courseRequest.update({
        where: { id: existing.id },
        data: { status: 'approved' },
      });
    }
    return;
  }
  const amount = course?.finalPrice ?? course?.price ?? 0;
  await prisma.$transaction(async (tx) => {
    const existingReq = await tx.courseRequest.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existingReq) {
      await tx.courseRequest.update({
        where: { id: existingReq.id },
        data: { status: 'approved', rejectionReason: null },
      });
    } else {
      await tx.courseRequest.create({
        data: { studentId, courseId, status: 'approved' },
      });
    }
    await tx.purchase.create({
      data: { studentId, courseId, amount },
    });
  });
  try {
    await notifyPurchase(studentId, courseId, parseFloat(amount));
  } catch (e) {
    console.error('Error sending approval notification:', e);
  }
}

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

    // Auto-convert existing cart items to course requests
    // This handles students who added courses before the auto-request feature
    if (cart.items && cart.items.length > 0) {
      try {
        for (const item of cart.items) {
          // Check if request already exists
          const existingRequest = await prisma.courseRequest.findUnique({
            where: {
              studentId_courseId: {
                studentId: req.user.id,
                courseId: item.courseId,
              },
            },
          });

          if (!existingRequest) {
            // Check if not already purchased
            const purchase = await prisma.purchase.findUnique({
              where: {
                studentId_courseId: {
                  studentId: req.user.id,
                  courseId: item.courseId,
                },
              },
            });

            if (!purchase) {
              // Auto-approve: create approved request and add course to student
              await autoApproveAndEnroll(req.user.id, item.courseId, item.course);
              console.log(`Auto-approved and enrolled for cart item: courseId=${item.courseId}, studentId=${req.user.id}`);
            }
          }
        }
      } catch (autoRequestError) {
        // Log but don't fail - cart should still be returned
        console.error('Error auto-creating requests for cart items:', autoRequestError);
      }
    }

    const total = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.course?.finalPrice || item.course?.price || 0);
      return sum + price;
    }, 0);

    // Convert all image paths to full URLs
    const cartWithFullUrls = convertImageUrls({
      ...cart,
      total,
    }, ['coverImage', 'avatar', 'image', 'videoUrl', 'fileUrl']);

    res.json({
      success: true,
      data: {
        cart: cartWithFullUrls,
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

    // Check if there's an approved request (student already enrolled)
    // Note: We allow adding to cart even if request is pending, 
    // because we'll handle it when creating/updating the request automatically
    const existingRequestCheck = await prisma.courseRequest.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
    });

    // Only block if request is already approved (student already enrolled)
    if (existingRequestCheck && existingRequestCheck.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Course already approved',
        messageAr: 'الدورة معتمدة بالفعل',
      });
    }
    
    // If pending or rejected, we'll handle it when adding to cart
    // This allows users to re-request rejected courses or keep pending ones

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
        messageAr: 'الدورة موجودة بالفعل في السلة',
      });
    }

    // Add to cart
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        courseId,
      },
    });

    // Auto-approve: add course directly to student's courses (no manual approval needed)
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { price: true, finalPrice: true },
      });
      if (course) {
        await autoApproveAndEnroll(req.user.id, courseId, course);
        console.log(`Auto-approved and enrolled for course ${courseId}, student ${req.user.id}`);
        // Remove from cart since course is now in student's courses
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id, courseId },
        });
      }
    } catch (requestError) {
      // Log error but don't fail the cart addition
      console.error('Error auto-approving course when adding to cart:', requestError);
      console.error('Course ID:', courseId, 'Student ID:', req.user.id);
    }

    res.json({
      success: true,
      message: 'Course added to your courses successfully',
      messageAr: 'تمت إضافة الدورة إلى دوراتك بنجاح',
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
 * Auto-approves requests and adds courses directly to student's courses.
 */
export const submitCart = async (req, res, next) => {
  try {
    console.log('=== submitCart called ===');
    console.log('Student ID:', req.user.id);
    console.log('Student email:', req.user.email);

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

    console.log('Cart found:', cart ? 'Yes' : 'No');
    console.log('Cart items count:', cart?.items?.length || 0);

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
        console.log(`Processing cart item: courseId=${item.courseId}, courseTitle=${item.course?.titleEn || item.course?.titleAr}`);
        
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
          console.log(`Course ${item.courseId} already purchased, skipping`);
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

        if (existingRequest && existingRequest.status === 'approved') {
          errors.push({
            courseId: item.courseId,
            courseTitle: item.course.titleEn || item.course.titleAr,
            error: 'Course already approved',
          });
          continue;
        }

        // Auto-approve: add course directly to student's courses
        console.log(`Auto-approving and enrolling for courseId=${item.courseId}`);
        await autoApproveAndEnroll(req.user.id, item.courseId, item.course);
        const requestAfter = await prisma.courseRequest.findUnique({
          where: {
            studentId_courseId: { studentId: req.user.id, courseId: item.courseId },
          },
        });
        if (requestAfter) requests.push(requestAfter);
        console.log(`Course request approved and enrolled: courseId=${item.courseId}`);
      } catch (itemError) {
        console.error(`Error processing cart item ${item.courseId}:`, itemError);
        errors.push({
          courseId: item.courseId,
          courseTitle: item.course.titleEn || item.course.titleAr,
          error: itemError.message,
        });
      }
    }

    console.log(`Total requests created: ${requests.length}, errors: ${errors.length}`);

    // Clear cart after successful submission
    if (requests.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      console.log('Cart cleared after submission');
    }

    const response = {
      success: true,
      message: `${requests.length} course(s) added to your courses successfully`,
      messageAr: `تمت إضافة ${requests.length} دورة إلى دوراتك بنجاح`,
      data: {
        requests,
        errors: errors.length > 0 ? errors : undefined,
      },
    };

    console.log('Response:', JSON.stringify({
      success: response.success,
      requestsCount: response.data.requests.length,
      errorsCount: response.data.errors?.length || 0
    }, null, 2));

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in submitCart:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};



