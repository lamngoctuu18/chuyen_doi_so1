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

        // Student Report Submission schemas
        StudentReportUpload: {
          type: 'object',
          required: ['ma_sinh_vien', 'dot_thuc_tap_id', 'loai_bao_cao', 'report_file'],
          properties: {
            ma_sinh_vien: {
              type: 'string',
              description: 'Mã sinh viên',
              example: 'SV001'
            },
            dot_thuc_tap_id: {
              type: 'integer',
              description: 'ID đợt thực tập',
              example: 1
            },
            loai_bao_cao: {
              type: 'string',
              enum: ['tuan', 'thang', 'cuoi_ky', 'tong_ket'],
              description: 'Loại báo cáo',
              example: 'tuan'
            },
            ghi_chu: {
              type: 'string',
              description: 'Ghi chú',
              example: 'Báo cáo tuần 1'
            },
            report_file: {
              type: 'string',
              format: 'binary',
              description: 'File báo cáo (PDF, Word, Excel, PowerPoint - Max 10MB)'
            }
          }
        },

        StudentReport: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ma_sinh_vien: { type: 'string' },
            ten_sinh_vien: { type: 'string' },
            lop: { type: 'string' },
            dot_thuc_tap_id: { type: 'integer' },
            ten_dot_thuc_tap: { type: 'string' },
            ma_giang_vien: { type: 'string' },
            ten_giang_vien: { type: 'string' },
            loai_bao_cao: {
              type: 'string',
              enum: ['tuan', 'thang', 'cuoi_ky', 'tong_ket']
            },
            file_name: { type: 'string' },
            file_path: { type: 'string' },
            file_size: { type: 'integer' },
            mime_type: { type: 'string' },
            trang_thai_duyet: {
              type: 'string',
              enum: ['cho_duyet', 'da_duyet', 'tu_choi'],
              description: 'Trạng thái duyệt'
            },
            nguoi_duyet: { type: 'string' },
            ngay_duyet: { type: 'string', format: 'date-time' },
            nhan_xet: { type: 'string' },
            ly_do_tu_choi: { type: 'string' },
            ghi_chu: { type: 'string' },
            ngay_nop: { type: 'string', format: 'date-time' }
          }
        },

        ReviewReportRequest: {
          type: 'object',
          required: ['nguoi_duyet', 'trang_thai_duyet'],
          properties: {
            nguoi_duyet: {
              type: 'string',
              description: 'Mã giảng viên duyệt',
              example: 'GV001'
            },
            trang_thai_duyet: {
              type: 'string',
              enum: ['da_duyet', 'tu_choi'],
              description: 'Trạng thái duyệt',
              example: 'da_duyet'
            },
            nhan_xet: {
              type: 'string',
              description: 'Nhận xét/Lý do từ chối',
              example: 'Báo cáo chi tiết, đầy đủ thông tin'
            }
          }
        },

        ReportStatistics: {
          type: 'object',
          properties: {
            tong_so_bao_cao: { type: 'integer' },
            cho_duyet: { type: 'integer' },
            da_duyet: { type: 'integer' },
            tu_choi: { type: 'integer' },
            thong_ke_theo_loai: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  loai_bao_cao: { type: 'string' },
                  so_luong: { type: 'integer' }
                }
              }
            }
          }
        },

        // Password Reset schemas
        PasswordResetRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email đăng ký tài khoản',
              example: 'student@dainam.edu.vn'
            }
          }
        },

        PasswordResetResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                expires_in_minutes: { type: 'integer', example: 10 },
                reset_code: { 
                  type: 'string', 
                  description: 'Mã xác thực 6 số (chỉ hiện trong development)',
                  example: '123456'
                }
              }
            }
          }
        },

        VerifyResetCodeRequest: {
          type: 'object',
          required: ['email', 'reset_code'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'student@dainam.edu.vn'
            },
            reset_code: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              description: 'Mã xác thực 6 số',
              example: '123456'
            }
          }
        },

        ResetPasswordRequest: {
          type: 'object',
          required: ['email', 'reset_code', 'new_password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'student@dainam.edu.vn'
            },
            reset_code: {
              type: 'string',
              pattern: '^[0-9]{6}$',
              example: '123456'
            },
            new_password: {
              type: 'string',
              minLength: 6,
              description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
              example: 'NewPassword123!'
            }
          }
        },

        PasswordResetHistory: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            reset_code: { type: 'string' },
            expiration_time: { type: 'string', format: 'date-time' },
            used_flag: { type: 'integer', enum: [0, 1] },
            created_at: { type: 'string', format: 'date-time' },
            trang_thai: {
              type: 'string',
              enum: ['Đã sử dụng', 'Hết hạn', 'Còn hiệu lực']
            }
          }
        },

        RateLimitStatus: {
          type: 'object',
          properties: {
            is_limited: { type: 'boolean' },
            request_count: { type: 'integer' },
            max_requests: { type: 'integer' },
            time_window_minutes: { type: 'integer' },
            message: { type: 'string' }
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
        description: '🔐 Xác thực và phân quyền (Login, Logout, Token refresh)'
      },
      {
        name: 'Admin',
        description: '👨‍💼 Quản lý hệ thống (Admin dashboard, user management)'
      },
      {
        name: 'Sinh Viên',
        description: '👨‍🎓 Quản lý sinh viên (Students CRUD, profile, registration)'
      },
      {
        name: 'Giảng Viên',
        description: '👨‍🏫 Quản lý giảng viên (Teachers CRUD, assignments, evaluations)'
      },
      {
        name: 'Doanh Nghiệp',
        description: '🏢 Quản lý doanh nghiệp (Companies CRUD, internship positions)'
      },
      {
        name: 'Đợt Thực Tập',
        description: '📅 Quản lý đợt thực tập (Internship batches, periods)'
      },
      {
        name: 'Phân Công Thực Tập',
        description: '📋 Phân công sinh viên - giảng viên (Student-teacher assignments)'
      },
      {
        name: 'Đăng Ký Thực Tập',
        description: '✍️ Đăng ký thực tập của sinh viên và doanh nghiệp'
      },
      {
        name: 'Báo Cáo Thực Tập',
        description: '📊 Báo cáo thực tập (Weekly, monthly, final reports)'
      },
      {
        name: 'Báo Cáo Sinh Viên',
        description: '📝 Báo cáo nộp bởi sinh viên (Student submitted reports)'
      },
      {
        name: 'Nộp Báo Cáo',
        description: '📤 Upload và quản lý báo cáo (File submissions, approvals)'
      },
      {
        name: 'Đánh Giá Doanh Nghiệp',
        description: '⭐ Đánh giá doanh nghiệp của giảng viên (Company evaluations)'
      },
      {
        name: 'Đổi Mật Khẩu',
        description: '🔑 Quản lý đổi mật khẩu (Password reset, forgot password)'
      },
      {
        name: 'Tài Khoản',
        description: '👤 Quản lý tài khoản (Accounts, profile management)'
      },
      {
        name: 'Import/Export',
        description: '📁 Import/Export dữ liệu Excel (Bulk operations)'
      },
      {
        name: 'Thông Báo',
        description: '🔔 Quản lý thông báo (Notifications)'
      },
      {
        name: 'Dashboard',
        description: '📈 Thống kê và báo cáo tổng hợp (Statistics, analytics)'
      },
      {
        name: 'Files',
        description: '📎 Quản lý files (File upload, download)'
      },
      {
        name: 'Utilities',
        description: '🔧 Tiện ích hệ thống (Health check, system info)'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/routes/**/*.js',
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