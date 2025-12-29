import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if a video file exists
 * GET /health/video/:path
 * Example: /health/video/videos/video-1234567890-123456789.mp4
 */
router.get('/video/*', (req, res) => {
  try {
    const videoPath = req.params[0]; // Get everything after /health/video/
    const fullPath = path.join(__dirname, '../../uploads', videoPath);
    const normalizedPath = path.normalize(fullPath);
    
    // Security check: ensure the path is within uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!normalizedPath.startsWith(path.resolve(uploadsDir))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        messageAr: 'تم رفض الوصول',
      });
    }
    
    // Check if file exists
    if (fs.existsSync(normalizedPath)) {
      const stats = fs.statSync(normalizedPath);
      res.json({
        success: true,
        exists: true,
        path: videoPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      });
    } else {
      res.status(404).json({
        success: false,
        exists: false,
        path: videoPath,
        message: 'File not found',
        messageAr: 'الملف غير موجود',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error checking file',
      messageAr: 'خطأ في التحقق من الملف',
    });
  }
});

export default router;





















