import prisma from '../../config/database.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { nameAr: { contains: search } },
        { nameEn: { contains: search } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { courses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        categories,
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

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        courses: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            status: true,
          },
        },
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { nameAr, nameEn, descriptionAr, descriptionEn, isBasic = false } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!nameAr || !nameEn) {
      return res.status(400).json({
        success: false,
        message: 'Name (Arabic and English) is required',
      });
    }

    const category = await prisma.category.create({
      data: {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        image,
        isBasic: isBasic === 'true' || isBasic === true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, descriptionAr, descriptionEn, isBasic } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const updateData = {};
    if (nameAr) updateData.nameAr = nameAr;
    if (nameEn) updateData.nameEn = nameEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (image) updateData.image = image;
    if (isBasic !== undefined) updateData.isBasic = isBasic === 'true' || isBasic === true;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (category._count.courses > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing courses',
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};



