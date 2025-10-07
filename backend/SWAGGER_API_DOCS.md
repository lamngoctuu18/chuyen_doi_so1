# 📚 Swagger API Documentation - Hệ thống Quản lý Thực tập

## 🎯 Tổng quan

Swagger UI được tích hợp để cung cấp giao diện trực quan và tương tác cho tất cả API endpoints của hệ thống quản lý thực tập.

## 🚀 Truy cập Swagger UI

### 🌐 URL chính:
```
http://localhost:3001/api/docs
```

### 📄 API Spec JSON:
```
http://localhost:3001/api/docs.json
```

## 🔑 Tính năng chính

### ✨ **Giao diện thân thiện:**
- 🎨 Custom CSS với theme Tailwind-inspired
- 📱 Responsive design
- 🔍 Search và filter APIs
- 💾 Persistent authorization (lưu token tự động)

### 🔐 **Authentication:**
- JWT Bearer Token authentication
- Test login trực tiếp trong UI
- Auto-persist token cho các request tiếp theo
- Support multiple user roles

### 📊 **API Categories:**
- **🔐 Authentication** - Đăng nhập/xuất, xác thực
- **👨‍💼 Admin** - Quản lý hệ thống, phê duyệt
- **👨‍🎓 Sinh Viên** - CRUD sinh viên, thông tin cá nhân
- **👨‍🏫 Giảng Viên** - Quản lý sinh viên, chấm điểm
- **🏢 Doanh Nghiệp** - Đăng ký, quản lý sinh viên thực tập
- **📊 Báo Cáo** - Báo cáo tuần/cuối kỳ, thống kê
- **📁 Import/Export** - Upload Excel, tạo template
- **🔧 Utilities** - Health check, system info

## 🛠️ Cách sử dụng

### 1. **Khởi động server:**
```bash
cd backend
node server.js
```

### 2. **Mở Swagger UI:**
```
http://localhost:3001/api/docs
```

### 3. **Authentication:**
1. Click nút **"Authorize"** 🔒
2. Test login bằng endpoint `/api/auth/login`
3. Copy JWT token từ response
4. Paste vào field "Value": `Bearer <your-token>`
5. Click **"Authorize"**
6. Giờ có thể test tất cả protected endpoints

### 4. **Test APIs:**
- Click vào endpoint muốn test
- Click **"Try it out"**
- Điền parameters/request body
- Click **"Execute"**
- Xem response code và data

## 📝 Sample Test Data

### 🔐 **Login Examples:**

```json
// Admin
{
  "userId": "admin001",
  "password": "123456", 
  "role": "admin"
}

// Sinh viên
{
  "userId": "SV001",
  "password": "123456",
  "role": "sinh-vien"
}

// Giảng viên  
{
  "userId": "GV001",
  "password": "123456",
  "role": "giang-vien"
}

// Doanh nghiệp
{
  "userId": "DN001", 
  "password": "123456",
  "role": "doanh-nghiep"
}
```

## 🎨 Customization

### Custom CSS được áp dụng:
- Ẩn topbar mặc định
- Color scheme theo brand
- Border-left cho các HTTP methods
- Hover effects và animations
- Responsive breakpoints

### Swagger Options:
- `persistAuthorization: true` - Lưu token tự động
- `displayRequestDuration: true` - Hiện thời gian response
- `filter: true` - Enable search
- `tryItOutEnabled: true` - Cho phép test API

## 📊 API Stats

- **Total Endpoints**: 50+ APIs
- **Authentication**: JWT Bearer Token
- **File Upload**: Multipart form-data support
- **Pagination**: Query parameters
- **Error Handling**: Standardized responses
- **Validation**: Comprehensive input validation

## 🔧 Development

### Thêm documentation cho API mới:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags: [YourTag]
 *     summary: Mô tả ngắn
 *     description: Mô tả chi tiết
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint', controller.method);
```

### Tạo schema mới:

```javascript
// Trong swagger.js
schemas: {
  YourSchema: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' }
    }
  }
}
```

## 🚀 Production Notes

- Disable Swagger UI trong production nếu cần
- Sử dụng environment variables cho URLs
- Rate limit cho `/api/docs` endpoints
- Cache API spec để tăng performance

## 📞 Support

- **Swagger Official**: https://swagger.io/docs/
- **OpenAPI 3.0 Spec**: https://spec.openapis.org/oas/v3.0.3
- **Express Integration**: https://github.com/scottie1984/swagger-ui-express

---
*API Documentation được tạo tự động từ JSDoc comments trong source code* 📚