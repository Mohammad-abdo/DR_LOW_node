import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chunks directory
const chunksDir = path.join(__dirname, '../../uploads/chunks');
if (!fs.existsSync(chunksDir)) {
  fs.mkdirSync(chunksDir, { recursive: true });
}

// Memory storage for chunks (we'll save them manually)
const storage = multer.memoryStorage();

// File filter - only videos
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ];

  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed'), false);
  }
};

// Multer instance for chunked uploads (no size limit, handled by chunks)
export const chunkedUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per chunk (safety limit)
  },
});






