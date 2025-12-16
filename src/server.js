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
import { fileURLToPath } from "url";

// Import routes
import adminRoutes from "./routes/admin/index.js";
import studentMobileRoutes from "./routes/mobile/student/index.js";
import teacherMobileRoutes from "./routes/mobile/teacher/index.js";
import adminMobileRoutes from "./routes/mobile/admin/index.js";
import webRoutes from "./routes/web/index.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Debug: Log the port being used
console.log("🔍 Environment PORT:", process.env.PORT);
console.log("🔍 Final PORT:", PORT);

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
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split("||")
    .map((url) => url.trim())
    .filter((url) => url);

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

            if (allowedOrigins.includes(origin) || isLocalNetwork) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
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

// Serve static files with proper headers for videos
app.use("/uploads", express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper headers for video files
    if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  },
  // Handle errors gracefully
  fallthrough: false,
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

// Routes with specific rate limiters
// Note: authLimiter removed from /api/auth to allow unlimited login attempts
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
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
});

export default app;
