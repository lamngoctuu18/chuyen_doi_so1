// Model: DoanhNghiep (Company)
// File: src/models\DoanhNghiep.js

const db = require('../database/connection');

class DoanhNghiep {
    constructor(data) {
        this.id = data.id;
        this.accountId = data.account_id;
        this.maDoanhNghiep = data.ma_doanh_nghiep;
        this.tenCongTy = data.ten_cong_ty;
        this.tenNguoiLienHe = data.ten_nguoi_lien_he;
        this.chucVuNguoiLienHe = data.chuc_vu_nguoi_lien_he;
        this.diaChiCongTy = data.dia_chi_cong_ty;
        this.soDienThoai = data.so_dien_thoai;
        this.emailCongTy = data.email_cong_ty;
        this.website = data.website;
        this.linhVucHoatDong = data.linh_vuc_hoat_dong;
        this.quyMoNhanSu = data.quy_mo_nhan_su;
        this.viTriTuyenDung = data.vi_tri_tuyen_dung;
        this.moTaCongTy = data.mo_ta_cong_ty;
        this.yeuCauThucTap = data.yeu_cau_thuc_tap;
        this.soLuongNhanThucTap = data.so_luong_nhan_thuc_tap;
        this.thoiGianThucTap = data.thoi_gian_thuc_tap;
        this.diaChiThucTap = data.dia_chi_thuc_tap;
        this.trangThaiHopTac = data.trang_thai_hop_tac;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    // Tạo profile doanh nghiệp mới
    static async create(doanhNghiepData) {
        const {
            accountId,
            maDoanhNghiep,
            tenCongTy,
            tenNguoiLienHe,
            chucVuNguoiLienHe = null,
            diaChiCongTy,
            soDienThoai,
            emailCongTy = null,
            website = null,
            linhVucHoatDong = null,
            quyMoNhanSu = null,
            viTriTuyenDung = null,
            moTaCongTy = null,
            yeuCauThucTap = null,
            soLuongNhanThucTap = 0,
            thoiGianThucTap = null,
            diaChiThucTap = null,
            trangThaiHopTac = 'Đang hợp tác'
        } = doanhNghiepData;

        const query = `
            INSERT INTO doanh_nghiep 
            (account_id, ma_doanh_nghiep, ten_cong_ty, ten_nguoi_lien_he, chuc_vu_nguoi_lien_he,
             dia_chi_cong_ty, so_dien_thoai, email_cong_ty, website, linh_vuc_hoat_dong,
             quy_mo_nhan_su, vi_tri_tuyen_dung, mo_ta_cong_ty, yeu_cau_thuc_tap, so_luong_nhan_thuc_tap,
             thoi_gian_thuc_tap, dia_chi_thuc_tap, trang_thai_hop_tac) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            const result = await db.query(query, [
                accountId, maDoanhNghiep, tenCongTy, tenNguoiLienHe, chucVuNguoiLienHe,
                diaChiCongTy, soDienThoai, emailCongTy, website, linhVucHoatDong,
                quyMoNhanSu, viTriTuyenDung, moTaCongTy, yeuCauThucTap, soLuongNhanThucTap,
                thoiGianThucTap, diaChiThucTap, trangThaiHopTac
            ]);

            return {
                success: true,
                insertId: result.insertId,
                message: 'Profile doanh nghiệp được tạo thành công'
            };
        } catch (error) {
            console.error('Error creating doanh nghiep profile:', error);
            throw error;
        }
    }

    // Tạo nhiều doanh nghiệp (bulk insert)
    static async createMany(doanhNghiepDataArray) {
        try {
            const results = {
                created: 0,
                updated: 0,
                errors: []
            };

            for (const doanhNghiepData of doanhNghiepDataArray) {
                try {
                    // Kiểm tra doanh nghiệp đã tồn tại
                    const existing = await this.findByMaDoanhNghiep(doanhNghiepData.maDoanhNghiep);
                    
                    if (existing) {
                        // Cập nhật thông tin doanh nghiệp
                        await this.updateByMaDoanhNghiep(doanhNghiepData.maDoanhNghiep, doanhNghiepData);
                        results.updated++;
                    } else {
                        // Tạo profile mới
                        await this.create(doanhNghiepData);
                        results.created++;
                    }
                } catch (error) {
                    results.errors.push({
                        maDoanhNghiep: doanhNghiepData.maDoanhNghiep,
                        error: error.message
                    });
                }
            }

            return results;
        } catch (error) {
            throw error;
        }
    }

    // Tìm doanh nghiệp theo mã doanh nghiệp
    static async findByMaDoanhNghiep(maDoanhNghiep) {
        const query = 'SELECT * FROM doanh_nghiep WHERE ma_doanh_nghiep = ?';
        
        try {
            const rows = await db.query(query, [maDoanhNghiep]);
            return rows.length > 0 ? new DoanhNghiep(rows[0]) : null;
        } catch (error) {
            console.error('Error finding doanh nghiep by ma doanh nghiep:', error);
            throw error;
        }
    }

    // Tìm doanh nghiệp theo account_id
    static async findByAccountId(accountId) {
        const query = 'SELECT * FROM doanh_nghiep WHERE account_id = ?';
        
        try {
            const rows = await db.query(query, [accountId]);
            return {
                success: rows.length > 0,
                data: rows.length > 0 ? rows[0] : null,
                message: rows.length > 0 ? 'Tìm thấy doanh nghiệp' : 'Không tìm thấy doanh nghiệp'
            };
        } catch (error) {
            console.error('Error finding doanh nghiep by account ID:', error);
            return {
                success: false,
                data: null,
                message: 'Lỗi khi tìm doanh nghiệp'
            };
        }
    }

    // Cập nhật thông tin doanh nghiệp theo mã doanh nghiệp
    static async updateByMaDoanhNghiep(maDoanhNghiep, updateData) {
        const updateFields = [];
        const params = [];

        // Các trường có thể cập nhật
        const allowedFields = [
            'ten_cong_ty', 'ten_nguoi_lien_he', 'chuc_vu_nguoi_lien_he', 'dia_chi_cong_ty',
            'so_dien_thoai', 'email_cong_ty', 'website', 'linh_vuc_hoat_dong', 'quy_mo_nhan_su',
            'vi_tri_tuyen_dung', 'mo_ta_cong_ty', 'yeu_cau_thuc_tap', 'so_luong_nhan_thuc_tap', 
            'thoi_gian_thuc_tap', 'dia_chi_thuc_tap', 'trang_thai_hop_tac'
        ];

        allowedFields.forEach(field => {
            const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            if (updateData[camelCaseField] !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(updateData[camelCaseField]);
            }
        });

        if (updateFields.length === 0) {
            return { success: false, message: 'Không có dữ liệu để cập nhật' };
        }

        updateFields.push('updated_at = NOW()');
        const query = `UPDATE doanh_nghiep SET ${updateFields.join(', ')} WHERE ma_doanh_nghiep = ?`;
        params.push(maDoanhNghiep);

        try {
            const result = await db.query(query, params);
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 ? 'Cập nhật thành công' : 'Không tìm thấy doanh nghiệp'
            };
        } catch (error) {
            console.error('Error updating doanh nghiep:', error);
            throw error;
        }
    }

    // Lấy danh sách doanh nghiệp với phân trang
    static async getAll(page = 1, limit = 20, filters = {}) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT dn.*, acc.user_id, acc.email, acc.is_active,
                   COALESCE(sv_count.so_sinh_vien_thuc_tap, 0) as so_sinh_vien_thuc_tap
            FROM doanh_nghiep dn 
            JOIN accounts acc ON dn.account_id = acc.id 
            LEFT JOIN (
                SELECT doanh_nghiep_thuc_tap, COUNT(*) as so_sinh_vien_thuc_tap
                FROM sinh_vien_huong_dan 
                WHERE doanh_nghiep_thuc_tap IS NOT NULL AND doanh_nghiep_thuc_tap != ''
                GROUP BY doanh_nghiep_thuc_tap
            ) sv_count ON dn.ten_cong_ty = sv_count.doanh_nghiep_thuc_tap
            WHERE 1=1
        `;
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM doanh_nghiep dn 
            JOIN accounts acc ON dn.account_id = acc.id 
            WHERE 1=1
        `;
        
        const params = [];
        const countParams = [];

        // Áp dụng filters
        if (filters.linhVucHoatDong) {
            query += ' AND dn.linh_vuc_hoat_dong = ?';
            countQuery += ' AND dn.linh_vuc_hoat_dong = ?';
            params.push(filters.linhVucHoatDong);
            countParams.push(filters.linhVucHoatDong);
        }
        if (filters.trangThaiHopTac) {
            query += ' AND dn.trang_thai_hop_tac = ?';
            countQuery += ' AND dn.trang_thai_hop_tac = ?';
            params.push(filters.trangThaiHopTac);
            countParams.push(filters.trangThaiHopTac);
        }
        if (filters.quyMoNhanSu) {
            query += ' AND dn.quy_mo_nhan_su = ?';
            countQuery += ' AND dn.quy_mo_nhan_su = ?';
            params.push(filters.quyMoNhanSu);
            countParams.push(filters.quyMoNhanSu);
        }

        query += ' ORDER BY dn.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        try {
            const rows = await db.query(query, params);
            const countRows = await db.query(countQuery, countParams);
            
            const doanhNghieps = rows.map(row => ({
                ...new DoanhNghiep(row),
                userId: row.user_id,
                email: row.email,
                isActive: row.is_active,
                soSinhVienThucTap: row.so_sinh_vien_thuc_tap || 0
            }));

            return {
                doanhNghieps,
                pagination: {
                    page,
                    limit,
                    total: countRows[0].total,
                    totalPages: Math.ceil(countRows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting all doanh nghiep:', error);
            throw error;
        }
    }

    // Tìm kiếm doanh nghiệp
    static async search(keyword, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT dn.*, acc.user_id, acc.email, acc.is_active 
            FROM doanh_nghiep dn 
            JOIN accounts acc ON dn.account_id = acc.id 
            WHERE (dn.ma_doanh_nghiep LIKE ? OR dn.ten_cong_ty LIKE ? OR dn.ten_nguoi_lien_he LIKE ? OR dn.linh_vuc_hoat_dong LIKE ?)
            ORDER BY dn.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM doanh_nghiep dn 
            JOIN accounts acc ON dn.account_id = acc.id 
            WHERE (dn.ma_doanh_nghiep LIKE ? OR dn.ten_cong_ty LIKE ? OR dn.ten_nguoi_lien_he LIKE ? OR dn.linh_vuc_hoat_dong LIKE ?)
        `;

        const searchTerm = `%${keyword}%`;
        const params = [searchTerm, searchTerm, searchTerm, searchTerm, limit, offset];
        const countParams = [searchTerm, searchTerm, searchTerm, searchTerm];

        try {
            const rows = await db.query(query, params);
            const countRows = await db.query(countQuery, countParams);
            
            const doanhNghieps = rows.map(row => ({
                ...new DoanhNghiep(row),
                userId: row.user_id,
                email: row.email,
                isActive: row.is_active
            }));

            return {
                doanhNghieps,
                pagination: {
                    page,
                    limit,
                    total: countRows[0].total,
                    totalPages: Math.ceil(countRows[0].total / limit)
                }
            };
        } catch (error) {
            console.error('Error searching doanh nghiep:', error);
            throw error;
        }
    }

    // Cập nhật doanh nghiệp theo account_id
    static async updateByAccountId(accountId, updateData) {
        try {
            // Build dynamic SQL update query
            const fields = [];
            const values = [];
            
            if (updateData.ho_ten !== undefined) {
                fields.push('ho_ten = ?');
                values.push(updateData.ho_ten);
            }
            if (updateData.email !== undefined) {
                fields.push('email = ?');
                values.push(updateData.email);
            }
            if (updateData.so_dien_thoai !== undefined) {
                fields.push('so_dien_thoai = ?');
                values.push(updateData.so_dien_thoai);
            }
            if (updateData.dia_chi !== undefined) {
                fields.push('dia_chi = ?');
                values.push(updateData.dia_chi);
            }
            if (updateData.ten_cong_ty !== undefined) {
                fields.push('ten_cong_ty = ?');
                values.push(updateData.ten_cong_ty);
            }
            if (updateData.dia_chi_cong_ty !== undefined) {
                fields.push('dia_chi_cong_ty = ?');
                values.push(updateData.dia_chi_cong_ty);
            }
            if (updateData.so_dien_thoai_cong_ty !== undefined) {
                fields.push('so_dien_thoai_cong_ty = ?');
                values.push(updateData.so_dien_thoai_cong_ty);
            }
            if (updateData.email_cong_ty !== undefined) {
                fields.push('email_cong_ty = ?');
                values.push(updateData.email_cong_ty);
            }
            if (updateData.website !== undefined) {
                fields.push('website = ?');
                values.push(updateData.website);
            }
            if (updateData.linh_vuc_hoat_dong !== undefined) {
                fields.push('linh_vuc_hoat_dong = ?');
                values.push(updateData.linh_vuc_hoat_dong);
            }
            if (updateData.so_nhan_vien !== undefined) {
                fields.push('so_nhan_vien = ?');
                values.push(updateData.so_nhan_vien);
            }
            if (updateData.mo_ta !== undefined) {
                fields.push('mo_ta = ?');
                values.push(updateData.mo_ta);
            }

            if (fields.length === 0) {
                return {
                    success: false,
                    message: 'Không có dữ liệu để cập nhật'
                };
            }

            values.push(accountId);
            const query = `UPDATE doanh_nghiep SET ${fields.join(', ')} WHERE account_id = ?`;
            
            const result = await db.query(query, values);
            
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 ? 'Cập nhật thành công' : 'Không tìm thấy doanh nghiệp',
                data: result
            };
        } catch (error) {
            console.error('Error updating doanh nghiep by account id:', error);
            return {
                success: false,
                message: 'Lỗi khi cập nhật thông tin doanh nghiệp'
            };
        }
    }

    // Đồng bộ doanh nghiệp từ dữ liệu sinh viên hướng dẫn
    static async syncFromSinhVienHuongDan() {
        try {
            console.log('🔄 Bắt đầu đồng bộ doanh nghiệp từ sinh viên hướng dẫn...');
            
            // Lấy danh sách doanh nghiệp từ sinh_vien_huong_dan mà chưa có trong bảng doanh_nghiep
            const missingCompaniesQuery = `
                SELECT DISTINCT doanh_nghiep_thuc_tap, COUNT(*) as so_sinh_vien
                FROM sinh_vien_huong_dan 
                WHERE doanh_nghiep_thuc_tap IS NOT NULL 
                  AND doanh_nghiep_thuc_tap != ''
                  AND doanh_nghiep_thuc_tap NOT IN (
                      SELECT ten_cong_ty FROM doanh_nghiep WHERE ten_cong_ty IS NOT NULL
                  )
                GROUP BY doanh_nghiep_thuc_tap
            `;
            
            const missingCompanies = await db.query(missingCompaniesQuery);
            console.log(`📊 Tìm thấy ${missingCompanies.length} doanh nghiệp cần tạo mới`);
            
            let createdCount = 0;
            for (const company of missingCompanies) {
                const companyName = company.doanh_nghiep_thuc_tap;
                const studentCount = company.so_sinh_vien;
                
                // Tạo account cho doanh nghiệp
                const email = `${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}@company.com`;
                const accountId = `DN${Date.now()}${Math.floor(Math.random() * 1000)}`;
                
                try {
                    // Tạo account trước
                    await db.query(
                        'INSERT INTO accounts (user_id, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
                        [accountId, email, 'temp_hash', 'doanh_nghiep', true]
                    );
                    
                    // Tạo profile doanh nghiệp
                    const maDoanhNghiep = `DN${String(createdCount + 1).padStart(3, '0')}`;
                    await db.query(`
                        INSERT INTO doanh_nghiep (
                            account_id, ma_doanh_nghiep, ten_cong_ty, ten_nguoi_lien_he,
                            dia_chi_cong_ty, so_dien_thoai, email_cong_ty,
                            linh_vuc_hoat_dong, so_luong_nhan_thuc_tap, trang_thai_hop_tac
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        accountId, maDoanhNghiep, companyName, 'Người liên hệ',
                        'Địa chỉ cần cập nhật', '0000000000', email,
                        'Công nghệ thông tin', studentCount, 'Đang hợp tác'
                    ]);
                    
                    createdCount++;
                    console.log(`✅ Tạo doanh nghiệp: ${companyName} (${studentCount} sinh viên)`);
                } catch (error) {
                    console.error(`❌ Lỗi tạo doanh nghiệp ${companyName}:`, error.message);
                }
            }
            
            return {
                success: true,
                message: `Đồng bộ thành công ${createdCount}/${missingCompanies.length} doanh nghiệp`,
                created: createdCount
            };
        } catch (error) {
            console.error('❌ Lỗi đồng bộ doanh nghiệp:', error);
            throw error;
        }
    }

    // Xóa doanh nghiệp
    static async delete(accountId) {
        const query = 'DELETE FROM doanh_nghiệp WHERE account_id = ?';
        
        try {
            const result = await db.query(query, [accountId]);
            return {
                success: result.affectedRows > 0,
                message: result.affectedRows > 0 ? 'Xóa doanh nghiệp thành công' : 'Không tìm thấy doanh nghiệp'
            };
        } catch (error) {
            console.error('Error deleting doanh nghiep:', error);
            throw error;
        }
    }
}

module.exports = DoanhNghiep;