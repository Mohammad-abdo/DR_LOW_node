import prisma from '../../../config/database.js';
import { COURSE_STATUS, COURSE_LEVEL } from '../../../config/constants.js';

export const getMyCourses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { teacherId: req.user.id };
    if (status) where.status = status;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
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
      where: { id, teacherId: req.user.id },
      include: {
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
      categoryId,
      price,
      discount = 0,
      level,
      status,
    } = req.body;

    const coverImage = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!titleAr || !titleEn || !categoryId || !price) {
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
        teacherId: req.user.id,
        categoryId,
        price: parseFloat(price),
        discount: parseFloat(discount),
        finalPrice,
        coverImage,
        level: level || COURSE_LEVEL.BEGINNER,
        status: status || COURSE_STATUS.DRAFT,
      },
      include: {
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
      categoryId,
      price,
      discount,
      level,
      status,
    } = req.body;

    const coverImage = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const course = await prisma.course.findUnique({
      where: { id, teacherId: req.user.id },
    });

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
    if (categoryId) updateData.categoryId = categoryId;
    if (price) updateData.price = parseFloat(price);
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (coverImage) updateData.coverImage = coverImage;
    if (level) updateData.level = level;
    if (status) updateData.status = status;

    if (price || discount !== undefined) {
      const finalPrice = (updateData.price || course.price) * (1 - (updateData.discount || course.discount) / 100);
      updateData.finalPrice = finalPrice;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
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

export const addCourseContent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      type,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      content,
      fileUrl,
      videoUrl,
      duration,
      order,
      isFree,
    } = req.body;

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId, teacherId: req.user.id },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (!type || !titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'Type, title (Arabic and English) are required',
      });
    }

    const courseContent = await prisma.courseContent.create({
      data: {
        courseId,
        type,
        titleAr,
        titleEn,
        descriptionAr,
        descriptionEn,
        content,
        fileUrl,
        videoUrl,
        duration: duration ? parseInt(duration) : null,
        order: order ? parseInt(order) : 0,
        isFree: isFree === 'true' || isFree === true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course content added successfully',
      data: { content: courseContent },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourseContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;
    const {
      type,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      content,
      fileUrl,
      videoUrl,
      duration,
      order,
      isFree,
    } = req.body;

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId, teacherId: req.user.id },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const courseContent = await prisma.courseContent.update({
      where: { id: contentId },
      data: {
        ...(type && { type }),
        ...(titleAr && { titleAr }),
        ...(titleEn && { titleEn }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(content !== undefined && { content }),
        ...(fileUrl !== undefined && { fileUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(isFree !== undefined && { isFree: isFree === 'true' || isFree === true }),
      },
    });

    res.json({
      success: true,
      message: 'Course content updated successfully',
      data: { content: courseContent },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourseContent = async (req, res, next) => {
  try {
    const { courseId, contentId } = req.params;

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId, teacherId: req.user.id },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await prisma.courseContent.delete({
      where: { id: contentId },
    });

    res.json({
      success: true,
      message: 'Course content deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



