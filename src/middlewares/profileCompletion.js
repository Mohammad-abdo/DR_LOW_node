import prisma from '../config/database.js';
import { ROLES } from '../config/constants.js';

/**
 * Middleware to check if student profile is complete
 * Returns 403 if profile is incomplete
 */
export const requireProfileCompletion = async (req, res, next) => {
  try {
    // Only check for students
    if (req.user.role !== ROLES.STUDENT) {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        nameAr: true,
        nameEn: true,
        phone: true,
        year: true,
        semester: true,
      },
    });

    // Check if all required fields are filled
    const isComplete = !!(
      user.nameAr &&
      user.nameEn &&
      user.phone &&
      user.year !== null &&
      user.semester !== null
    );

    if (!isComplete) {
      return res.status(403).json({
        success: false,
        message: 'Profile completion required',
        code: 'PROFILE_INCOMPLETE',
        data: {
          missingFields: {
            nameAr: !user.nameAr,
            nameEn: !user.nameEn,
            phone: !user.phone,
            year: user.year === null,
            semester: user.semester === null,
          },
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

