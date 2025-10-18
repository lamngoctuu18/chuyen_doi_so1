const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hệ thống Quản lý Thực tập - API Documentation',
      version: '2.0.0',
      description: 'API Documentation cho Hệ thống Quản lý Thực tập Sinh viên',
      contact: {
        name: 'Admin',
        email: 'admin@dainam.edu.vn'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['userCode', 'password'],
          properties: {
            userCode: { type: 'string', example: 'SV001' },
            password: { type: 'string', format: 'password' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: { type: 'object' }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep'] },
            is_active: { type: 'boolean' }
          }
        },
        SinhVien: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_sinh_vien: { type: 'string' },
            ho_ten: { type: 'string' },
            email: { type: 'string' },
            so_dien_thoai: { type: 'string' },
            lop: { type: 'string' }
          }
        },
        GiangVien: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_giang_vien: { type: 'string' },
            ho_ten: { type: 'string' },
            email: { type: 'string' },
            khoa: { type: 'string' }
          }
        },
        DoanhNghiep: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_doanh_nghiep: { type: 'string' },
            ten_doanh_nghiep: { type: 'string' },
            email: { type: 'string' },
            dia_chi: { type: 'string' }
          }
        },
        DotThucTap: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ten_dot: { type: 'string' },
            nam_hoc: { type: 'string' },
            hoc_ky: { type: 'string' },
            trang_thai: { type: 'string' }
          }
        },
        PhanCongThucTap: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sinh_vien_id: { type: 'integer' },
            giang_vien_id: { type: 'integer' },
            doanh_nghiep_id: { type: 'integer' },
            dot_thuc_tap_id: { type: 'integer' },
            trang_thai: { type: 'string' }
          }
        },
        BaoCao: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            phan_cong_thuc_tap_id: { type: 'integer' },
            loai_bao_cao: { type: 'string', enum: ['tuan', 'cuoi-ky'] },
            tuan_so: { type: 'integer' },
            trang_thai: { type: 'string' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'Xác thực và đăng nhập' },
      { name: 'Auth', description: 'Xác thực' },
      { name: 'Đổi Mật Khẩu', description: 'Quản lý đổi mật khẩu và reset password' },
      { name: 'Students', description: 'Quản lý sinh viên' },
      { name: 'Teachers', description: 'Quản lý giảng viên' },
      { name: 'Teacher Profile', description: 'Profile giảng viên' },
      { name: 'Teacher Reports', description: 'Báo cáo của giảng viên' },
      { name: 'Companies', description: 'Quản lý doanh nghiệp' },
      { name: 'Internships', description: 'Quản lý đợt thực tập' },
      { name: 'Assignments', description: 'Phân công thực tập' },
      { name: 'Reports', description: 'Quản lý báo cáo' },
      { name: 'Nộp Báo Cáo', description: 'Nộp báo cáo của sinh viên' },
      { name: 'Report Batches', description: 'Quản lý đợt nộp báo cáo theo tuần' },
      { name: 'Internship Reports', description: 'Báo cáo thực tập' },
      { name: 'Admin Reports', description: 'Admin reports management API' },
      { name: 'Import/Export', description: 'Import/Export dữ liệu Excel' },
      { name: 'Statistics', description: 'Thống kê báo cáo' }
    ],
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './server.js']
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
