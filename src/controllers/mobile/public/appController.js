import prisma from '../../../config/database.js';

/**
 * Get About App (Public - No Auth Required)
 * GET /api/mobile/public/about
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
 * Get Help & Support (Public - No Auth Required)
 * GET /api/mobile/public/help-support
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
    next(error);
  }
};

/**
 * Get Privacy Policy (Public - No Auth Required)
 * GET /api/mobile/public/privacy-policy
 */
export const getPrivacyPolicy = async (req, res, next) => {
  try {
    const policy = await prisma.appPolicy.findUnique({
      where: { type: 'privacy_policy' },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Privacy policy not found',
        messageAr: 'سياسة الخصوصية غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { policy },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Terms & Conditions (Public - No Auth Required)
 * GET /api/mobile/public/terms
 */
export const getTermsAndConditions = async (req, res, next) => {
  try {
    const policy = await prisma.appPolicy.findUnique({
      where: { type: 'terms_and_conditions' },
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Terms and conditions not found',
        messageAr: 'الشروط والأحكام غير موجودة',
      });
    }

    res.json({
      success: true,
      data: { policy },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Policies (Public - No Auth Required)
 * GET /api/mobile/public/policies
 */
export const getAllPolicies = async (req, res, next) => {
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

