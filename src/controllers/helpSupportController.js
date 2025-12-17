import prisma from '../config/database.js';

/**
 * Get Help & Support information (Public - Mobile)
 * GET /api/app/help-support
 */
export const getHelpSupport = async (req, res, next) => {
  try {
    const helpSupport = await prisma.helpSupport.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!helpSupport) {
      return res.status(404).json({
        success: false,
        message: 'Help & support information not found',
        messageAr: 'معلومات المساعدة والدعم غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { helpSupport },
    });
  } catch (error) {
    console.error('Error in helpSupportController:', error);
    next(error);
  }
};

/**
 * Get all Help & Support entries (Admin)
 * GET /api/admin/help-support
 */
export const getAllHelpSupport = async (req, res, next) => {
  try {
    // Check if helpSupport model exists
    if (!prisma.helpSupport) {
      console.warn('HelpSupport model not found in Prisma client. Please run: npm run prisma:generate');
      return res.json({
        success: true,
        data: { helpSupport: [] },
      });
    }

    let helpSupportList = [];
    
    try {
      helpSupportList = await prisma.helpSupport.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array instead of error
      if (dbError.code === 'P2021' || dbError.code === 'P2025') {
        console.warn('HelpSupport table may not exist, returning empty data');
        helpSupportList = [];
      } else {
        throw dbError;
      }
    }

    res.json({
      success: true,
      data: { helpSupport: helpSupportList },
    });
  } catch (error) {
    console.error('Error in helpSupportController:', error);
    next(error);
  }
};

/**
 * Create Help & Support (Admin only)
 * POST /api/admin/help-support
 */
export const createHelpSupport = async (req, res, next) => {
  try {
    const { title, description, whatsappPhone1, whatsappPhone2 } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        messageAr: 'العنوان مطلوب',
      });
    }

    const helpSupport = await prisma.helpSupport.create({
      data: {
        title,
        description,
        whatsappPhone1,
        whatsappPhone2,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Help & support information created successfully',
      messageAr: 'تم إنشاء معلومات المساعدة والدعم بنجاح',
      data: { helpSupport },
    });
  } catch (error) {
    console.error('Error in helpSupportController:', error);
    next(error);
  }
};

/**
 * Update Help & Support (Admin only)
 * PUT /api/admin/help-support/:id
 */
export const updateHelpSupport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, whatsappPhone1, whatsappPhone2 } = req.body;

    const helpSupport = await prisma.helpSupport.findUnique({
      where: { id },
    });

    if (!helpSupport) {
      return res.status(404).json({
        success: false,
        message: 'Help & support information not found',
        messageAr: 'معلومات المساعدة والدعم غير موجودة',
      });
    }

    const updatedHelpSupport = await prisma.helpSupport.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(whatsappPhone1 !== undefined && { whatsappPhone1 }),
        ...(whatsappPhone2 !== undefined && { whatsappPhone2 }),
      },
    });

    res.json({
      success: true,
      message: 'Help & support information updated successfully',
      messageAr: 'تم تحديث معلومات المساعدة والدعم بنجاح',
      data: { helpSupport: updatedHelpSupport },
    });
  } catch (error) {
    console.error('Error in helpSupportController:', error);
    next(error);
  }
};

/**
 * Delete Help & Support (Admin only)
 * DELETE /api/admin/help-support/:id
 */
export const deleteHelpSupport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const helpSupport = await prisma.helpSupport.findUnique({
      where: { id },
    });

    if (!helpSupport) {
      return res.status(404).json({
        success: false,
        message: 'Help & support information not found',
        messageAr: 'معلومات المساعدة والدعم غير موجودة',
      });
    }

    await prisma.helpSupport.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Help & support information deleted successfully',
      messageAr: 'تم حذف معلومات المساعدة والدعم بنجاح',
    });
  } catch (error) {
    console.error('Error in helpSupportController:', error);
    next(error);
  }
};


