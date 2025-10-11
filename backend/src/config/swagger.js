const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hệ thống Quản lý Thực tập - API Documentation',
      version: '1.0.0',
      description: `
        API Documentation cho Hệ thống Quản lý Thực tập - Khoa CNTT Đại học Đại Nam
        
        ## 🎯 Tính năng chính:
        - **Quản lý tài khoản**: Admin, Sinh viên, Giảng viên, Doanh nghiệp
        - **Quản lý thực tập**: Đợt thực tập, phân công, theo dõi
        - **Báo cáo**: Tuần, cuối kỳ, thống kê
        - **Import/Export**: Excel templates, bulk operations
        
        ## 🔐 Authentication:
        1) Đăng nhập để lấy token tại một trong các endpoint:
           - POST /api/auth/login (body: { userCode, password })
           - POST /api/auth/login/admin (body: { userId, password })
           - POST /api/auth/login/sinh-vien (body: { maSinhVien, password })
        2) Click nút "Authorize" (góc phải trên) và dán token (không cần gõ chữ "Bearer ")
        3) Swagger sẽ tự gửi header \`Authorization: Bearer <token>\` cho các API yêu cầu xác thực
        
        Lưu ý: Token có hạn dùng (~24h). Nếu token cũ, vui lòng đăng nhập lại.
        
        ## 📱 Liên hệ:
        - **Email**: admin@dainam.edu.vn
        - **Website**: https://dainam.edu.vn
      `,
      contact: {
        name: 'Khoa CNTT - Đại học Đại Nam',
        email: 'admin@dainam.edu.vn',
        url: 'https://dainam.edu.vn'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development Server'
      },
      {
        url: 'https://api.dainam.edu.vn',
        description: 'Production Server'
      }
    ],
    security: [
      { bearerAuth: [] }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        // Common schemas
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Trạng thái thành công'
            },
            message: {
              type: 'string',
              description: 'Thông báo'
            },
            data: {
              type: 'object',
              description: 'Dữ liệu trả về'
            },
            error: {
              type: 'string',
              description: 'Thông báo lỗi (nếu có)'
            }
          }
        },
        
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['userId', 'password', 'role'],
          properties: {
            userId: {
              type: 'string',
              description: 'Mã đăng nhập',
              example: 'SV001'
            },
            password: {
              type: 'string',
              description: 'Mật khẩu',
              example: '123456'
            },
            role: {
              type: 'string',
              enum: ['admin', 'sinh-vien', 'giang-vien', 'doanh-nghiep'],
              description: 'Vai trò người dùng',
              example: 'sinh-vien'
            }
          }
        },
        
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT Token' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    userId: { type: 'string' },
                    role: { type: 'string' },
                    name: { type: 'string' }
                  }
                }
              }
            }
          }
        },

        // User schemas
        SinhVien: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID sinh viên' },
            ma_sinh_vien: { type: 'string', description: 'Mã sinh viên' },
            ho_ten: { type: 'string', description: 'Họ tên' },
            email: { type: 'string', description: 'Email' },
            so_dien_thoai: { type: 'string', description: 'Số điện thoại' },
            lop: { type: 'string', description: 'Lớp' },
            khoa: { type: 'string', description: 'Khoa' },
            nam_hoc: { type: 'string', description: 'Năm học' },
            vi_tri_muon_ung_tuyen_thuc_tap: { type: 'string', description: 'Vị trí muốn ứng tuyển' },
            don_vi_thuc_tap: { type: 'string', description: 'Đơn vị thực tập' },
            trang_thai: { 
              type: 'string', 
              enum: ['chua-thuc-tap', 'dang-thuc-tap', 'hoan-thanh', 'tam-dung'],
              description: 'Trạng thái thực tập'
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        DoanhNghiep: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_doanh_nghiep: { type: 'string' },
            ten_doanh_nghiep: { type: 'string' },
            dia_chi: { type: 'string' },
            so_dien_thoai: { type: 'string' },
            email: { type: 'string' },
            website: { type: 'string' },
            nguoi_lien_he: { type: 'string' },
            chuc_vu_lien_he: { type: 'string' },
            linh_vuc: { type: 'string' },
            quy_mo: { type: 'string' },
            mo_ta: { type: 'text' },
            trang_thai: {
              type: 'string',
              enum: ['hoat-dong', 'tam-dung', 'khong-hop-tac']
            }
          }
        },

        GiangVien: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_giang_vien: { type: 'string' },
            ho_ten: { type: 'string' },
            email: { type: 'string' },
            so_dien_thoai: { type: 'string' },
            khoa: { type: 'string' },
            chuyen_mon: { type: 'string' },
            trinh_do: { type: 'string' }
          }
        },

        // Report schemas
        BaoCaoThucTap: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sinh_vien_id: { type: 'integer' },
            tuan_thu: { type: 'integer' },
            noi_dung: { type: 'string' },
            van_de_gap_phai: { type: 'string' },
            ke_hoach_tuan_sau: { type: 'string' },
            diem_giang_vien: { type: 'number', minimum: 0, maximum: 10 },
            diem_doanh_nghiep: { type: 'number', minimum: 0, maximum: 10 },
            nhan_xet_giang_vien: { type: 'string' },
            nhan_xet_doanh_nghiep: { type: 'string' },
            trang_thai: {
              type: 'string',
              enum: ['chua-nop', 'cho-duyet', 'da-duyet', 'can-sua']
            },
            ngay_nop: { type: 'string', format: 'date-time' }
          }
        },

        // Error schemas
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Dữ liệu không hợp lệ' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },

        UnauthorizedError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Không có quyền truy cập' }
          }
        },

        NotFoundError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Không tìm thấy dữ liệu' }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Lỗi validation dữ liệu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        UnauthorizedError: {
          description: 'Không có quyền truy cập',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnauthorizedError' }
            }
          }
        },
        NotFoundError: {
          description: 'Không tìm thấy dữ liệu',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        },
        ServerError: {
          description: 'Lỗi server',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Lỗi server' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: '🔐 Xác thực và phân quyền'
      },
      {
        name: 'Admin',
        description: '👨‍💼 Quản lý hệ thống'
      },
      {
        name: 'Sinh Viên',
        description: '👨‍🎓 Quản lý sinh viên'
      },
      {
        name: 'Giảng Viên',
        description: '👨‍🏫 Quản lý giảng viên'
      },
      {
        name: 'Doanh Nghiệp',
        description: '🏢 Quản lý doanh nghiệp'
      },
      {
        name: 'Báo Cáo',
        description: '📊 Báo cáo thực tập'
      },
      {
        name: 'Import/Export',
        description: '📁 Import/Export dữ liệu'
      },
      {
        name: 'Utilities',
        description: '🔧 Tiện ích hệ thống'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './server.js'
  ]
};

const specs = swaggerJsdoc(options);

// Custom CSS để làm đẹp Swagger UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .info .title { 
    color: #1f2937; 
    font-size: 2.5rem;
    font-weight: bold;
  }
  .swagger-ui .info .description { 
    color: #4b5563; 
    font-size: 1.1rem;
    line-height: 1.6;
  }
  .swagger-ui .scheme-container { 
    background: #f3f4f6; 
    padding: 20px; 
    border-radius: 8px;
    margin: 20px 0;
  }
  .swagger-ui .opblock .opblock-summary { 
    border-left: 4px solid #3b82f6;
    padding-left: 15px;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary { 
    border-left-color: #10b981; 
  }
  .swagger-ui .opblock.opblock-post .opblock-summary { 
    border-left-color: #3b82f6; 
  }
  .swagger-ui .opblock.opblock-put .opblock-summary { 
    border-left-color: #f59e0b; 
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary { 
    border-left-color: #ef4444; 
  }
  .swagger-ui .btn.authorize { 
    background: #3b82f6;
    border-color: #3b82f6;
  }
  .swagger-ui .btn.authorize:hover { 
    background: #2563eb;
    border-color: #2563eb;
  }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: 'API Docs - Quản lý Thực tập',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      req.headers['X-Requested-With'] = 'SwaggerUI';
      return req;
    }
  }
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};