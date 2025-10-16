const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const { testConnection } = require('./src/database/connection');
const { ensureRequiredColumns } = require('./src/database/migrations/ensure-columns');
const { ensureColumns } = require('./src/database/ensureColumns');
const { specs, swaggerUi, swaggerOptions } = require('./src/config/swagger');

// Import routes
const reportRoutes = require('./src/routes/reports');
const importRoutes = require('./src/routes/import_new'); // Sử dụng routes mới
const accountRoutes = require('./src/routes/accounts-simple');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// === MIDDLEWARE CONFIGURATION ===

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Disable ETag to prevent 304 on dynamic API responses
app.set('etag', false);

// CORS configuration
// - Cho phép origin của frontend (FRONTEND_URL hoặc FRONTEND_URLS dạng CSV)
// - Cho phép same-origin với backend (http://localhost:PORT) để Swagger UI hoạt động
// - Trong môi trường dev, nới lỏng cho mọi localhost:* nếu cần
const DEV_PORT = process.env.PORT || 3001;
const defaultFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
const extraFrontends = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  defaultFrontend,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // same-origin (backend) to support Swagger UI calls
  `http://localhost:${DEV_PORT}`,
  `http://127.0.0.1:${DEV_PORT}`,
  ...extraFrontends,
]);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests or same-origin without Origin header
    if (!origin) return callback(null, true);

    // Allow explicitly whitelisted origins
    if (allowedOrigins.has(origin)) return callback(null, true);

    // In development, allow any localhost origin (useful for local testing)
    if (process.env.NODE_ENV !== 'production') {
      if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // giới hạn số request
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files serving
app.use('/uploads', express.static('uploads'));

// === ROUTES ===

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server đang hoạt động tốt',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }
  });
});

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// API Spec JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/report-batches', require('./src/routes/reportBatches'));
app.use('/api/admin/reports', require('./src/routes/adminReports'));
app.use('/api/teacher-reports', require('./src/routes/teacherReports'));
app.use('/api/teacher-profile', require('./src/routes/teacherProfile'));
app.use('/api/teacher-submissions', require('./src/routes/teacherSubmissions'));
app.use('/api/teacher-company-evaluations', require('./src/routes/teacher-company-evaluations'));
app.use('/api/internship-reports', require('./src/routes/internship-reports'));
app.use('/api/import', importRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/password', require('./src/routes/password'));
app.use('/api/student-reports', require('./src/routes/studentReports'));
app.use('/api/password-reset', require('./src/routes/passwordReset'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/company-registrations', require('./src/routes/company-registrations'));
app.use('/api/student-registrations', require('./src/routes/student-registrations'));
app.use('/api/company-internships', require('./src/routes/company-internships'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/registration', require('./src/routes/registration'));
app.use('/api/file', require('./src/routes/file'));
app.use('/api/notifications', require('./src/routes/notifications'));

// New resource routes (map English endpoints to Vietnamese-backed models)
app.use('/api/sinh-vien', require('./src/routes/SinhVien'));
// Backward-compatible alias for old frontend calls
app.use('/api/students', require('./src/routes/SinhVien'));
app.use('/api/teachers', require('./src/routes/GiangVien'));
app.use('/api/giang-vien', require('./src/routes/GiangVien')); // Vietnamese route
app.use('/api/companies', require('./src/routes/DoanhNghiep'));
app.use('/api/doanh-nghiep', require('./src/routes/DoanhNghiep')); // Vietnamese route
app.use('/api/internship-batches', require('./src/routes/internship-batches'));
app.use('/api/sinh-vien-huong-dan', require('./src/routes/sinhVienHuongDan'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/auto-assignment', require('./src/routes/auto-assignment'));

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Utilities]
 *     summary: API Root endpoint
 *     description: Endpoint gốc cung cấp thông tin về API và các endpoint có sẵn
 *     responses:
 *       200:
 *         description: Thông tin API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Welcome to Internship Management API"
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Hệ thống Quản lý Thực tập - Khoa CNTT Đại học Đại Nam"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     documentation:
 *                       type: string
 *                       example: "/api/docs"
 *                     endpoints:
 *                       type: object
 */
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Internship Management API',
    data: {
      title: 'Hệ thống Quản lý Thực tập - Khoa CNTT Đại học Đại Nam',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        reports: '/api/reports',
        import: '/api/import',
        health: '/health'
      }
    }
  });
});

// === ERROR HANDLING ===

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
    data: null
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      data: Object.values(err.errors).map(e => e.message)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      data: null
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn',
      data: null
    });
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại',
      data: null
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không tồn tại',
      data: null
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Đã xảy ra lỗi nội bộ' 
      : err.message,
    data: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// === SERVER STARTUP ===

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Kiểm tra kết nối database...');
    await testConnection();
    console.log('✅ Kết nối database thành công!');

    // Ensure required columns exist
    console.log('🧩 Kiểm tra & bổ sung cột còn thiếu...');
    await ensureRequiredColumns();
    console.log('✅ Cấu trúc bảng đã sẵn sàng');

    // Ensure batch count columns exist
    try {
      const { ensureBatchCountColumns } = require('./ensure-batch-count-columns');
      await ensureBatchCountColumns();
    } catch (e) {
      console.warn('⚠️ Không thể đảm bảo các cột đếm trên dot_thuc_tap:', e.message);
    }

    // Start server
  await ensureColumns();
  app.listen(PORT, () => {
      console.log('🚀 Server đang chạy...');
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log('⚡ API Endpoints:');
      console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
      console.log(`   - Health: http://localhost:${PORT}/health`);
      console.log('───────────────────────────────────────');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Không thể khởi động server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;