import prisma from '../config/database.js';

/**
 * Get About App information (Public - Mobile)
 * GET /api/app/about
 */
export const getAboutApp = async (req, res, next) => {
  try {
    // Check if aboutApp model exists
    if (!prisma.aboutApp) {
      return res.status(404).json({
        success: false,
        message: 'About app information not found',
        messageAr: 'معلومات التطبيق غير موجودة',
      });
    }

    let aboutApp = null;
    
    try {
      aboutApp = await prisma.aboutApp.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        aboutApp = null;
      } else {
        throw dbError;
      }
    }

    if (!aboutApp) {
      return res.status(404).json({
        success: false,
        message: 'About app information not found',
        messageAr: 'معلومات التطبيق غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { aboutApp },
    });
  } catch (error) {
    console.error('Error in getAboutApp:', error);
    next(error);
  }
};

/**
 * Create About App (Admin only)
 * POST /api/admin/about-app
 */
export const createAboutApp = async (req, res, next) => {
  try {
    // Check if aboutApp model exists
    if (!prisma.aboutApp) {
      return res.status(500).json({
        success: false,
        message: 'About app feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة معلومات التطبيق غير متاحة',
      });
    }

    const { appName, description, version, whatsappPhone1, whatsappPhone2 } = req.body;

    if (!appName || !version) {
      return res.status(400).json({
        success: false,
        message: 'App name and version are required',
        messageAr: 'اسم التطبيق والإصدار مطلوبان',
      });
    }

    // Check if about app already exists
    let existing = null;
    try {
      existing = await prisma.aboutApp.findFirst();
    } catch (dbError) {
      // If table doesn't exist, we can still try to create
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('AboutApp table may not exist, attempting to create');
        existing = null;
      } else {
        throw dbError;
      }
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'About app information already exists. Use update instead.',
        messageAr: 'معلومات التطبيق موجودة بالفعل. استخدم التحديث بدلاً من ذلك.',
      });
    }

    let aboutApp;
    try {
      aboutApp = await prisma.aboutApp.create({
        data: {
          appName,
          description,
          version,
          whatsappPhone1,
          whatsappPhone2,
        },
      });
    } catch (dbError) {
      // If table doesn't exist, return helpful error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AboutApp table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول معلومات التطبيق غير موجود. يرجى تشغيل: npm run prisma:migrate',
        });
      }
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'About app information created successfully',
      messageAr: 'تم إنشاء معلومات التطبيق بنجاح',
      data: { aboutApp },
    });
  } catch (error) {
    console.error('Error in aboutAppController:', error);
    next(error);
  }
};

/**
 * Update About App (Admin only)
 * PUT /api/admin/about-app/:id
 */
export const updateAboutApp = async (req, res, next) => {
  try {
    // Check if aboutApp model exists
    if (!prisma.aboutApp) {
      return res.status(500).json({
        success: false,
        message: 'About app feature not available. Please run: npm run prisma:generate',
        messageAr: 'ميزة معلومات التطبيق غير متاحة',
      });
    }

    const { id } = req.params;
    const { appName, description, version, whatsappPhone1, whatsappPhone2 } = req.body;

    let aboutApp;
    try {
      aboutApp = await prisma.aboutApp.findUnique({
        where: { id },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AboutApp table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول معلومات التطبيق غير موجود',
        });
      }
      throw dbError;
    }

    if (!aboutApp) {
      return res.status(404).json({
        success: false,
        message: 'About app information not found',
        messageAr: 'معلومات التطبيق غير موجودة',
      });
    }

    let updatedAboutApp;
    try {
      updatedAboutApp = await prisma.aboutApp.update({
        where: { id },
        data: {
          ...(appName && { appName }),
          ...(description !== undefined && { description }),
          ...(version && { version }),
          ...(whatsappPhone1 !== undefined && { whatsappPhone1 }),
          ...(whatsappPhone2 !== undefined && { whatsappPhone2 }),
        },
      });
    } catch (dbError) {
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        return res.status(500).json({
          success: false,
          message: 'AboutApp table does not exist. Please run: npm run prisma:migrate',
          messageAr: 'جدول معلومات التطبيق غير موجود',
        });
      }
      throw dbError;
    }

    res.json({
      success: true,
      message: 'About app information updated successfully',
      messageAr: 'تم تحديث معلومات التطبيق بنجاح',
      data: { aboutApp: updatedAboutApp },
    });
  } catch (error) {
    console.error('Error in aboutAppController:', error);
    next(error);
  }
};

/**
 * Get About App (Admin - for editing)
 * GET /api/admin/about-app
 */
export const getAboutAppAdmin = async (req, res, next) => {
  try {
    // Check if aboutApp model exists
    if (!prisma.aboutApp) {
      console.warn('AboutApp model not found in Prisma client. Please run: npm run prisma:generate');
      return res.json({
        success: true,
        data: { aboutApp: null },
      });
    }

    let aboutApp = null;
    
    try {
      aboutApp = await prisma.aboutApp.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbError) {
      // If table doesn't exist, return null instead of error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('AboutApp table may not exist, returning null');
        aboutApp = null;
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { aboutApp },
    });
  } catch (error) {
    console.error('Error in getAboutAppAdmin:', error);
    next(error);
  }
};


