import prisma from '../config/database.js';

/**
 * Get About App information (Public - Mobile)
 * GET /api/app/about
 */
export const getAboutApp = async (req, res, next) => {
  try {
    const aboutApp = await prisma.aboutApp.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

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
    next(error);
  }
};

/**
 * Create About App (Admin only)
 * POST /api/admin/about-app
 */
export const createAboutApp = async (req, res, next) => {
  try {
    const { appName, description, version, whatsappPhone1, whatsappPhone2 } = req.body;

    if (!appName || !version) {
      return res.status(400).json({
        success: false,
        message: 'App name and version are required',
        messageAr: 'اسم التطبيق والإصدار مطلوبان',
      });
    }

    // Check if about app already exists
    const existing = await prisma.aboutApp.findFirst();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'About app information already exists. Use update instead.',
        messageAr: 'معلومات التطبيق موجودة بالفعل. استخدم التحديث بدلاً من ذلك.',
      });
    }

    const aboutApp = await prisma.aboutApp.create({
      data: {
        appName,
        description,
        version,
        whatsappPhone1,
        whatsappPhone2,
      },
    });

    res.status(201).json({
      success: true,
      message: 'About app information created successfully',
      messageAr: 'تم إنشاء معلومات التطبيق بنجاح',
      data: { aboutApp },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update About App (Admin only)
 * PUT /api/admin/about-app/:id
 */
export const updateAboutApp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appName, description, version, whatsappPhone1, whatsappPhone2 } = req.body;

    const aboutApp = await prisma.aboutApp.findUnique({
      where: { id },
    });

    if (!aboutApp) {
      return res.status(404).json({
        success: false,
        message: 'About app information not found',
        messageAr: 'معلومات التطبيق غير موجودة',
      });
    }

    const updatedAboutApp = await prisma.aboutApp.update({
      where: { id },
      data: {
        ...(appName && { appName }),
        ...(description !== undefined && { description }),
        ...(version && { version }),
        ...(whatsappPhone1 !== undefined && { whatsappPhone1 }),
        ...(whatsappPhone2 !== undefined && { whatsappPhone2 }),
      },
    });

    res.json({
      success: true,
      message: 'About app information updated successfully',
      messageAr: 'تم تحديث معلومات التطبيق بنجاح',
      data: { aboutApp: updatedAboutApp },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get About App (Admin - for editing)
 * GET /api/admin/about-app
 */
export const getAboutAppAdmin = async (req, res, next) => {
  try {
    const aboutApp = await prisma.aboutApp.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { aboutApp },
    });
  } catch (error) {
    next(error);
  }
};


