import prisma from '../config/database.js';

/**
 * Get App Policies (Public - Mobile)
 * GET /api/app/policies
 * Query params: ?type=privacy_policy or ?type=terms_and_conditions
 */
export const getAppPolicies = async (req, res, next) => {
  try {
    const { type } = req.query;

    if (type) {
      // Get specific policy type
      const policy = await prisma.appPolicy.findUnique({
        where: { type },
      });

      if (!policy) {
        return res.status(404).json({
          success: false,
          message: `Policy type '${type}' not found`,
          messageAr: `نوع السياسة '${type}' غير موجود`,
        });
      }

      return res.json({
        success: true,
        data: { policy },
      });
    }

    // Get all policies
    const policies = await prisma.appPolicy.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { policies },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all App Policies (Admin)
 * GET /api/admin/policies
 */
export const getAllAppPolicies = async (req, res, next) => {
  try {
    const policies = await prisma.appPolicy.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { policies },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create App Policy (Admin only)
 * POST /api/admin/policies
 */
export const createAppPolicy = async (req, res, next) => {
  try {
    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({
        success: false,
        message: 'Type and content are required',
        messageAr: 'النوع والمحتوى مطلوبان',
      });
    }

    // Validate policy type
    const validTypes = ['privacy_policy', 'terms_and_conditions'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid policy type. Must be one of: ${validTypes.join(', ')}`,
        messageAr: `نوع السياسة غير صحيح. يجب أن يكون واحداً من: ${validTypes.join(', ')}`,
      });
    }

    // Check if policy type already exists
    const existing = await prisma.appPolicy.findUnique({
      where: { type },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Policy type '${type}' already exists. Use update instead.`,
        messageAr: `نوع السياسة '${type}' موجود بالفعل. استخدم التحديث بدلاً من ذلك.`,
      });
    }

    const policy = await prisma.appPolicy.create({
      data: {
        type,
        content,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      messageAr: 'تم إنشاء السياسة بنجاح',
      data: { policy },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update App Policy (Admin only)
 * PUT /api/admin/policies/:id
 */
export const updateAppPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        messageAr: 'المحتوى مطلوب',
      });
    }

    const policy = await prisma.appPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        messageAr: 'السياسة غير موجودة',
      });
    }

    const updatedPolicy = await prisma.appPolicy.update({
      where: { id },
      data: { content },
    });

    res.json({
      success: true,
      message: 'Policy updated successfully',
      messageAr: 'تم تحديث السياسة بنجاح',
      data: { policy: updatedPolicy },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete App Policy (Admin only)
 * DELETE /api/admin/policies/:id
 */
export const deleteAppPolicy = async (req, res, next) => {
  try {
    const { id } = req.params;

    const policy = await prisma.appPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        messageAr: 'السياسة غير موجودة',
      });
    }

    await prisma.appPolicy.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Policy deleted successfully',
      messageAr: 'تم حذف السياسة بنجاح',
    });
  } catch (error) {
    next(error);
  }
};


