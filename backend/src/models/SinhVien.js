const { query } = require('../database/connection');

class SinhVien {
    constructor(data = {}) {
        this.id = data.id;
        this.account_id = data.account_id;
        this.ma_sinh_vien = data.ma_sinh_vien;
        this.ho_ten = data.ho_ten;
        this.lop = data.lop;
        this.khoa = data.khoa;
        this.nganh = data.nganh;
        this.khoa_hoc = data.khoa_hoc;
        this.ngay_sinh = data.ngay_sinh;
        this.gioi_tinh = data.gioi_tinh;
        this.dia_chi = data.dia_chi;
        this.so_dien_thoai = data.so_dien_thoai;
        this.email_ca_nhan = data.email_ca_nhan;
        this.gpa = data.gpa;
        this.tinh_trang_hoc_tap = data.tinh_trang_hoc_tap;
        this.nguyen_vong_thuc_tap = data.nguyen_vong_thuc_tap;
        this.vi_tri_muon_ung_tuyen_thuc_tap = data.vi_tri_muon_ung_tuyen_thuc_tap;
        this.don_vi_thuc_tap = data.don_vi_thuc_tap;
        this.cong_ty_tu_lien_he = data.cong_ty_tu_lien_he;
        this.dia_chi_cong_ty = data.dia_chi_cong_ty;
        this.nguoi_lien_he_cong_ty = data.nguoi_lien_he_cong_ty;
        this.sdt_nguoi_lien_he = data.sdt_nguoi_lien_he;
        this.cv_path = data.cv_path;
        this.trang_thai_phan_cong = data.trang_thai_phan_cong;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Tìm theo mã sinh viên
    static async findByMaSinhVien(maSinhVien) {
        try {
            const rows = await query('SELECT * FROM sinh_vien WHERE ma_sinh_vien = ? LIMIT 1', [maSinhVien]);
            return rows && rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error in findByMaSinhVien:', error);
            throw error;
        }
    }

    static async getByUserId(userId) {
        try {
            const sql = `SELECT sv.*, a.user_id FROM sinh_vien sv JOIN accounts a ON sv.account_id = a.id WHERE a.user_id = ? LIMIT 1`;
            const rows = await query(sql, [userId]);
            return rows && rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Error in getByUserId:', error);
            throw error;
        }
    }

    static async updateInternshipRegistration(userId, registrationData = {}) {
        try {
            const fields = [];
            const values = [];
            const allowed = ['nguyen_vong_thuc_tap', 'vi_tri_muon_ung_tuyen_thuc_tap', 'don_vi_thuc_tap', 'cong_ty_tu_lien_he', 'dia_chi_cong_ty', 'nguoi_lien_he_cong_ty', 'sdt_nguoi_lien_he', 'gpa', 'cv_path'];
            
            for (const k of allowed) {
                if (registrationData[k] !== undefined) {
                    fields.push(`sv.${k} = ?`);
                    values.push(registrationData[k]);
                }
            }
            
            if (!fields.length) {
                return { success: false, message: 'No fields to update' };
            }
            
            const sql = `UPDATE sinh_vien sv JOIN accounts a ON sv.account_id = a.id SET ${fields.join(', ')}, sv.updated_at = NOW() WHERE a.user_id = ?`;
            values.push(userId);
            
            const res = await query(sql, values);
            if (!res || res.affectedRows === 0) {
                return { success: false, message: 'Không tìm thấy sinh viên' };
            }

                        const markSql = `UPDATE sinh_vien sv 
                                JOIN accounts a ON sv.account_id = a.id 
                                SET sv.trang_thai_phan_cong = 'da-phan-cong' 
                                WHERE a.user_id = ? 
                                    AND sv.vi_tri_muon_ung_tuyen_thuc_tap IS NOT NULL AND sv.vi_tri_muon_ung_tuyen_thuc_tap <> '' 
                                    AND sv.don_vi_thuc_tap IS NOT NULL AND sv.don_vi_thuc_tap <> ''
                                    AND sv.giang_vien_huong_dan IS NOT NULL AND sv.giang_vien_huong_dan <> ''
                                    AND sv.nguyen_vong_thuc_tap IS NOT NULL AND sv.nguyen_vong_thuc_tap <> ''
                                    AND sv.cv_path IS NOT NULL AND sv.cv_path <> ''`;
            
            await query(markSql, [userId]);
            
            const updatedStudent = await this.getByUserId(userId);
            return { success: true, data: updatedStudent };
        } catch (error) {
            console.error('Error in updateInternshipRegistration:', error);
            return { success: false, message: 'Lỗi cập nhật thông tin thực tập' };
        }
    }

    static async recalcAssignmentStatus() {
        try {
            const sql = `
                UPDATE sinh_vien 
                SET trang_thai_phan_cong = CASE 
                    WHEN vi_tri_muon_ung_tuyen_thuc_tap IS NOT NULL 
                         AND vi_tri_muon_ung_tuyen_thuc_tap <> '' 
                         AND don_vi_thuc_tap IS NOT NULL 
                         AND don_vi_thuc_tap <> ''
                         AND giang_vien_huong_dan IS NOT NULL 
                         AND giang_vien_huong_dan <> ''
                         AND nguyen_vong_thuc_tap IS NOT NULL 
                         AND nguyen_vong_thuc_tap <> ''
                         AND cv_path IS NOT NULL
                         AND cv_path <> ''
                    THEN 'da-phan-cong' 
                    ELSE 'chua-phan-cong' 
                END`;
            await query(sql);
            console.log('✅ Đã cập nhật trạng thái phân công cho tất cả sinh viên (cần đủ 5 thông tin: vị trí + doanh nghiệp + giảng viên + nguyện vọng + CV)');
        } catch (error) {
            console.error('Error in recalcAssignmentStatus:', error);
        }
    }

    static async findByAccountId(accountId) {
        try {
            const sql = 'SELECT * FROM sinh_vien WHERE account_id = ? LIMIT 1';
            const rows = await query(sql, [accountId]);
            return rows && rows.length ? new SinhVien(rows[0]) : null;
        } catch (error) {
            console.error('Error in findByAccountId:', error);
            throw error;
        }
    }

    static async updateByAccountId(accountId, data) {
        try {
            const fields = [];
            const values = [];
            const allowed = ['ho_ten', 'lop', 'khoa', 'nganh', 'khoa_hoc', 'ngay_sinh', 'gioi_tinh', 'dia_chi', 'so_dien_thoai', 'email_ca_nhan', 'gpa', 'tinh_trang_hoc_tap'];
            
            for (const k of allowed) {
                if (data[k] !== undefined) {
                    fields.push(`${k} = ?`);
                    values.push(data[k]);
                }
            }
            
            if (!fields.length) {
                return { success: false, message: 'No fields to update' };
            }
            
            const sql = `UPDATE sinh_vien SET ${fields.join(', ')}, updated_at = NOW() WHERE account_id = ?`;
            values.push(accountId);
            
            const result = await query(sql, values);
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error('Error in updateByAccountId:', error);
            throw error;
        }
    }

    // Cập nhật theo mã sinh viên (được dùng bởi ExcelImportService)
    static async updateByMaSinhVien(maSinhVien, data) {
        const mapping = {
            hoTen: 'ho_ten',
            emailCaNhan: 'email_ca_nhan',
            soDienThoai: 'so_dien_thoai',
            lop: 'lop',
            khoa: 'khoa',
            nganh: 'nganh',
            khoaHoc: 'khoa_hoc',
            ngaySinh: 'ngay_sinh',
            gioiTinh: 'gioi_tinh',
            diaChi: 'dia_chi',
            gpa: 'gpa',
            tinhTrangHocTap: 'tinh_trang_hoc_tap',
            viTriMuonUngTuyen: 'vi_tri_muon_ung_tuyen_thuc_tap',
            donViThucTap: 'don_vi_thuc_tap',
            nguyenVongThucTap: 'nguyen_vong_thuc_tap',
            giangVienHuongDan: 'giang_vien_huong_dan'
        };
        const fields = [];
        const values = [];
        for (const [src, dest] of Object.entries(mapping)) {
            if (data[src] !== undefined && data[src] !== null) {
                fields.push(`${dest} = ?`);
                values.push(data[src]);
            }
        }
        if (!fields.length) return { success: false, message: 'No fields to update' };
        const sql = `UPDATE sinh_vien SET ${fields.join(', ')}, updated_at = NOW() WHERE ma_sinh_vien = ?`;
        values.push(data.maSinhVien || maSinhVien);
        const result = await query(sql, values);
        return { success: true, affectedRows: result.affectedRows };
    }

    // Chỉ điền vào các cột đang trống (NULL hoặc '')
    static async fillEmptyColumnsByMaSinhVien(maSinhVien, data) {
        const mapping = {
            hoTen: 'ho_ten',
            emailCaNhan: 'email_ca_nhan',
            soDienThoai: 'so_dien_thoai',
            lop: 'lop',
            khoa: 'khoa',
            nganh: 'nganh',
            khoaHoc: 'khoa_hoc',
            ngaySinh: 'ngay_sinh',
            gioiTinh: 'gioi_tinh',
            diaChi: 'dia_chi',
            gpa: 'gpa',
            tinhTrangHocTap: 'tinh_trang_hoc_tap',
            viTriMuonUngTuyen: 'vi_tri_muon_ung_tuyen_thuc_tap',
            donViThucTap: 'don_vi_thuc_tap',
            nguyenVongThucTap: 'nguyen_vong_thuc_tap',
            giangVienHuongDan: 'giang_vien_huong_dan'
        };
        const sets = [];
        const values = [];
        for (const [src, dest] of Object.entries(mapping)) {
            const incoming = data[src];
            if (incoming !== undefined && incoming !== null && String(incoming).trim() !== '') {
                sets.push(`${dest} = IF(${dest} IS NULL OR ${dest} = '', ?, ${dest})`);
                values.push(incoming);
            }
        }
        if (!sets.length) return { success: false, message: 'No non-empty fields provided' };
        const sql = `UPDATE sinh_vien SET ${sets.join(', ')}, updated_at = NOW() WHERE ma_sinh_vien = ?`;
        values.push(data.maSinhVien || maSinhVien);
        const result = await query(sql, values);
        return { success: true, affectedRows: result.affectedRows };
    }

    static async getAllWithPagination(page = 1, limit = 10, search = '', nguyen_vong = '') {
        try {
            await this.recalcAssignmentStatus();
            
            const offset = (page - 1) * limit;
            
            let whereClause = '';
            const params = [];
            
            if (search) {
                whereClause += ' WHERE (sv.ho_ten LIKE ? OR sv.ma_sinh_vien LIKE ? OR sv.lop LIKE ? OR sv.khoa LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            if (nguyen_vong) {
                // accept both underscore and hyphen variants in DB
                const hyphen = nguyen_vong.replace(/_/g, '-');
                const underscore = nguyen_vong.replace(/-/g, '_');
                if (whereClause) {
                    whereClause += ' AND (sv.nguyen_vong_thuc_tap = ? OR sv.nguyen_vong_thuc_tap = ?)';
                } else {
                    whereClause += ' WHERE (sv.nguyen_vong_thuc_tap = ? OR sv.nguyen_vong_thuc_tap = ?)';
                }
                params.push(underscore, hyphen);
            }
            
            const countSql = `SELECT COUNT(*) as total FROM sinh_vien sv${whereClause}`;
            const countResult = await query(countSql, params);
            const total = countResult[0].total;
            
            const dataSql = `SELECT sv.*, a.user_id FROM sinh_vien sv JOIN accounts a ON sv.account_id = a.id${whereClause} ORDER BY sv.created_at DESC LIMIT ? OFFSET ?`;
            
            params.push(limit, offset);
            const students = await query(dataSql, params);
            
            return {
                data: students,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in getAllWithPagination:', error);
            throw error;
        }
    }

    static async getStatistics() {
        try {
            await this.recalcAssignmentStatus();
            
            const sql = `SELECT COUNT(*) as total, SUM(CASE WHEN trang_thai_phan_cong = 'da-phan-cong' THEN 1 ELSE 0 END) as da_phan_cong, SUM(CASE WHEN trang_thai_phan_cong = 'chua-phan-cong' THEN 1 ELSE 0 END) as chua_phan_cong, SUM(CASE WHEN nguyen_vong_thuc_tap = 'khoa_gioi_thieu' THEN 1 ELSE 0 END) as khoa_gioi_thieu, SUM(CASE WHEN nguyen_vong_thuc_tap = 'tu_lien_he' THEN 1 ELSE 0 END) as tu_lien_he FROM sinh_vien`;
            
            const rows = await query(sql);
            return rows && rows[0] ? rows[0] : { 
                total: 0, 
                da_phan_cong: 0, 
                chua_phan_cong: 0,
                khoa_gioi_thieu: 0,
                tu_lien_he: 0
            };
        } catch (error) {
            console.error('Error in getStatistics:', error);
            return { 
                total: 0, 
                da_phan_cong: 0, 
                chua_phan_cong: 0,
                khoa_gioi_thieu: 0,
                tu_lien_he: 0
            };
        }
    }
}

module.exports = SinhVien;