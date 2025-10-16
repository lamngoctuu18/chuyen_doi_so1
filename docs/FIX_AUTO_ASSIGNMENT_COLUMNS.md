# Fix: AutoAssignment - Tên cột database

## Vấn đề
```
Error: Unknown column 'svhd.giang_vien_huong_dan' in 'field list'
```

## Nguyên nhân
Tên cột trong bảng `sinh_vien_huong_dan` không khớp với tên trong query:

**Tên sai (trong code):**
- `giang_vien_huong_dan` 
- `vi_tri_mong_muon`
- `sinh_vien_id`

**Tên đúng (trong database):**
- `ma_giang_vien`, `ten_giang_vien`
- `vi_tri_thuc_tap`
- `ma_sinh_vien`

## Giải pháp

### File: `backend/src/controllers/AutoAssignmentController.js`

**1. Query lấy sinh viên:**
```javascript
// TRƯỚC (sai)
SELECT sv.*, svhd.giang_vien_huong_dan, svhd.doanh_nghiep_thuc_tap, svhd.vi_tri_mong_muon
FROM sinh_vien sv
LEFT JOIN sinh_vien_huong_dan svhd ON sv.id = svhd.sinh_vien_id

// SAU (đúng)
SELECT sv.*, svhd.ma_giang_vien, svhd.doanh_nghiep_thuc_tap, svhd.vi_tri_thuc_tap
FROM sinh_vien sv
LEFT JOIN sinh_vien_huong_dan svhd ON sv.ma_sinh_vien = svhd.ma_sinh_vien
```

**2. Kiểm tra sinh viên đã có GV:**
```javascript
// TRƯỚC
if (student.giang_vien_huong_dan) { ... }

// SAU
if (student.ma_giang_vien) { ... }
```

**3. Update GV cho sinh viên:**
```javascript
// TRƯỚC
UPDATE sinh_vien_huong_dan 
SET giang_vien_huong_dan = ?
WHERE sinh_vien_id = ?

// SAU
UPDATE sinh_vien_huong_dan 
SET ma_giang_vien = ?, ten_giang_vien = ?
WHERE ma_sinh_vien = ?
```

**4. Lấy vị trí mong muốn:**
```javascript
// TRƯỚC
const viTriMongMuon = (student.vi_tri_mong_muon || '').toLowerCase().trim();

// SAU
const viTriMongMuon = (student.vi_tri_thuc_tap || '').toLowerCase().trim();
```

**5. Update DN cho sinh viên:**
```javascript
// TRƯỚC
UPDATE sinh_vien_huong_dan 
SET doanh_nghiep_thuc_tap = ?
WHERE sinh_vien_id = ?

// SAU
UPDATE sinh_vien_huong_dan 
SET doanh_nghiep_thuc_tap = ?
WHERE ma_sinh_vien = ?
```

## Cấu trúc bảng sinh_vien_huong_dan

```sql
CREATE TABLE sinh_vien_huong_dan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ma_giang_vien VARCHAR(20),           -- Mã GV
  ten_giang_vien VARCHAR(100),         -- Tên GV
  ma_sinh_vien VARCHAR(20) UNIQUE,     -- Mã SV (join key)
  ho_ten_sinh_vien VARCHAR(100),
  email_sinh_vien VARCHAR(100),
  so_dien_thoai_sinh_vien VARCHAR(20),
  lop_sinh_vien VARCHAR(50),
  ngay_sinh_sinh_vien DATE,
  vi_tri_thuc_tap VARCHAR(200),        -- Vị trí thực tập/mong muốn
  doanh_nghiep_thuc_tap VARCHAR(200),  -- Tên DN
  nguyen_vong_thuc_tap VARCHAR(50),    -- Nguyen vọng (khoa_gioi_thieu/tu_lien_he)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### Test case 1: Phân công thành công
```
✅ 50 sinh viên
✅ 3 giảng viên
✅ 5 doanh nghiệp
→ Kết quả: Mỗi GV ~16-17 SV, DN được match theo vị trí
```

### Test case 2: Query database trực tiếp
```sql
-- Kiểm tra sau phân công
SELECT 
  sv.ma_sinh_vien,
  svhd.ma_giang_vien,
  svhd.doanh_nghiep_thuc_tap
FROM sinh_vien sv
LEFT JOIN sinh_vien_huong_dan svhd 
  ON sv.ma_sinh_vien = svhd.ma_sinh_vien
WHERE svhd.ma_giang_vien IS NOT NULL;
```

## Status
✅ **Fixed** - Server chạy thành công, API `/api/auto-assignment` hoạt động

## Related Files
- `backend/src/controllers/AutoAssignmentController.js` (fixed)
- `backend/src/models/SinhVienHuongDan.js` (reference)
- `docs/AUTO_ASSIGNMENT_FEATURE.md` (documentation)
