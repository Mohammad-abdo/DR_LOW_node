import prisma from '../../config/database.js';
import { COURSE_STATUS, COURSE_LEVEL } from '../../config/constants.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const { status, level, categoryId, teacherId, page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (level) where.level = level;
    if (categoryId) where.categoryId = categoryId;
    if (teacherId) where.teacherId = teacherId;
    if (search) {
      where.OR = [
        { titleAr: { contains: search } },
        { titleEn: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          teacher: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        courses,
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

export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            email: true,
            avatar: true,
          },
        },
        category: true,
        content: {
          orderBy: { order: 'asc' },
        },
        exams: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
        _count: {
          select: {
            purchases: true,
            ratings: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      teacherId,
      categoryId,
      price,
      discount = 0,
      level,
      status,
      isBasic = false,
      isFeatured = false,
      targetYear,
    } = req.body;

    const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!titleAr || !titleEn || !teacherId || !categoryId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }

    const finalPrice = parseFloat(price) * (1 - parseFloat(discount) / 100);

    const course = await prisma.course.create({
      data: {
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        teacherId,
        categoryId,
        price: parseFloat(price),
        discount: parseFloat(discount),
        finalPrice,
        coverImage,
        level: level || COURSE_LEVEL.BEGINNER,
        status: status || COURSE_STATUS.DRAFT,
        isBasic: isBasic === 'true' || isBasic === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        targetYear: targetYear ? parseInt(targetYear) : null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      teacherId,
      categoryId,
      price,
      discount,
      level,
      status,
      isBasic,
      isFeatured,
      targetYear,
    } = req.body;

    const coverImage = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const updateData = {};
    if (titleAr) updateData.titleAr = titleAr;
    if (titleEn) updateData.titleEn = titleEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (teacherId) updateData.teacherId = teacherId;
    if (categoryId) updateData.categoryId = categoryId;
    if (price) updateData.price = parseFloat(price);
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (coverImage) updateData.coverImage = coverImage;
    if (level) updateData.level = level;
    if (status) updateData.status = status;
    if (isBasic !== undefined) updateData.isBasic = isBasic === 'true' || isBasic === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (targetYear !== undefined) updateData.targetYear = targetYear ? parseInt(targetYear) : null;

    if (price || discount !== undefined) {
      const finalPrice = (updateData.price || course.price) * (1 - (updateData.discount || course.discount) / 100);
      updateData.finalPrice = finalPrice;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        category: {
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
      message: 'Course updated successfully',
      data: { course: updatedCourse },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



