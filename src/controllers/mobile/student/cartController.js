import prisma from '../../../config/database.js';
import { convertImageUrls } from '../../../utils/imageHelper.js';

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
              // Create course request
              await prisma.courseRequest.create({
                data: {
                  studentId: req.user.id,
                  courseId: item.courseId,
                  status: 'pending',
                },
              });
              console.log(`Auto-created course request for cart item: courseId=${item.courseId}, studentId=${req.user.id}`);
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

    // Automatically create course request when adding to cart
    // This makes it easier for mobile users - no need for separate submit step
    try {
      // Check if request already exists (might have been rejected before)
      const existingRequest = await prisma.courseRequest.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId,
          },
        },
      });

      if (existingRequest) {
        if (existingRequest.status === 'rejected') {
          // Update rejected request to pending (user re-requesting)
          await prisma.courseRequest.update({
            where: { id: existingRequest.id },
            data: {
              status: 'pending',
              rejectionReason: null,
            },
          });
          console.log(`Updated rejected request ${existingRequest.id} to pending for course ${courseId}`);
        } else if (existingRequest.status === 'pending') {
          // Request already pending, just log it
          console.log(`Course request already pending: ${existingRequest.id} for course ${courseId}`);
        }
        // If approved, it was already blocked above
      } else {
        // Create new course request
        const courseRequest = await prisma.courseRequest.create({
          data: {
            studentId: req.user.id,
            courseId,
            status: 'pending',
          },
        });
        console.log(`Created course request ${courseRequest.id} for course ${courseId} and student ${req.user.id}`);
      }
    } catch (requestError) {
      // Log error but don't fail the cart addition
      // This ensures cart still works even if course request creation fails
      console.error('Error creating course request when adding to cart:', requestError);
      console.error('Course ID:', courseId, 'Student ID:', req.user.id);
    }

    res.json({
      success: true,
      message: 'Course added to cart successfully',
      messageAr: 'تم إضافة الدورة إلى السلة بنجاح',
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

        if (existingRequest) {
          console.log(`Course request already exists: status=${existingRequest.status}`);
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
            console.log(`Updating rejected request ${existingRequest.id} to pending`);
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
        console.log(`Creating new course request for courseId=${item.courseId}`);
        const courseRequest = await prisma.courseRequest.create({
          data: {
            studentId: req.user.id,
            courseId: item.courseId,
            status: 'pending',
          },
        });

        console.log(`Course request created successfully: id=${courseRequest.id}`);
        requests.push(courseRequest);
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
      message: `${requests.length} course request(s) submitted successfully`,
      messageAr: `تم تقديم ${requests.length} طلب دورة بنجاح`,
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



