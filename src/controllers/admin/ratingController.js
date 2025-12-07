import prisma from '../../config/database.js';

export const getAllRatings = async (req, res, next) => {
  try {
    const { type, courseId, teacherId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let ratings = [];
    let total = 0;

    if (type === 'teacher' || teacherId) {
      const where = {};
      if (teacherId) where.teacherId = teacherId;

      [ratings, total] = await Promise.all([
        prisma.teacherRating.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            student: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                avatar: true,
              },
            },
            teacher: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.teacherRating.count({ where }),
      ]);
    } else {
      const where = {};
      if (courseId) where.courseId = courseId;

      [ratings, total] = await Promise.all([
        prisma.rating.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            student: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                avatar: true,
              },
            },
            course: {
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.rating.count({ where }),
      ]);
    }

    res.json({
      success: true,
      data: {
        ratings,
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

export const getRatingById = async (req, res, next) => {
  try {
    const { id, type } = req.params;

    let rating;
    if (type === 'teacher') {
      rating = await prisma.teacherRating.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              avatar: true,
            },
          },
          teacher: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
        },
      });
    } else {
      rating = await prisma.rating.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              avatar: true,
            },
          },
          course: {
            select: {
              id: true,
              titleAr: true,
              titleEn: true,
            },
          },
        },
      });
    }

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found',
      });
    }

    res.json({
      success: true,
      data: { rating },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRating = async (req, res, next) => {
  try {
    const { id, type } = req.params;

    if (type === 'teacher') {
      await prisma.teacherRating.delete({
        where: { id },
      });
    } else {
      await prisma.rating.delete({
        where: { id },
      });
    }

    res.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



