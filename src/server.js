import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { apiLimiter, authLimiter, notificationLimiter } from "./middlewares/rateLimiter.js";
import { duplicateRequestGuard, rateLimitGuard, requestSizeGuard, requestTimeoutGuard } from "./middlewares/requestGuard.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import os from "os";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Import routes
import adminRoutes from "./routes/admin/index.js";
import studentMobileRoutes from "./routes/mobile/student/index.js";
import teacherMobileRoutes from "./routes/mobile/teacher/index.js";
import adminMobileRoutes from "./routes/mobile/admin/index.js";
import publicMobileRoutes from "./routes/mobile/public/index.js";
import webRoutes from "./routes/web/index.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Debug: Log the port being used
console.log("🔍 Environment PORT:", process.env.PORT);
console.log("🔍 Final PORT:", PORT);
//new line
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LMS API Documentation",
            version: "1.0.0",
            description:
                "Learning Management System API for University in Kuwait",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
// Handle multiple frontend URLs
// Note: include production Vercel frontend by default to avoid CORS blocks on uploads/polling.
const rawAllowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173||https://dr-low.vercel.app")
    .split("||")
    .map((url) => url.trim())
    .filter((url) => url);

// Always allow the production frontend even if FRONTEND_URL is set incorrectly in env
rawAllowedOrigins.push("https://dr-low.vercel.app");
rawAllowedOrigins.push("https://dr-law.site");
rawAllowedOrigins.push("http://dr-law.site");

// Normalize allowed origins:
// - Accept entries with or without scheme (e.g. `dr-low.vercel.app`)
// - Compare by hostname (more robust across http/https)
const allowedHostnames = new Set(
    rawAllowedOrigins
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
            try {
                // If scheme is missing, assume https for parsing
                const normalized = entry.includes("://") ? entry : `https://${entry}`;
                return new URL(normalized).hostname.toLowerCase();
            } catch {
                return null;
            }
        })
        .filter(Boolean)
);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
            const isLocalNetwork =
                /^(http:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(
                    origin
                );

            try {
                const requestHostname = new URL(origin).hostname.toLowerCase();
                if (allowedHostnames.has(requestHostname) || isLocalNetwork) {
                callback(null, true);
            } else {
                    callback(new Error("Not allowed by CORS"));
                }
            } catch {
                // If origin is malformed, reject it
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        // Allow frontend JS to read rate-limit/backoff headers
        exposedHeaders: ["Retry-After"],
    })
);
// Request guards - protect against infinite loops and duplicate requests
app.use(rateLimitGuard);
app.use(duplicateRequestGuard);
app.use(requestSizeGuard(10 * 1024 * 1024)); // 10MB limit for non-upload requests (upload routes are skipped)
app.use(requestTimeoutGuard(600000)); // 10 minutes timeout for large file uploads (videos can be up to 5GB)

// Increase body size limits for large file uploads (videos) - 5GB limit
app.use(express.json({ limit: '5368709120' })); // 5GB in bytes
app.use(express.urlencoded({ extended: true, limit: '5368709120' })); // 5GB in bytes

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.join(__dirname, "../uploads");
console.log("📁 Serving uploads from:", uploadsPath);

// Helper function to set CORS headers
const setCORSHeaders = (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const requestHostname = new URL(origin).hostname.toLowerCase();
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin);
      
      // Allow dr-law.site and dr-low.vercel.app
      const allowedDomains = ['dr-law.site', 'dr-low.vercel.app', 'dr-law.developteam.site'];
      const isAllowedDomain = allowedDomains.some(domain => requestHostname === domain || requestHostname.endsWith(`.${domain}`));
      
      if (allowedHostnames.has(requestHostname) || isLocalNetwork || isAllowedDomain) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
        // Note: When using crossOrigin="anonymous", we should not set credentials to true
        // But we'll set it to allow both anonymous and credentials requests
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
        return true;
      }
    } catch (e) {
      // Invalid origin
      console.error('CORS error:', e.message);
    }
  } else {
    // No origin (direct request), allow it
    res.setHeader('Access-Control-Allow-Origin', '*');
    return true;
  }
  return false;
};

// Handle OPTIONS requests for static files (CORS preflight)
app.options("/uploads/*", (req, res) => {
  setCORSHeaders(req, res);
  res.status(204).end();
});

// Custom route handler for static files with CORS support
app.get("/uploads/*", (req, res, next) => {
  // Set CORS headers first
  setCORSHeaders(req, res);
  
  // Get the file path from the request URL
  // req.url includes /uploads/..., we need to extract the path after /uploads/
  let urlPath = req.url;
  if (urlPath.startsWith('/uploads/')) {
    urlPath = urlPath.substring('/uploads/'.length);
  }
  // Remove query string
  urlPath = urlPath.split('?')[0];
  const filePath = decodeURIComponent(urlPath);
  const fullPath = path.join(uploadsPath, filePath);
  
  // Security check: ensure the path is within uploads directory
  const normalizedPath = path.normalize(fullPath);
  const normalizedUploadsPath = path.normalize(uploadsPath);
  
  if (!normalizedPath.startsWith(normalizedUploadsPath)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      messageAr: 'تم رفض الوصول',
    });
  }
  
  // Check if file exists
  if (!fs.existsSync(normalizedPath)) {
    console.log('❌ File not found:', {
      requested: req.url,
      filePath: filePath,
      fullPath: normalizedPath,
      uploadsPath: uploadsPath
    });
    return res.status(404).json({
      success: false,
      message: 'File not found',
      messageAr: 'الملف غير موجود',
      debug: process.env.NODE_ENV === 'development' ? {
        requested: req.url,
        filePath: filePath,
        fullPath: normalizedPath
      } : undefined
    });
  }
  
  // Set content type based on file extension
  const ext = path.extname(normalizedPath).toLowerCase();
  if (ext === '.mp4' || ext === '.webm') {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  } else if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  } else if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  
  // Handle range requests for video streaming
  const stat = fs.statSync(normalizedPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range && (ext === '.mp4' || ext === '.webm')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(normalizedPath, { start, end });
    
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);
    res.setHeader('Accept-Ranges', 'bytes');
    
    file.pipe(res);
  } else {
    // Send entire file
    res.setHeader('Content-Length', fileSize);
    res.sendFile(normalizedPath);
  }
});

// Fallback: serve static files for other methods (HEAD, etc.)
app.use("/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath, stat) => {
    // CORS headers
    const origin = res.req.headers.origin;
    if (origin) {
      try {
        const requestHostname = new URL(origin).hostname.toLowerCase();
        if (allowedHostnames.has(requestHostname) || 
            /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
      } catch (e) {
        // Invalid origin
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  },
  fallthrough: true, // Allow other routes to handle if file not found
}));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Database connection test
app.get("/health/db", async (req, res) => {
    try {
        const { testDatabaseConnection } = await import("./utils/dbTest.js");
        const result = await testDatabaseConnection();
        if (result.connected) {
            res.json({
                status: "OK",
                database: "connected",
                userCount: result.userCount,
                timestamp: new Date().toISOString(),
            });
        } else {
            res.status(500).json({
                status: "ERROR",
                database: "disconnected",
                error: result.error,
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "ERROR",
            database: "error",
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Health check routes (before API routes to avoid auth middleware)
import healthRoutes from "./routes/health.js";
app.use("/health", healthRoutes);

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public app routes (before auth middleware)
import appRoutes from "./routes/app.js";
app.use("/api/app", appRoutes);

// Routes with specific rate limiters
// Note: authLimiter removed from /api/auth to allow unlimited login attempts
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Mobile routes
// Public mobile routes (no authentication required)
app.use("/api/mobile/public", publicMobileRoutes);

// Authenticated mobile routes
app.use("/api/mobile/student", studentMobileRoutes);
app.use("/api/mobile/teacher", teacherMobileRoutes);
app.use("/api/mobile/admin", adminMobileRoutes);
app.use("/api/web", webRoutes);
app.use("/api/notifications", notificationLimiter); // Apply notification limiter before profile routes
app.use("/api", profileRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Get local IP address for network access
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

// Ensure Prisma Client is ready before starting server
import prisma from './config/database.js';
import { getPrismaHealthStatus } from './utils/prismaHealthCheck.js';

// Verify Prisma models are available
const verifyPrismaModels = async () => {
  try {
    const health = getPrismaHealthStatus();
    
    if (!health.healthy) {
      console.warn('⚠️  Some Prisma models are missing. Features may not work correctly.');
      console.warn('⚠️  To fix: Run "npm run prisma:generate" on the server');
    } else {
      console.log('✅ All Prisma models are available');
    }
  } catch (error) {
    console.error('❌ Error verifying Prisma models:', error.message);
  }
};

// Verify models before starting server
verifyPrismaModels();

// Start server
const HOST = "0.0.0.0"; // Listen on all network interfaces
const localIP = getLocalIPAddress();

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Local access: http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://${localIP}:${PORT}`);
    console.log(`📚 API Documentation: http://${localIP}:${PORT}/api-docs`);
    console.log(
        `\n💡 Share this IP with others on your WiFi: ${localIP}:${PORT}`
    );
    
    // Start scheduled jobs
    if (process.env.NODE_ENV !== 'test') {
        import('./jobs/courseExpirationJob.js').then(({ startCourseExpirationJob }) => {
            startCourseExpirationJob();
        }).catch(err => {
            console.error('Error starting scheduled jobs:', err);
        });
    }
});

export default app;
