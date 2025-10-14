# 🔧 Khắc Phục Swagger UI Không Hiện API

## ❓ Vấn Đề

Các API mới (`studentReports.js`, `passwordReset.js`) **không hiển thị** trên Swagger UI tại `http://localhost:3001/api/docs`

---

## ✅ Giải Pháp Đã Áp Dụng

### 1. **Kiểm tra Routes đã được đăng ký** ✓
```javascript
// File: backend/server.js
app.use('/api/student-reports', require('./src/routes/studentReports'));
app.use('/api/password-reset', require('./src/routes/passwordReset'));
```

### 2. **Cập nhật đường dẫn apis trong swagger.js** ✓
```javascript
// File: backend/src/config/swagger.js
apis: [
  './src/routes/*.js',        // Tất cả files trong routes
  './src/routes/**/*.js',     // Tất cả files trong subdirectories
  './src/controllers/*.js',   // Controllers
  './server.js'               // Server file
]
```

### 3. **Restart Server** ✓
Server cần **restart hoàn toàn** sau khi thay đổi:
- Swagger configuration (`swagger.js`)
- Route files với JSDoc comments
- Server.js (route registration)

---

## 🔍 Kiểm Tra Từng Bước

### Bước 1: Verify Routes Loaded
Mở terminal và chạy:
```bash
cd backend
node -e "const app = require('./server'); console.log('Routes loaded');"
```

Nếu không có lỗi → Routes OK ✓

### Bước 2: Check Swagger Config
```bash
cd backend
node -e "const swagger = require('./src/config/swagger'); console.log('Specs:', Object.keys(swagger.specs));"
```

Output phải có: `paths`, `components`, `tags`

### Bước 3: Verify JSDoc Syntax
Mở file `studentReports.js` và kiểm tra:
```javascript
/**
 * @swagger
 * /api/student-reports/upload:    ← Đường dẫn PHẢI đúng
 *   post:
 *     tags: [Nộp Báo Cáo]          ← Tag PHẢI có trong swagger.js
 *     summary: Upload báo cáo       ← Mô tả ngắn
 *     ...
 */
router.post('/upload', ...);       ← Route PHẢI khớp với path
```

**Lưu ý quan trọng:**
- ✅ Path trong JSDoc: `/api/student-reports/upload` (full path)
- ✅ Route handler: `router.post('/upload', ...)`  
- ✅ Server.js: `app.use('/api/student-reports', router)`

### Bước 4: Restart Server Đúng Cách

**Windows PowerShell:**
```powershell
cd backend
# Dừng tất cả Node processes
Get-Process -Name node | Stop-Process -Force

# Đợi 2 giây
Start-Sleep -Seconds 2

# Start lại
node server.js
```

**Linux/Mac:**
```bash
cd backend
# Tìm và kill process
pkill -f "node server.js"

# Start lại
node server.js
```

**Hoặc dùng Ctrl+C và restart:**
```bash
cd backend
# Nhấn Ctrl+C để dừng
# Sau đó:
node server.js
```

### Bước 5: Xóa Cache Browser
1. Mở `http://localhost:3001/api/docs`
2. Nhấn **Ctrl + Shift + R** (Windows/Linux)
3. Hoặc **Cmd + Shift + R** (Mac)
4. Hoặc **Ctrl + F5** (Hard refresh)

### Bước 6: Kiểm tra Console Browser
1. Mở `http://localhost:3001/api/docs`
2. Nhấn **F12** để mở DevTools
3. Xem tab **Console** có lỗi không
4. Xem tab **Network** → Check request `/api-docs/swagger.json`

---

## 🐛 Các Lỗi Thường Gặp

### Lỗi 1: "Cannot GET /api/student-reports/upload"
**Nguyên nhân:** Routes chưa được đăng ký trong `server.js`

**Giải pháp:**
```javascript
// File: backend/server.js
// Thêm dòng này TRƯỚC app.listen()
app.use('/api/student-reports', require('./src/routes/studentReports'));
```

### Lỗi 2: APIs không hiện trên Swagger UI
**Nguyên nhân:** 
- JSDoc syntax sai
- Tag không tồn tại trong `swagger.js`
- Server chưa restart
- Cache browser

**Giải pháp:**
1. Kiểm tra JSDoc syntax (xem Bước 3)
2. Kiểm tra tag trong `swagger.js` → `tags` array
3. Restart server (xem Bước 4)
4. Xóa cache browser (xem Bước 5)

### Lỗi 3: "Failed to load API definition"
**Nguyên nhân:** 
- Swagger config sai
- Đường dẫn `apis` không tìm thấy files

**Giải pháp:**
```javascript
// File: backend/src/config/swagger.js
apis: [
  './src/routes/*.js',      // ← Đảm bảo đường dẫn đúng
  './src/routes/**/*.js',
  './server.js'
]
```

### Lỗi 4: Schema undefined ($ref not found)
**Nguyên nhân:** Schema được reference nhưng chưa định nghĩa

**Ví dụ lỗi:**
```yaml
schema:
  $ref: '#/components/schemas/StudentReport'  ← Schema này phải có
```

**Giải pháp:**
Thêm schema vào `swagger.js`:
```javascript
components: {
  schemas: {
    StudentReport: {    // ← Phải khớp tên
      type: 'object',
      properties: { ... }
    }
  }
}
```

---

## 📝 Checklist Đầy Đủ

Kiểm tra từng mục sau:

### Server & Routes
- [ ] `server.js` có đăng ký routes `/api/student-reports` và `/api/password-reset`
- [ ] Files `studentReports.js` và `passwordReset.js` tồn tại trong `src/routes/`
- [ ] Không có lỗi khi start server
- [ ] Server đang chạy tại `http://localhost:3001`

### Swagger Configuration
- [ ] File `swagger.js` có cấu hình `apis` đúng
- [ ] Tất cả tags được dùng đã có trong `tags` array
- [ ] Tất cả schemas được reference đã có trong `components/schemas`
- [ ] Không có lỗi syntax trong `swagger.js`

### JSDoc Comments
- [ ] Mỗi endpoint có `@swagger` comment đầy đủ
- [ ] Path trong JSDoc khớp với route đăng ký
- [ ] Tags trong JSDoc có trong `swagger.js`
- [ ] Schemas được reference đúng (`$ref`)

### Browser
- [ ] Đã xóa cache browser (Ctrl + Shift + R)
- [ ] Console không có lỗi JavaScript
- [ ] Network tab không có lỗi 404/500
- [ ] Đã thử browser khác (Chrome, Firefox, Edge)

### Testing
- [ ] Truy cập `http://localhost:3001/api/docs` thành công
- [ ] Thấy tags "Nộp Báo Cáo" và "Đổi Mật Khẩu"
- [ ] Các endpoints hiển thị đầy đủ
- [ ] "Try it out" hoạt động

---

## 🧪 Test Thủ Công

### Test 1: Kiểm tra Swagger JSON
Mở browser và truy cập:
```
http://localhost:3001/api-docs/swagger.json
```

Tìm kiếm trong JSON:
- `"paths"` → Phải có `/api/student-reports/upload`, `/api/password-reset/request`, etc.
- `"tags"` → Phải có `"Nộp Báo Cáo"` và `"Đổi Mật Khẩu"`
- `"components"` → `"schemas"` → Phải có `StudentReport`, `PasswordResetRequest`, etc.

Nếu **KHÔNG có** → Vấn đề ở **JSDoc parsing** hoặc **swagger config**

Nếu **CÓ** → Vấn đề ở **Swagger UI rendering** (cache browser)

### Test 2: Test API trực tiếp
```bash
# Test Upload endpoint
curl -X POST http://localhost:3001/api/student-reports/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "ma_sinh_vien=SV001" \
  -F "dot_thuc_tap_id=1" \
  -F "loai_bao_cao=tuan" \
  -F "report_file=@test.pdf"

# Test Password Reset
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email": "student@dainam.edu.vn"}'
```

Nếu API **hoạt động** nhưng **không hiện trên Swagger** → Vấn đề ở **JSDoc** hoặc **Swagger config**

---

## 🎯 Giải Pháp Cuối Cùng

Nếu đã thử tất cả mà vẫn không được, làm theo thứ tự:

### 1. Clean Install
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm install swagger-jsdoc swagger-ui-express
```

### 2. Verify Dependencies
```bash
cd backend
npm list swagger-jsdoc swagger-ui-express
```

Output phải có:
```
├── swagger-jsdoc@6.x.x
└── swagger-ui-express@5.x.x
```

### 3. Restart Everything
```powershell
# Windows
cd backend
Get-Process -Name node | Stop-Process -Force
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
node server.js
```

### 4. Hard Refresh Browser
1. **Chrome/Edge:**
   - Nhấn `Ctrl + Shift + Delete`
   - Chọn "Cached images and files"
   - Click "Clear data"
   - Reload trang

2. **Firefox:**
   - Nhấn `Ctrl + Shift + Delete`
   - Chọn "Cache"
   - Click "Clear Now"
   - Reload trang

3. **Incognito/Private Mode:**
   - Mở cửa sổ riêng tư
   - Truy cập `http://localhost:3001/api/docs`

---

## 📞 Nếu Vẫn Không Được

### Debug Mode
Thêm logging vào `swagger.js`:
```javascript
const specs = swaggerJsdoc(options);

// Thêm dòng này
console.log('📚 Swagger Specs Generated:');
console.log('- Total paths:', Object.keys(specs.paths || {}).length);
console.log('- Tags:', (specs.tags || []).map(t => t.name).join(', '));
console.log('- Schemas:', Object.keys(specs.components?.schemas || {}).join(', '));

module.exports = { specs, swaggerUi, swaggerOptions };
```

Restart server và xem console output.

### Contact Support
Nếu vẫn gặp vấn đề:
1. Chụp ảnh màn hình Swagger UI
2. Copy log từ server console
3. Copy log từ browser console (F12)
4. Gửi qua:
   - Email: admin@dainam.edu.vn
   - GitHub Issues: [link-to-repo]/issues

---

## ✅ Kết Luận

Sau khi làm theo hướng dẫn này:
- ✓ Server đã restart với config mới
- ✓ Swagger UI đã load lại
- ✓ Tất cả 14 API endpoints hiển thị đầy đủ
- ✓ "Try it out" hoạt động
- ✓ Schemas đầy đủ

**Truy cập:**
```
http://localhost:3001/api/docs
```

**Kết quả mong đợi:**
- Tag "Nộp Báo Cáo" có 8 endpoints
- Tag "Đổi Mật Khẩu" có 6 endpoints
- Tất cả schemas hiển thị trong "Schemas" dropdown
- Authentication với Bearer token hoạt động

---

## 📖 Tài Liệu Liên Quan

- [SWAGGER_UPDATE_SUMMARY.md](./SWAGGER_UPDATE_SUMMARY.md) - Chi tiết các API đã thêm
- [NEW_API_DOCUMENTATION.md](./NEW_API_DOCUMENTATION.md) - Documentation đầy đủ
- [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - Hướng dẫn sử dụng nhanh
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - 23 test cases

---

**Cập nhật lần cuối:** 2025-01-14
**Trạng thái:** ✅ Đã giải quyết
