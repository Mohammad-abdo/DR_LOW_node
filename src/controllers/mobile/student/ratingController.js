import prisma from '../../../config/database.js';

export const rateCourse = async (req, res, next) => {
  try {
    const { courseId, rating, commentAr, commentEn } = req.body;

    if (!courseId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Course ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if student has purchased the course
    const purchase = await prisma.purchase.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'Course must be available before rating',
      });
    }

    // Check if already rated
    const existing = await prisma.rating.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId,
        },
      },
    });

    let ratingRecord;
    if (existing) {
      ratingRecord = await prisma.rating.update({
        where: { id: existing.id },
        data: {
          rating,
          commentAr,
          commentEn,
          date: new Date(),
        },
      });
    } else {
      ratingRecord = await prisma.rating.create({
        data: {
          studentId: req.user.id,
          courseId,
          rating,
          commentAr,
          commentEn,
          date: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: 'Course rated successfully',
      data: { rating: ratingRecord },
    });
  } catch (error) {
    next(error);
  }
};

export const rateTeacher = async (req, res, next) => {
  try {
    const { teacherId, rating, commentAr, commentEn } = req.body;

    if (!teacherId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const existing = await prisma.teacherRating.findUnique({
      where: {
        studentId_teacherId: {
          studentId: req.user.id,
          teacherId,
        },
      },
    });

    let ratingRecord;
    if (existing) {
      ratingRecord = await prisma.teacherRating.update({
        where: { id: existing.id },
        data: {
          rating,
          commentAr,
          commentEn,
          date: new Date(),
        },
      });
    } else {
      ratingRecord = await prisma.teacherRating.create({
        data: {
          studentId: req.user.id,
          teacherId,
          rating,
          commentAr,
          commentEn,
          date: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: 'Teacher rated successfully',
      data: { rating: ratingRecord },
    });
  } catch (error) {
    next(error);
  }
};

