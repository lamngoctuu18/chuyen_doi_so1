const connection = require('../database/connection');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class InternshipBatchesController {
  // GET /api/internship-batches - Lấy danh sách đợt thực tập
  static async getAllBatches(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      let whereClause = 'WHERE 1=1';
      const queryParams = [];

      if (search) {
        whereClause += ' AND dt.ten_dot LIKE ?';
        queryParams.push(`%${search}%`);
      }
      if (status !== 'all') {
        whereClause += ' AND dt.trang_thai = ?';
        queryParams.push(status);
      }

      const listSql = `
        SELECT 
          dt.*,
          COALESCE(dt.so_sinh_vien_tham_gia, 0) AS soSinhVienThamGia,
          COALESCE(dt.so_giang_vien_huong_dan, 0) AS soGiangVienHuongDan,
          COALESCE(dt.so_doanh_nghiep_tham_gia, 0) AS soDoanhNghiepThamGia
        FROM dot_thuc_tap dt
        ${whereClause}
        ORDER BY dt.created_at DESC
        LIMIT ? OFFSET ?
      `;
      const countSql = `SELECT COUNT(*) AS total FROM dot_thuc_tap dt ${whereClause}`;

      const listParams = [...queryParams, limitNum, offset];
      const [countRow] = await connection.query(countSql, queryParams);
      const total = countRow ? Number(countRow.total) : 0;
      const batches = await connection.query(listSql, listParams);

      res.json({
        success: true,
        data: {
          batches,
          pagination: {
            current: pageNum,
            pageSize: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      console.error('❌ Get internship batches error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đợt thực tập' });
    }
  }

  // GET /api/internship-batches/:id - Lấy thông tin chi tiết đợt thực tập
  static async getBatchById(req, res) {
    try {
      const { id } = req.params;
      const sql = `SELECT dt.* FROM dot_thuc_tap dt WHERE dt.id = ?`;
      const [batch] = await connection.query(sql, [id]);

      if (!batch) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
      }

      // Lấy danh sách phân công nếu bảng tồn tại, nếu không thì trả về mảng rỗng
      let assignments = [];
      const assignmentsSql = `
        SELECT 
          pc.*,
          sv.ma_sinh_vien,
          sv.ho_ten AS ten_sinh_vien,
          sv.lop,
          dn.ma_doanh_nghiep,
          dn.ten_cong_ty,
          gv.ma_giang_vien,
          gv.ho_ten AS ten_giang_vien
        FROM phan_cong_thuc_tap pc
        INNER JOIN sinh_vien sv ON pc.sinh_vien_id = sv.id
        INNER JOIN doanh_nghiep dn ON pc.doanh_nghiep_id = dn.id
        LEFT JOIN giang_vien gv ON pc.giang_vien_id = gv.id
        WHERE pc.dot_thuc_tap_id = ?
        ORDER BY sv.ho_ten
      `;
      try {
        assignments = await connection.query(assignmentsSql, [id]);
      } catch (e) {
        if (!(e && e.code === 'ER_NO_SUCH_TABLE')) {
          throw e;
        }
      }

      res.json({ success: true, data: { ...batch, assignments } });
    } catch (error) {
      console.error('❌ Get internship batch error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin đợt thực tập' });
    }
  }

  // POST /api/internship-batches - Tạo đợt thực tập mới
  static async createBatch(req, res) {
    try {
      const { ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai = 'sap-mo' } = req.body;
      if (!ten_dot || !thoi_gian_bat_dau || !thoi_gian_ket_thuc) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
      }
      if (new Date(thoi_gian_bat_dau) >= new Date(thoi_gian_ket_thuc)) {
        return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' });
      }
      const sql = `
        INSERT INTO dot_thuc_tap (ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await connection.query(sql, [ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai]);
      res.status(201).json({ success: true, message: 'Tạo đợt thực tập thành công', data: { id: result.insertId, ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai } });
    } catch (error) {
      console.error('❌ Create internship batch error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo đợt thực tập' });
    }
  }

  // PUT /api/internship-batches/:id - Cập nhật thông tin đợt thực tập
  static async updateBatch(req, res) {
    try {
      const { id } = req.params;
      const { ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai } = req.body;

      const [existingBatch] = await connection.query('SELECT id FROM dot_thuc_tap WHERE id = ?', [id]);
      if (!existingBatch) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
      }
      if (thoi_gian_bat_dau && thoi_gian_ket_thuc && new Date(thoi_gian_bat_dau) >= new Date(thoi_gian_ket_thuc)) {
        return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' });
      }

      const sql = `
        UPDATE dot_thuc_tap SET
          ten_dot = ?,
          thoi_gian_bat_dau = ?,
          thoi_gian_ket_thuc = ?,
          mo_ta = ?,
          trang_thai = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await connection.query(sql, [ten_dot, thoi_gian_bat_dau, thoi_gian_ket_thuc, mo_ta, trang_thai, id]);
      res.json({ success: true, message: 'Cập nhật đợt thực tập thành công' });
    } catch (error) {
      console.error('❌ Update internship batch error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật đợt thực tập' });
    }
  }

  // DELETE /api/internship-batches/:id - Xóa đợt thực tập
  static async deleteBatch(req, res) {
    try {
      const { id } = req.params;
      let count = 0;
      try {
        const [assignmentsCount] = await connection.query(
          'SELECT COUNT(*) as count FROM phan_cong_thuc_tap WHERE dot_thuc_tap_id = ?',
          [id]
        );
        count = assignmentsCount ? Number(assignmentsCount.count) : 0;
      } catch (e) {
        if (!(e && e.code === 'ER_NO_SUCH_TABLE')) {
          throw e;
        }
      }

      if (count > 0) {
        return res.status(400).json({ success: false, message: 'Không thể xóa đợt thực tập đã có phân công sinh viên' });
      }

      const result = await connection.query('DELETE FROM dot_thuc_tap WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
      }
      res.json({ success: true, message: 'Xóa đợt thực tập thành công' });
    } catch (error) {
      console.error('❌ Delete internship batch error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi xóa đợt thực tập' });
    }
  }

  // GET /api/internship-batches/stats - Thống kê đợt thực tập (đang mở/sắp mở)
  static async getBatchStats(req, res) {
    try {
      const sql = `
        SELECT 
          dt.*,
          COALESCE(dt.so_sinh_vien_tham_gia, 0) AS soSinhVienDaDangKy,
          COALESCE(dt.so_doanh_nghiep_tham_gia, 0) AS soDoanhNghiepThamGia,
          COALESCE(dt.so_giang_vien_huong_dan, 0) AS soGiangVienHuongDan
        FROM dot_thuc_tap dt
        WHERE dt.trang_thai IN ('sap-mo', 'dang-dien-ra')
        ORDER BY dt.thoi_gian_bat_dau ASC
      `;
      const batches = await connection.query(sql);
      res.json({ success: true, data: batches });
    } catch (error) {
      console.error('❌ Get batch stats error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê đợt thực tập' });
    }
  }

  // GET /api/internship-batches/active - Danh sách đợt thực tập đang mở/sắp mở
  static async getActiveBatches(req, res) {
    try {
      const sql = `
        SELECT 
          dt.*,
          COALESCE(dt.so_sinh_vien_tham_gia, 0) AS soSinhVienDaDangKy,
          COALESCE(dt.so_doanh_nghiep_tham_gia, 0) AS soDoanhNghiepThamGia,
          COALESCE(dt.so_giang_vien_huong_dan, 0) AS soGiangVienHuongDan
        FROM dot_thuc_tap dt
        WHERE dt.trang_thai IN ('sap-mo', 'dang-dien-ra')
        ORDER BY dt.thoi_gian_bat_dau ASC
      `;
      const batches = await connection.query(sql);
      res.json({ success: true, data: batches });
    } catch (error) {
      console.error('❌ Get active batches error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đợt thực tập đang mở' });
    }
  }

  // POST /api/internship-batches/:id/import-participants - Import danh sách tham gia
  static async importParticipants(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không có file được tải lên' });
      }
        const batchId = req.params.id;
        
        // Kiểm tra đợt thực tập có tồn tại không
        const [batch] = await connection.query('SELECT * FROM dot_thuc_tap WHERE id = ?', [batchId]);
        if (!batch) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
        }

        // Đọc file Excel
  const workbook = XLSX.readFile(req.file.path, { type: 'file' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
  // Use raw: false to get formatted text (dates etc.), defval: '' to include empty cells
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

        console.log(`📊 Import file info:`, {
          fileName: req.file.originalname,
          sheetName,
          totalRows: data.length,
          firstRowKeys: data.length > 0 ? Object.keys(data[0]) : [],
          sampleRow: data.length > 0 ? data[0] : null
        });

  let importCount = 0;
  let errorCount = 0;
  const errors = [];
  // Đếm số lượng sinh viên theo doanh nghiệp dựa trên file import (unique theo SV-DN)
  const companyStudentCounts = new Map(); // key: ma_doanh_nghiep, value: count
  const seenStudentCompanyPairs = new Set(); // to avoid double counting
        for (const row of data) {
          try {
            let hasProcessed = false;

            // Normalize header keys to be case-insensitive without accents
            const keys = Object.keys(row).reduce((acc, k) => {
              const normalized = k
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .toLowerCase()
                .trim();
              acc[normalized] = k;
              return acc;
            }, {});

            const pick = (variants) => {
              for (const v of variants) {
                if (keys[v]) return row[keys[v]];
              }
              return undefined;
            };

            // Import sinh viên (cột "Mã SV" hoặc tương tự)
            const maSinhVienRaw = pick(['mssv','ma sv','ma_sinh_vien','ma sinh vien'])
              ?? row['Mã SV'] ?? row['Mã sinh viên'] ?? row['Ma SV'] ?? row['ma_sinh_vien'];
            const maSinhVien = (maSinhVienRaw ?? '').toString().trim();
            if (maSinhVien) {
              await connection.query(
                'INSERT IGNORE INTO sinh_vien_thuc_tap (ma_sinh_vien, dot_thuc_tap_id) VALUES (?, ?)',
                [maSinhVien, batchId]
              );
              hasProcessed = true;
            }

            // Import giảng viên từ cột "Giảng viên hướng dẫn"
            const gvCell = pick(['giang vien huong dan','giang_vien_huong_dan','giang vien','giang vien hd','gv huong dan','giao vien huong dan'])
              ?? row['Giảng viên hướng dẫn'] ?? row['giang_vien_huong_dan'] ?? row['Giảng viên'];
            const giangVienHuongDan = (gvCell ?? '').toString().trim();
            if (giangVienHuongDan) {
              const [existingGV] = await connection.query(
                'SELECT ma_giang_vien FROM giang_vien WHERE ho_ten LIKE ? LIMIT 1',
                [`%${giangVienHuongDan}%`]
              );
              if (existingGV) {
                await connection.query(
                  'INSERT IGNORE INTO giang_vien_huong_dan (ma_giang_vien, dot_thuc_tap_id) VALUES (?, ?)',
                  [existingGV.ma_giang_vien, batchId]
                );
                hasProcessed = true;
              }
            }

            // Import doanh nghiệp từ cột "Doanh nghiệp thực tập"
            const dnCell = pick(['doanh nghiep thuc tap','doanh_nghiep_thuc_tap','doanh nghiep','cong ty','ten doanh nghiep'])
              ?? row['Doanh nghiệp thực tập'] ?? row['doanh_nghiep_thuc_tap'] ?? row['Doanh nghiệp'];
            const doanhNghiepThucTap = (dnCell ?? '').toString().trim();
            if (doanhNghiepThucTap) {
              const [existingDN] = await connection.query(
                'SELECT ma_doanh_nghiep FROM doanh_nghiep WHERE ten_cong_ty LIKE ? LIMIT 1',
                [`%${doanhNghiepThucTap}%`]
              );
              if (existingDN) {
                await connection.query(
                  'INSERT IGNORE INTO doanh_nghiep_thuc_tap (ma_doanh_nghiep, dot_thuc_tap_id) VALUES (?, ?)',
                  [existingDN.ma_doanh_nghiep, batchId]
                );
                hasProcessed = true;
                // Nếu dòng có cả mã SV và DN, ghi nhận unique pair để tăng đếm
                if (maSinhVien) {
                  const pairKey = `${maSinhVien}|${existingDN.ma_doanh_nghiep}`;
                  if (!seenStudentCompanyPairs.has(pairKey)) {
                    seenStudentCompanyPairs.add(pairKey);
                    companyStudentCounts.set(
                      existingDN.ma_doanh_nghiep,
                      (companyStudentCounts.get(existingDN.ma_doanh_nghiep) || 0) + 1
                    );
                  }
                }
              }
            }

            if (hasProcessed) {
              importCount++;
            }
          } catch (rowError) {
            errorCount++;
            errors.push(`Row ${importCount + errorCount}: ${rowError.message}`);
            console.error('❌ Row error:', rowError);
          }
        }

        if (importCount === 0) {
          console.warn('⚠️ Import detected 0 participants from file');
        }

        // Cập nhật số lượng trong đợt thực tập
        await InternshipBatchesController.updateBatchCounts(batchId);

        // Cập nhật số sinh viên tiếp nhận cho từng doanh nghiệp trong đợt
        // Nếu có bảng phan_cong_thuc_tap thì dùng dữ liệu phân công thực tế,
        // nếu chưa có, dùng số liệu đếm theo file import ở trên để set tạm thời
        const canUseAssignments = await InternshipBatchesController._hasAssignmentsTable();
        if (canUseAssignments) {
          await InternshipBatchesController.updateCompanyIntakeCounts(batchId);
        } else if (companyStudentCounts.size > 0) {
          // Set 0 trước cho an toàn
          await connection.query(
            `UPDATE doanh_nghiep_thuc_tap SET so_sinh_vien_tiep_nhan = 0 WHERE dot_thuc_tap_id = ?`,
            [batchId]
          );
          // Ghi lại theo số liệu file
          for (const [maDoanhNghiep, cnt] of companyStudentCounts.entries()) {
            await connection.query(
              `UPDATE doanh_nghiep_thuc_tap 
               SET so_sinh_vien_tiep_nhan = ? 
               WHERE dot_thuc_tap_id = ? AND ma_doanh_nghiep = ?`,
              [cnt, batchId, maDoanhNghiep]
            );
          }
        }

        // Xóa file tạm
        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: `Import thành công ${importCount} record${errorCount > 0 ? `, ${errorCount} lỗi` : ''}`,
          data: { imported: importCount, errors: errorCount, errorDetails: errors }
        });

    } catch (error) {
      console.error('❌ Import participants error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: 'Lỗi khi import file: ' + error.message });
    }
  }

  // GET /api/internship-batches/:id/export - Xuất thông tin đợt thực tập
  static async exportBatch(req, res) {
    try {
      const batchId = req.params.id;

      // Lấy thông tin đợt thực tập
      const [batch] = await connection.query('SELECT * FROM dot_thuc_tap WHERE id = ?', [batchId]);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
      }

      // Lấy danh sách sinh viên
      const sinhVien = await connection.query(`
        SELECT sv.ma_sinh_vien, sv.ho_ten, sv.email_ca_nhan as email, sv.so_dien_thoai, sv.lop, sv.khoa
        FROM sinh_vien sv
        INNER JOIN sinh_vien_thuc_tap svtt ON sv.ma_sinh_vien = svtt.ma_sinh_vien
        WHERE svtt.dot_thuc_tap_id = ?
      `, [batchId]);

      // Lấy danh sách giảng viên
      const giangVien = await connection.query(`
        SELECT gv.ma_giang_vien, gv.ho_ten, gv.email_ca_nhan as email, gv.so_dien_thoai, gv.khoa, gv.bo_mon
        FROM giang_vien gv
        INNER JOIN giang_vien_huong_dan gvhd ON gv.ma_giang_vien = gvhd.ma_giang_vien
        WHERE gvhd.dot_thuc_tap_id = ?
      `, [batchId]);

      // Lấy danh sách doanh nghiệp
      const doanhNghiep = await connection.query(`
        SELECT dn.ma_doanh_nghiep, dn.ten_cong_ty as ten_doanh_nghiep, dn.dia_chi_cong_ty as dia_chi, dn.so_dien_thoai, dn.email_cong_ty as email, dn.website
        FROM doanh_nghiep dn
        INNER JOIN doanh_nghiep_thuc_tap dntt ON dn.ma_doanh_nghiep = dntt.ma_doanh_nghiep
        WHERE dntt.dot_thuc_tap_id = ?
      `, [batchId]);

      // Tạo workbook
      const workbook = XLSX.utils.book_new();

      // Sheet thông tin tổng quan
      const summaryData = [
        ['Tên đợt thực tập', batch.ten_dot],
        ['Thời gian bắt đầu', batch.thoi_gian_bat_dau],
        ['Thời gian kết thúc', batch.thoi_gian_ket_thuc],
        ['Trạng thái', batch.trang_thai],
        ['Mô tả', batch.mo_ta],
        [''],
        ['THỐNG KÊ THAM GIA'],
        ['Số sinh viên tham gia', sinhVien.length],
        ['Số giảng viên hướng dẫn', giangVien.length],
        ['Số doanh nghiệp tham gia', doanhNghiep.length]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

      // Sheet sinh viên
      if (sinhVien.length > 0) {
        const sinhVienSheet = XLSX.utils.json_to_sheet(sinhVien);
        XLSX.utils.book_append_sheet(workbook, sinhVienSheet, 'Sinh viên');
      }

      // Sheet giảng viên
      if (giangVien.length > 0) {
        const giangVienSheet = XLSX.utils.json_to_sheet(giangVien);
        XLSX.utils.book_append_sheet(workbook, giangVienSheet, 'Giảng viên');
      }

      // Sheet doanh nghiệp
      if (doanhNghiep.length > 0) {
        const doanhNghiepSheet = XLSX.utils.json_to_sheet(doanhNghiep);
        XLSX.utils.book_append_sheet(workbook, doanhNghiepSheet, 'Doanh nghiệp');
      }

      // Xuất file
      const filename = `dot-thuc-tap-${batch.ten_dot.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.xlsx`;
      const filepath = path.join('uploads', filename);
      
      XLSX.writeFile(workbook, filepath);

      // Gửi file về client
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('❌ Download error:', err);
        }
        // Xóa file sau khi gửi
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      });

    } catch (error) {
      console.error('❌ Export batch error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi xuất file: ' + error.message });
    }
  }

  // GET /api/internship-batches/:id/participants - Lấy danh sách chi tiết người tham gia
  static async getBatchParticipants(req, res) {
    try {
      const batchId = req.params.id;

      // Kiểm tra đợt thực tập có tồn tại không
      const [batch] = await connection.query('SELECT * FROM dot_thuc_tap WHERE id = ?', [batchId]);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đợt thực tập' });
      }

      // Lấy danh sách sinh viên
      const sinhVien = await connection.query(`
        SELECT sv.ma_sinh_vien, sv.ho_ten, sv.email_ca_nhan as email, sv.so_dien_thoai, sv.lop, sv.khoa
        FROM sinh_vien sv
        INNER JOIN sinh_vien_thuc_tap svtt ON sv.ma_sinh_vien = svtt.ma_sinh_vien
        WHERE svtt.dot_thuc_tap_id = ?
        ORDER BY sv.ho_ten
      `, [batchId]);

      // Lấy danh sách giảng viên
      const giangVien = await connection.query(`
        SELECT gv.ma_giang_vien, gv.ho_ten, gv.email_ca_nhan as email, gv.so_dien_thoai, gv.khoa, gv.bo_mon
        FROM giang_vien gv
        INNER JOIN giang_vien_huong_dan gvhd ON gv.ma_giang_vien = gvhd.ma_giang_vien
        WHERE gvhd.dot_thuc_tap_id = ?
        ORDER BY gv.ho_ten
      `, [batchId]);

      // Lấy danh sách doanh nghiệp
      const doanhNghiep = await connection.query(`
        SELECT dn.ma_doanh_nghiep, dn.ten_cong_ty as ten_doanh_nghiep, dn.dia_chi_cong_ty as dia_chi, dn.so_dien_thoai, dn.email_cong_ty as email, dn.website
        FROM doanh_nghiep dn
        INNER JOIN doanh_nghiep_thuc_tap dntt ON dn.ma_doanh_nghiep = dntt.ma_doanh_nghiep
        WHERE dntt.dot_thuc_tap_id = ?
        ORDER BY dn.ten_cong_ty
      `, [batchId]);

      res.json({
        success: true,
        data: {
          batch,
          sinhVien,
          giangVien,
          doanhNghiep,
          summary: {
            soSinhVien: sinhVien.length,
            soGiangVien: giangVien.length,
            soDoanhNghiep: doanhNghiep.length
          }
        }
      });

    } catch (error) {
      console.error('❌ Get batch participants error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người tham gia' });
    }
  }

  // Helper method để cập nhật số lượng trong đợt thực tập
  static async updateBatchCounts(batchId) {
    try {
      // Đếm số sinh viên
      const [sinhVienCount] = await connection.query(
        'SELECT COUNT(*) as count FROM sinh_vien_thuc_tap WHERE dot_thuc_tap_id = ?',
        [batchId]
      );

      // Đếm số giảng viên
      const [giangVienCount] = await connection.query(
        'SELECT COUNT(*) as count FROM giang_vien_huong_dan WHERE dot_thuc_tap_id = ?',
        [batchId]
      );

      // Đếm số doanh nghiệp
      const [doanhNghiepCount] = await connection.query(
        'SELECT COUNT(*) as count FROM doanh_nghiep_thuc_tap WHERE dot_thuc_tap_id = ?',
        [batchId]
      );

      // Cập nhật vào bảng dot_thuc_tap
      await connection.query(`
        UPDATE dot_thuc_tap 
        SET so_sinh_vien_tham_gia = ?, 
            so_giang_vien_huong_dan = ?, 
            so_doanh_nghiep_tham_gia = ?
        WHERE id = ?
      `, [
        sinhVienCount?.count || 0,
        giangVienCount?.count || 0,
        doanhNghiepCount?.count || 0,
        batchId
      ]);

    } catch (error) {
      console.error('❌ Update batch counts error:', error);
      throw error;
    }
  }

  // Kiểm tra sự tồn tại của bảng phan_cong_thuc_tap
  static async _hasAssignmentsTable() {
    try {
      await connection.query('SELECT 1 FROM phan_cong_thuc_tap LIMIT 1');
      return true;
    } catch (error) {
      if (error && error.code === 'ER_NO_SUCH_TABLE') return false;
      // lỗi khác: coi như có bảng để nổi lỗi lên trên (tránh nuốt lỗi nghiêm trọng)
      throw error;
    }
  }

  // Helper method: cập nhật so_sinh_vien_tiep_nhan trong doanh_nghiep_thuc_tap theo số phân công thực tế
  static async updateCompanyIntakeCounts(batchId) {
    // Chỉ chạy khi chắc chắn bảng phan_cong_thuc_tap tồn tại
    // Hàm gọi bên ngoài phải tự kiểm tra _hasAssignmentsTable()
    // Reset về 0, rồi cập nhật theo số phân công thực tế trong đợt
    // Nếu có DN không có SV -> sẽ giữ 0
    // Sử dụng COUNT DISTINCT sinh_vien_id để tránh trùng
    await connection.query(
      `UPDATE doanh_nghiep_thuc_tap 
       SET so_sinh_vien_tiep_nhan = 0 
       WHERE dot_thuc_tap_id = ?`,
      [batchId]
    );

    await connection.query(
      `UPDATE doanh_nghiep_thuc_tap dntt
       JOIN doanh_nghiep dn ON dn.ma_doanh_nghiep = dntt.ma_doanh_nghiep
       JOIN (
         SELECT pct.doanh_nghiep_id, COUNT(DISTINCT pct.sinh_vien_id) AS cnt
         FROM phan_cong_thuc_tap pct
         WHERE pct.dot_thuc_tap_id = ?
         GROUP BY pct.doanh_nghiep_id
       ) pc ON pc.doanh_nghiep_id = dn.id
       SET dntt.so_sinh_vien_tiep_nhan = pc.cnt
       WHERE dntt.dot_thuc_tap_id = ?`,
      [batchId, batchId]
    );
  }
}

module.exports = InternshipBatchesController;