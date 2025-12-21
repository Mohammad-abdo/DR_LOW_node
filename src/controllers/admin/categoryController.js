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

export const deleteCategories = async (req, res, next) => {
  try {
    const { ids } = req.body; // Array of category IDs
    const { reassignTo, force } = req.query;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs array is required',
        messageAr: 'مصفوفة معرفات الفئات مطلوبة',
      });
    }

    // Find all categories
    const categories = await prisma.category.findMany({
      where: { id: { in: ids } },
      include: {
        _count: { select: { courses: true } },
      },
    });

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No categories found',
        messageAr: 'لم يتم العثور على فئات',
      });
    }

    const categoriesWithCourses = categories.filter(c => c._count.courses > 0);
    const totalCourses = categoriesWithCourses.reduce((sum, c) => sum + c._count.courses, 0);

    // If any category has courses, handle them
    if (categoriesWithCourses.length > 0) {
      if (reassignTo) {
        const targetCategory = await prisma.category.findUnique({
          where: { id: reassignTo },
        });

        if (!targetCategory) {
          return res.status(404).json({
            success: false,
            message: 'Target category not found',
            messageAr: 'الفئة المستهدفة غير موجودة',
          });
        }

        if (ids.includes(reassignTo)) {
          return res.status(400).json({
            success: false,
            message: 'Cannot reassign to a category being deleted',
            messageAr: 'لا يمكن إعادة تعيين الدورات إلى فئة يتم حذفها',
          });
        }

        // Reassign all courses
        await prisma.course.updateMany({
          where: { categoryId: { in: ids } },
          data: { categoryId: reassignTo },
        });

        // Delete categories
        await prisma.category.deleteMany({
          where: { id: { in: ids } },
        });

        return res.json({
          success: true,
          message: `${categories.length} category(ies) deleted. ${totalCourses} course(s) reassigned to "${targetCategory.nameEn}"`,
          messageAr: `تم حذف ${categories.length} فئة. تم إعادة تعيين ${totalCourses} دورة إلى "${targetCategory.nameAr}"`,
        });
      }

      if (force === 'true') {
        await prisma.course.deleteMany({
          where: { categoryId: { in: ids } },
        });

        await prisma.category.deleteMany({
          where: { id: { in: ids } },
        });

        return res.json({
          success: true,
          message: `${categories.length} category(ies) and ${totalCourses} course(s) deleted`,
          messageAr: `تم حذف ${categories.length} فئة و ${totalCourses} دورة`,
          warning: 'All courses in these categories have been permanently deleted',
          warningAr: 'تم حذف جميع الدورات في هذه الفئات بشكل دائم',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Cannot delete categories. ${categoriesWithCourses.length} category(ies) contain ${totalCourses} course(s)`,
        messageAr: `لا يمكن حذف الفئات. ${categoriesWithCourses.length} فئة تحتوي على ${totalCourses} دورة`,
        data: {
          categoriesWithCourses: categoriesWithCourses.map(c => ({
            id: c.id,
            nameEn: c.nameEn,
            nameAr: c.nameAr,
            courseCount: c._count.courses,
          })),
        },
        options: {
          reassign: `Add ?reassignTo=<categoryId> to reassign courses`,
          force: `Add ?force=true to delete categories and all courses (WARNING: Permanent deletion)`,
        },
      });
    }

    // No courses, safe to delete
    await prisma.category.deleteMany({
      where: { id: { in: ids } },
    });

    res.json({
      success: true,
      message: `${categories.length} category(ies) deleted successfully`,
      messageAr: `تم حذف ${categories.length} فئة بنجاح`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reassignTo, force } = req.query; // reassignTo: category ID to reassign courses to, force: delete even with courses

    const category = await prisma.category.findUnique({
      where: { id },
      include: { 
        _count: { select: { courses: true } },
        courses: {
          select: { id: true, titleEn: true, titleAr: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        messageAr: 'الفئة غير موجودة',
      });
    }

    // If category has courses, handle them
    if (category._count.courses > 0) {
      // Option 1: Reassign courses to another category
      if (reassignTo) {
        // Verify target category exists
        const targetCategory = await prisma.category.findUnique({
          where: { id: reassignTo },
        });

        if (!targetCategory) {
          return res.status(404).json({
            success: false,
            message: 'Target category not found',
            messageAr: 'الفئة المستهدفة غير موجودة',
          });
        }

        if (reassignTo === id) {
          return res.status(400).json({
            success: false,
            message: 'Cannot reassign to the same category',
            messageAr: 'لا يمكن إعادة تعيين الدورات إلى نفس الفئة',
          });
        }

        // Reassign all courses to the target category
        await prisma.course.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        });

        // Now delete the category
        await prisma.category.delete({ where: { id } });

        return res.json({
          success: true,
          message: `Category deleted successfully. ${category._count.courses} course(s) reassigned to "${targetCategory.nameEn}"`,
          messageAr: `تم حذف الفئة بنجاح. تم إعادة تعيين ${category._count.courses} دورة إلى "${targetCategory.nameAr}"`,
          data: {
            deletedCategory: category.nameEn,
            reassignedCourses: category._count.courses,
            targetCategory: targetCategory.nameEn,
          },
        });
      }

      // Option 2: Force delete (delete courses too - DANGEROUS)
      if (force === 'true') {
        // Delete all courses in this category (cascade will handle related data)
        await prisma.course.deleteMany({
          where: { categoryId: id },
        });

        // Now delete the category
        await prisma.category.delete({ where: { id } });

        return res.json({
          success: true,
          message: `Category and ${category._count.courses} course(s) deleted successfully`,
          messageAr: `تم حذف الفئة و ${category._count.courses} دورة بنجاح`,
          warning: 'All courses in this category have been permanently deleted',
          warningAr: 'تم حذف جميع الدورات في هذه الفئة بشكل دائم',
        });
      }

      // Option 3: Return error with details
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${category._count.courses} course(s)`,
        messageAr: `لا يمكن حذف الفئة. تحتوي على ${category._count.courses} دورة`,
        data: {
          courseCount: category._count.courses,
          courses: category.courses.map(c => ({ id: c.id, titleEn: c.titleEn, titleAr: c.titleAr })),
        },
        options: {
          reassign: `Add ?reassignTo=<categoryId> to reassign courses to another category`,
          force: `Add ?force=true to delete category and all its courses (WARNING: This will permanently delete all courses)`,
        },
      });
    }

    // No courses, safe to delete
    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Category deleted successfully',
      messageAr: 'تم حذف الفئة بنجاح',
    });
  } catch (error) {
    next(error);
  }
};



