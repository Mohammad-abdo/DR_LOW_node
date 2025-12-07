import prisma from '../../../config/database.js';

export const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
      where: { studentId: req.user.id },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                nameAr: true,
                nameEn: true,
                avatar: true,
              },
            },
            category: {
              select: {
                nameAr: true,
                nameEn: true,
              },
            },
            _count: {
              select: {
                purchases: true,
                ratings: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { wishlist },
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Course already in wishlist',
      });
    }

    await prisma.wishlistItem.create({
      data: {
        studentId: req.user.id,
        courseId,
      },
    });

    res.json({
      success: true,
      message: 'Course added to wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    await prisma.wishlistItem.deleteMany({
      where: {
        studentId: req.user.id,
        courseId,
      },
    });

    res.json({
      success: true,
      message: 'Course removed from wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
};



