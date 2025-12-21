import prisma from '../../../config/database.js';
import { generateVideoToken, verifyVideoToken } from '../../../models/VideoToken.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get secure video streaming token
 * GET /api/mobile/student/video/token/:contentId
 */
export const getVideoToken = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    // Get content and verify access
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        course: {
          include: {
            purchases: {
              where: {
                studentId: userId,
              },
            },
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
        messageAr: 'المحتوى غير موجود',
      });
    }

    // Check if content has video
    if (!content.videoUrl) {
      return res.status(404).json({
        success: false,
        message: 'Video not found for this content',
        messageAr: 'لا يوجد فيديو لهذا المحتوى',
      });
    }

    // Check course expiration
    const now = new Date();
    if (content.course.publishEndDate && new Date(content.course.publishEndDate) < now) {
      return res.status(403).json({
        success: false,
        message: 'Course has expired and is no longer accessible',
        messageAr: 'انتهت صلاحية الدورة ولم تعد متاحة',
      });
    }

    // Check if course is published
    if (content.course.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: 'Course is not published',
        messageAr: 'الدورة غير منشورة',
      });
    }

    // Check if student has access (purchased or is free)
    if (!content.isFree && content.course.purchases.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this video',
        messageAr: 'ليس لديك صلاحية للوصول إلى هذا الفيديو',
      });
    }

    // Generate secure token
    const token = generateVideoToken(userId, contentId, content.courseId);

    res.json({
      success: true,
      data: {
        token,
        expiresIn: 3600, // 1 hour in seconds
        streamUrl: `/api/mobile/student/video/stream/${contentId}?token=${token}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream video securely (token required)
 * GET /api/mobile/student/video/stream/:contentId?token=...
 */
export const streamVideo = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required',
        messageAr: 'الرمز المطلوب',
      });
    }

    // Verify token
    const decoded = verifyVideoToken(token);
    if (!decoded || decoded.contentId !== contentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        messageAr: 'رمز غير صحيح أو منتهي الصلاحية',
      });
    }

    // Get content and verify access
    const content = await prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        course: true,
      },
    });

    if (!content || !content.videoUrl) {
      return res.status(404).json({
        success: false,
        message: 'Video not found',
        messageAr: 'الفيديو غير موجود',
      });
    }

    // Check course expiration
    const now = new Date();
    if (content.course.publishEndDate && new Date(content.course.publishEndDate) < now) {
      return res.status(403).json({
        success: false,
        message: 'Course has expired',
        messageAr: 'انتهت صلاحية الدورة',
      });
    }

    // Verify user access
    if (decoded.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        messageAr: 'تم رفض الوصول',
      });
    }

    // Get video file path
    const videoPath = content.videoUrl.replace('/uploads/videos/', '');
    const fullPath = path.join(__dirname, '../../uploads/videos', videoPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found',
        messageAr: 'ملف الفيديو غير موجود',
      });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set headers to prevent download
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Disable download
    res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
    res.setHeader('X-Download-Options', 'noopen');

    if (range) {
      // Handle range requests for streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(fullPath, { start, end });

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      await pipeline(file, res);
    } else {
      // Stream entire file
      res.setHeader('Content-Length', fileSize);
      const file = fs.createReadStream(fullPath);
      await pipeline(file, res);
    }
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    }
  }
};







