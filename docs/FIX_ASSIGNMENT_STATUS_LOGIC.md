# Sửa Logic Trạng Thái Phân Công Sinh Viên

## Vấn đề:
Sinh viên đã có đầy đủ thông tin (Giảng viên hướng dẫn, Nguyện vọng thực tập, Doanh nghiệp thực tập) nhưng cột "Trạng thái" vẫn hiển thị "Chưa phân công" thay vì "Đã phân công".

## Nguyên nhân:
Logic trong method `recalcAssignmentStatus()` chỉ kiểm tra 2/3 field:
- ✅ `vi_tri_muon_ung_tuyen_thuc_tap` (Vị trí mong muốn)
- ✅ `don_vi_thuc_tap` (Doanh nghiệp thực tập)
- ❌ **Thiếu**: `giang_vien_huong_dan` (Giảng viên hướng dẫn)

## Sửa chữa:

### 1. Cập nhật logic tính trạng thái - SinhVien.js:
**TRƯỚC:**
```sql
UPDATE sinh_vien 
SET trang_thai_phan_cong = CASE 
    WHEN vi_tri_muon_ung_tuyen_thuc_tap IS NOT NULL 
         AND vi_tri_muon_ung_tuyen_thuc_tap <> '' 
         AND don_vi_thuc_tap IS NOT NULL 
         AND don_vi_thuc_tap <> '' 
    THEN 'Đã phân công' 
    ELSE 'Chưa phân công' 
END
```

**SAU:**
```sql
UPDATE sinh_vien 
SET trang_thai_phan_cong = CASE 
    WHEN vi_tri_muon_ung_tuyen_thuc_tap IS NOT NULL 
         AND vi_tri_muon_ung_tuyen_thuc_tap <> '' 
         AND don_vi_thuc_tap IS NOT NULL 
         AND don_vi_thuc_tap <> ''
         AND giang_vien_huong_dan IS NOT NULL 
         AND giang_vien_huong_dan <> ''
    THEN 'Đã phân công' 
    ELSE 'Chưa phân công' 
END
```

### 2. Đảm bảo method được gọi sau mọi import - ImportController_new.js:
- ✅ `importPhanCong()`: đã có sẵn
- ✅ `importSinhVien()`: **đã thêm**  
- ✅ `importSinhVienProfile()`: **đã thêm**

## Điều kiện "Đã phân công" (tất cả 3 field phải có):
1. **Vị trí mong muốn** (`vi_tri_muon_ung_tuyen_thuc_tap`) ≠ NULL và ≠ rỗng
2. **Doanh nghiệp thực tập** (`don_vi_thuc_tap`) ≠ NULL và ≠ rỗng  
3. **Giảng viên hướng dẫn** (`giang_vien_huong_dan`) ≠ NULL và ≠ rỗng

## Kết quả mong đợi:
- Sinh viên trong ảnh (có đầy đủ 3 thông tin) → trạng thái tự động chuyển thành **"Đã phân công"**
- Method được gọi tự động sau mỗi lần import/cập nhật dữ liệu
- Log console sẽ hiển thị: `✅ Đã cập nhật trạng thái phân công sau import`

## Test:
1. Import file Excel có sinh viên với đầy đủ 3 thông tin
2. Hoặc cập nhật thủ công sinh viên với đầy đủ 3 field  
3. Kiểm tra cột "Trạng thái" đã chuyển thành "Đã phân công"