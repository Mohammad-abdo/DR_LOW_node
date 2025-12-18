import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import prisma from '../../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

// Chunks directory
const chunksDir = path.join(__dirname, '../../uploads/chunks');
const videosDir = path.join(__dirname, '../../uploads/videos');

// Ensure directories exist
[chunksDir, videosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Upload video chunk
 * POST /api/admin/upload/video-chunk
 */
export const uploadChunk = async (req, res, next) => {
  try {
    const {
      dzuuid, // Dropzone unique identifier
      dzchunkindex, // Chunk index
      dztotalchunkcount, // Total chunks
      dztotalfilesize, // Total file size
      dzchunksize, // Chunk size
      dzchunkbyteoffset, // Chunk byte offset
    } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file chunk provided',
        messageAr: 'لم يتم توفير جزء من الملف',
      });
    }

    // Validate video mime type
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ];

    if (!allowedVideoTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only video files are allowed',
        messageAr: 'نوع الملف غير صحيح. يسمح فقط بملفات الفيديو',
      });
    }

    // Create chunk directory for this upload
    const chunkDir = path.join(chunksDir, dzuuid);
    if (!fs.existsSync(chunkDir)) {
      await mkdir(chunkDir, { recursive: true });
    }

    // Save chunk
    const chunkPath = path.join(chunkDir, `chunk-${dzchunkindex}`);
    await writeFile(chunkPath, file.buffer);

    // Check if all chunks are uploaded
    const chunkFiles = fs.readdirSync(chunkDir);
    const uploadedChunks = chunkFiles.filter(f => f.startsWith('chunk-')).length;

    if (uploadedChunks === parseInt(dztotalchunkcount)) {
      // All chunks uploaded, merge them
      const finalFileName = `${dzuuid}${path.extname(file.originalname)}`;
      const finalPath = path.join(videosDir, finalFileName);

      // Merge chunks to final file using a write stream to avoid loading all into memory
      const writeStream = fs.createWriteStream(finalPath);

      for (let i = 0; i < parseInt(dztotalchunkcount); i++) {
        const currentChunkPath = path.join(chunkDir, `chunk-${i}`);
        const chunkData = await readFile(currentChunkPath);
        writeStream.write(chunkData);
      }

      // Finish writing
      await new Promise((resolve, reject) => {
        writeStream.end(() => resolve());
        writeStream.on('error', reject);
      });

      // Clean up chunks directory
      for (let i = 0; i < parseInt(dztotalchunkcount); i++) {
        const currentChunkPath = path.join(chunkDir, `chunk-${i}`);
        if (await exists(currentChunkPath)) {
          await unlink(currentChunkPath);
        }
      }
      if (fs.existsSync(chunkDir)) {
        fs.rmdirSync(chunkDir);
      }

      // Return success with file path
      const videoUrl = `/uploads/videos/${finalFileName}`;

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        messageAr: 'تم رفع الفيديو بنجاح',
        data: {
          videoUrl,
          fileName: finalFileName,
          fileSize: dztotalfilesize,
        },
      });
    } else {
      // More chunks to come
      res.json({
        success: true,
        message: 'Chunk uploaded successfully',
        messageAr: 'تم رفع الجزء بنجاح',
        data: {
          uploadedChunks,
          totalChunks: parseInt(dztotalchunkcount),
        },
      });
    }
  } catch (error) {
    console.error('Error uploading chunk:', error);
    next(error);
  }
};

/**
 * Check chunk status (for resume)
 * GET /api/admin/upload/video-chunk-status
 */
export const getChunkStatus = async (req, res, next) => {
  try {
    const { dzuuid } = req.query;

    if (!dzuuid) {
      return res.status(400).json({
        success: false,
        message: 'Upload UUID is required',
        messageAr: 'معرف الرفع مطلوب',
      });
    }

    const chunkDir = path.join(chunksDir, dzuuid);
    
    if (!fs.existsSync(chunkDir)) {
      return res.json({
        success: true,
        data: {
          uploadedChunks: [],
          totalChunks: 0,
        },
      });
    }

    const chunkFiles = fs.readdirSync(chunkDir);
    const uploadedChunks = chunkFiles
      .filter(f => f.startsWith('chunk-'))
      .map(f => parseInt(f.replace('chunk-', '')))
      .sort((a, b) => a - b);

    res.json({
      success: true,
      data: {
        uploadedChunks,
        totalChunks: uploadedChunks.length > 0 ? Math.max(...uploadedChunks) + 1 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up incomplete uploads (cron job or manual)
 * DELETE /api/admin/upload/cleanup-chunks
 */
export const cleanupChunks = async (req, res, next) => {
  try {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    let cleanedCount = 0;

    if (!fs.existsSync(chunksDir)) {
      return res.json({
        success: true,
        message: 'No chunks to clean up',
        messageAr: 'لا توجد أجزاء للتنظيف',
        data: { cleanedCount: 0 },
      });
    }

    const uploadDirs = fs.readdirSync(chunksDir);

    for (const uploadDir of uploadDirs) {
      const uploadDirPath = path.join(chunksDir, uploadDir);
      const stats = fs.statSync(uploadDirPath);

      if (now - stats.mtime.getTime() > maxAge) {
        // Delete old chunk directory
        fs.rmSync(uploadDirPath, { recursive: true, force: true });
        cleanedCount++;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} incomplete upload(s)`,
      messageAr: `تم تنظيف ${cleanedCount} رفع غير مكتمل`,
      data: { cleanedCount },
    });
  } catch (error) {
    next(error);
  }
};



