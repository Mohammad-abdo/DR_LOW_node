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
    console.error('Error in appPolicyController:', error);
    next(error);
  }
};

/**
 * Get all App Policies (Admin)
 * GET /api/admin/policies
 */
export const getAllAppPolicies = async (req, res, next) => {
  try {
    // Check if appPolicy model exists
    if (!prisma.appPolicy) {
      console.warn('AppPolicy model not found in Prisma client. Please run: npm run prisma:generate');
      return res.json({
        success: true,
        data: { policies: [] },
      });
    }

    let policies = [];
    
    try {
      policies = await prisma.appPolicy.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array instead of error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('AppPolicy table may not exist, returning empty data');
        policies = [];
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { policies },
    });
  } catch (error) {
    console.error('Error in appPolicyController:', error);
    next(error);
  }
};

/**
 * Create App Policy (Admin only)
 * POST /api/admin/policies
 */
export const createAppPolicy = async (req, res, next) => {
  try {
    // Check if appPolicy model exists
    if (!prisma.appPolicy) {
      return res.status(500).json({
        success: false,
        message: 'App policy feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة سياسات التطبيق غير متاحة',
      });
    }

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
    let existing = null;
    try {
      existing = await prisma.appPolicy.findUnique({
        where: { type },
      });
    } catch (dbError) {
      // If table doesn't exist, we can still try to create
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('AppPolicy table may not exist, attempting to create');
        existing = null;
      } else {
        throw dbError;
      }
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Policy type '${type}' already exists. Use update instead.`,
        messageAr: `نوع السياسة '${type}' موجود بالفعل. استخدم التحديث بدلاً من ذلك.`,
      });
    }

    let policy;
    try {
      policy = await prisma.appPolicy.create({
        data: {
          type,
          content,
        },
      });
    } catch (dbError) {
      // If table doesn't exist, return helpful error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AppPolicy table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول سياسات التطبيق غير موجود. يرجى تشغيل: npm run prisma:migrate',
        });
      }
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      messageAr: 'تم إنشاء السياسة بنجاح',
      data: { policy },
    });
  } catch (error) {
    console.error('Error in appPolicyController:', error);
    next(error);
  }
};

/**
 * Update App Policy (Admin only)
 * PUT /api/admin/policies/:id
 */
export const updateAppPolicy = async (req, res, next) => {
  try {
    // Check if appPolicy model exists
    if (!prisma.appPolicy) {
      return res.status(500).json({
        success: false,
        message: 'App policy feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة سياسات التطبيق غير متاحة',
      });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
        messageAr: 'المحتوى مطلوب',
      });
    }

    let policy;
    try {
      policy = await prisma.appPolicy.findUnique({
        where: { id },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AppPolicy table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول سياسات التطبيق غير موجود',
        });
      }
      throw dbError;
    }

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found',
        messageAr: 'السياسة غير موجودة',
      });
    }

    let updatedPolicy;
    try {
      updatedPolicy = await prisma.appPolicy.update({
        where: { id },
        data: { content },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AppPolicy table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول سياسات التطبيق غير موجود',
        });
      }
      throw dbError;
    }

    res.json({
      success: true,
      message: 'Policy updated successfully',
      messageAr: 'تم تحديث السياسة بنجاح',
      data: { policy: updatedPolicy },
    });
  } catch (error) {
    console.error('Error in appPolicyController:', error);
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
    console.error('Error in appPolicyController:', error);
    next(error);
  }
};


