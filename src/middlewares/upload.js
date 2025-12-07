import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    if (file.fieldname === 'avatar') folder = 'avatars';
    else if (file.fieldname === 'cover_image' || file.fieldname === 'image') folder = 'images';
    else if (file.fieldname === 'video') folder = 'videos';
    else if (file.fieldname === 'pdf' || file.fieldname === 'file') folder = 'files';
    // Banners are stored in images folder
    if (file.fieldname === 'image' && req.route?.path?.includes('banner')) {
      folder = 'images'; // Banners use images folder
    }
    
    const dest = path.join(uploadDir, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Different file size limits for different file types
const getFileSizeLimit = (file) => {
  // For videos, allow up to 2GB (2 * 1024 * 1024 * 1024)
  if (file.fieldname === 'video') {
    return parseInt(process.env.MAX_VIDEO_SIZE) || 2 * 1024 * 1024 * 1024; // 2GB default for videos
  }
  // For images, allow up to 50MB
  if (file.fieldname === 'avatar' || file.fieldname === 'cover_image' || file.fieldname === 'image') {
    return parseInt(process.env.MAX_IMAGE_SIZE) || 50 * 1024 * 1024; // 50MB default for images
  }
  // For other files (PDFs, etc.), allow up to 100MB
  return parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024; // 100MB default for other files
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024, // 2GB default (for videos)
  },
});

// Special upload instance for videos with higher limit
export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 5 * 1024 * 1024 * 1024, // 5GB default for videos
  },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => {
  // Check if any field is 'video' - if so, use uploadVideo
  const hasVideo = fields.some(field => field.name === 'video');
  if (hasVideo) {
    return uploadVideo.fields(fields);
  }
  return upload.fields(fields);
};


