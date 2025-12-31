import prisma from '../../../config/database.js';
import { verifyAccessToken } from '../../../utils/jwt.js';

/**
 * Mobile Logout
 * POST /api/mobile/student/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const { logoutAllDevices } = req.body; // Optional: for logging out from all devices
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        // Add token to blacklist
        const expiresAt = new Date(decoded.exp * 1000);
        await prisma.tokenBlacklist.create({
          data: {
            token,
            expiresAt,
          },
        });
      }
    }

    if (req.user) {
      if (logoutAllDevices) {
        await prisma.user.update({
          where: { id: req.user.id },
          data: { refreshToken: null }, // Clear all refresh tokens
        });
      } else {
        // For single device logout, only blacklist the current access token
        // The refresh token will remain valid for other devices
      }
    }

    res.json({
      success: true,
      message: logoutAllDevices 
        ? 'Logged out from all devices successfully' 
        : 'Logged out successfully',
      messageAr: logoutAllDevices 
        ? 'تم تسجيل الخروج من جميع الأجهزة بنجاح' 
        : 'تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

















