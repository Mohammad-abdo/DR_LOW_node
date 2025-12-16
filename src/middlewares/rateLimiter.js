import rateLimit from 'express-rate-limit';

// General API rate limiter - 200 requests per 15 minutes per IP (increased for better UX)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    messageAr: 'عدد كبير جداً من الطلبات من هذا العنوان، يرجى المحاولة لاحقاً.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/health/db';
  },
});

// Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
    messageAr: 'عدد كبير جداً من محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Strict rate limiter for password reset - 3 requests per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
    messageAr: 'عدد كبير جداً من محاولات إعادة تعيين كلمة المرور، يرجى المحاولة بعد ساعة.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter - 10 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again after 1 hour.',
    messageAr: 'عدد كبير جداً من رفع الملفات، يرجى المحاولة بعد ساعة.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Report generation rate limiter - 5 reports per hour
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 reports per hour
  message: {
    success: false,
    message: 'Too many report generation requests, please try again after 1 hour.',
    messageAr: 'عدد كبير جداً من طلبات إنشاء التقارير، يرجى المحاولة بعد ساعة.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Notification polling rate limiter - 500 requests per minute (increased for multiple components polling)
export const notificationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // Limit each IP to 500 notification requests per minute (increased for multiple components polling)
  message: {
    success: false,
    message: 'Too many notification requests, please slow down.',
    messageAr: 'عدد كبير جداً من طلبات الإشعارات، يرجى التباطؤ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

