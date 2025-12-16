/**
 * Request Guard Middleware
 * Protects against infinite loops, duplicate requests, and malformed requests
 */

// Store for tracking duplicate requests
const requestCache = new Map();
const CACHE_TTL = 2000; // 2 seconds - prevent duplicate requests within 2 seconds

// Store for tracking request counts per IP
const requestCounts = new Map();
const MAX_REQUESTS_PER_SECOND = 50; // Maximum requests per second per IP
const WINDOW_MS = 1000; // 1 second window

/**
 * Clean up old cache entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      requestCache.delete(key);
    }
  }
  
  // Clean up request counts
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.timestamp > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, 5000); // Clean up every 5 seconds

/**
 * Generate a unique key for a request
 */
function getRequestKey(req) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const method = req.method;
  const path = req.path;
  const bodyHash = req.body ? JSON.stringify(req.body).substring(0, 100) : '';
  return `${ip}:${method}:${path}:${bodyHash}`;
}

/**
 * Check if request is a duplicate
 * Skips static file requests (uploads, images, videos) as they are naturally requested multiple times
 */
export const duplicateRequestGuard = (req, res, next) => {
  try {
    // Skip duplicate check for static file requests (uploads, images, videos)
    // These are naturally requested multiple times by browsers/video players
    const isStaticFileRequest = 
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/static/') ||
      req.path.match(/\.(jpg|jpeg|png|gif|svg|webp|mp4|avi|mov|wmv|flv|webm|pdf|zip|rar)$/i);
    
    if (isStaticFileRequest) {
      // Allow static file requests to pass through without duplicate checking
      return next();
    }
    
    const key = getRequestKey(req);
    const now = Date.now();
    
    // Check if this is a duplicate request
    if (requestCache.has(key)) {
      const cached = requestCache.get(key);
      if (now - cached.timestamp < CACHE_TTL) {
        console.warn(`⚠️ Duplicate request detected: ${req.method} ${req.path} from ${req.ip}`);
        return res.status(429).json({
          success: false,
          message: 'Duplicate request detected. Please wait before retrying.',
          messageAr: 'تم اكتشاف طلب مكرر. يرجى الانتظار قبل إعادة المحاولة.',
          retryAfter: Math.ceil((CACHE_TTL - (now - cached.timestamp)) / 1000),
        });
      }
    }
    
    // Store this request
    requestCache.set(key, { timestamp: now });
    
    next();
  } catch (error) {
    console.error('Error in duplicateRequestGuard:', error);
    next(); // Continue on error
  }
};

/**
 * Rate limiting guard - prevents too many requests per second
 */
export const rateLimitGuard = (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get or create request count for this IP
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 0, timestamp: now });
    }
    
    const ipData = requestCounts.get(ip);
    
    // Reset if window has passed
    if (now - ipData.timestamp > WINDOW_MS) {
      ipData.count = 0;
      ipData.timestamp = now;
    }
    
    // Increment count
    ipData.count++;
    
    // Check if limit exceeded
    if (ipData.count > MAX_REQUESTS_PER_SECOND) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip} - ${ipData.count} requests in 1 second`);
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down.',
        messageAr: 'عدد كبير جداً من الطلبات. يرجى التباطؤ.',
        retryAfter: Math.ceil((WINDOW_MS - (now - ipData.timestamp)) / 1000),
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in rateLimitGuard:', error);
    next(); // Continue on error
  }
};

/**
 * Request size guard - prevents extremely large requests
 * Skips file upload routes which are handled by multer
 */
export const requestSizeGuard = (maxSize = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    try {
      // Skip size check for file upload routes (multer will handle it)
      // Check if this is a multipart/form-data request (file upload)
      const contentType = req.headers['content-type'] || '';
      const isMultipartUpload = contentType.includes('multipart/form-data');
      
      // Check if this is an upload route
      const isUploadRoute = 
        (req.path.includes('/content') && (req.method === 'POST' || req.method === 'PUT')) ||
        (req.path.includes('/courses') && (req.method === 'POST' || req.method === 'PUT') && isMultipartUpload) ||
        (req.path.includes('/banners') && (req.method === 'POST' || req.method === 'PUT')) ||
        (req.path.includes('/categories') && (req.method === 'POST' || req.method === 'PUT'));
      
      if (isMultipartUpload || isUploadRoute) {
        // For upload routes, skip size check (multer will enforce its own limits)
        // Multer allows up to 5GB for videos
        return next();
      }
      
      const contentLength = parseInt(req.headers['content-length'] || '0');
      
      if (contentLength > maxSize) {
        console.warn(`⚠️ Request too large: ${contentLength} bytes from ${req.ip}`);
        return res.status(413).json({
          success: false,
          message: 'Request payload too large.',
          messageAr: 'حجم الطلب كبير جداً.',
          maxSize: `${maxSize / 1024 / 1024}MB`,
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requestSizeGuard:', error);
      next();
    }
  };
};

/**
 * Request timeout guard - prevents hanging requests
 */
export const requestTimeoutGuard = (timeoutMs = 30000) => { // 30 seconds default
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⚠️ Request timeout: ${req.method} ${req.path} from ${req.ip}`);
        res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again.',
          messageAr: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(...args) {
      clearTimeout(timeout);
      originalEnd.apply(this, args);
    };
    
    next();
  };
};



