import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const VIDEO_TOKEN_EXPIRY = 60 * 60 * 24 * 30; // 30 days (same as access token)

/**
 * Generate a secure token for video streaming
 * Token includes: userId, contentId, courseId, expiration
 */
export const generateVideoToken = (userId, contentId, courseId) => {
  const payload = {
    userId,
    contentId,
    courseId,
    type: 'video_stream',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: VIDEO_TOKEN_EXPIRY,
  });
};

/**
 * Verify video streaming token
 */
export const verifyVideoToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'video_stream') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate a signed URL for video access (alternative method)
 */
export const generateSignedVideoUrl = (videoPath, userId, contentId, courseId) => {
  const token = generateVideoToken(userId, contentId, courseId);
  const baseUrl = process.env.API_BASE_URL || 'https://dr-law.developteam.site';
  return `${baseUrl}/api/video/stream?token=${token}&contentId=${contentId}`;
};

