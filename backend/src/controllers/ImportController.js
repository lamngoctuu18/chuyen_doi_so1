const ExcelImportService = require('../services/ExcelImportService');
const Account = require('../models/Account');
const { deleteFile } = require('../middleware/uploadExcel');
const path = require('path');

class ImportController {
  
  // POST /api/import/students - Import danh sách sinh viên từ Excel
  static async importStudents(req, res) {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file Excel được upload',
          data: null
        });
      }
      
      filePath = req.file.path;
      const options = {
        updateExisting: req.body.updateExisting === 'true' || false,
        createUsers: req.body.createUsers !== 'false' // mặc định là true
      };
      
      console.log('📁 Đang xử lý file:', req.file.originalname);
      console.log('⚙️ Options:', options);
      
      // Bước 1: Parse file Excel
      const parseResult = await ExcelImportService.parseExcelFile(filePath);
      
      if (parseResult.errors.length > 0 && parseResult.students.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File Excel có lỗi và không có dữ liệu hợp lệ nào',
          data: {
            totalRows: parseResult.totalRows,
            errors: parseResult.errors
          }
        });
      }
      
      // Bước 2: Import vào database thật
      const importResult = await ExcelImportService.importToDatabase(parseResult.students, options);
      
      // Bước 3: Tổng hợp kết quả
      const finalResult = {
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          uploadTime: new Date().toISOString()
        },
        parsing: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          parseErrors: parseResult.errorRows,
          parseErrorDetails: parseResult.errors
        },
        import: {
          total: importResult.total,
          success: importResult.success,
          updated: importResult.updated,
          failed: importResult.failed,
          importErrors: importResult.errors
        },
        summary: {
          status: importResult.success > 0 || importResult.updated > 0 ? 'success' : 'failed',
          message: `Đã xử lý ${parseResult.totalRows} dòng. Thành công: ${importResult.success}, Cập nhật: ${importResult.updated}, Lỗi: ${importResult.failed + parseResult.errorRows}`
        }
      };
      
      // Xóa file sau khi xử lý
      try {
        await deleteFile(filePath);
      } catch (error) {
        console.error('Lỗi xóa file:', error);
      }
      
      const statusCode = finalResult.summary.status === 'success' ? 200 : 207; // 207 Multi-Status
      
      res.status(statusCode).json({
        success: finalResult.summary.status === 'success',
        message: finalResult.summary.message,
        data: finalResult
      });
      
    } catch (error) {
      console.error('Lỗi import Excel:', error);
      
      // Xóa file nếu có lỗi
      if (filePath) {
        try {
          await deleteFile(filePath);
        } catch (deleteError) {
          console.error('Lỗi xóa file:', deleteError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: `Lỗi xử lý file Excel: ${error.message}`,
        data: null
      });
    }
  }
  
  // GET /api/import/template - Download template Excel
  static async downloadTemplate(req, res) {
    try {
      const workbook = await ExcelImportService.createTemplate();
      
      // Set headers cho file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="template_danh_sach_sinh_vien.xlsx"'
      );
      
      // Ghi workbook vào response
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (error) {
      console.error('Lỗi tạo template:', error);
      res.status(500).json({
        success: false,
        message: `Lỗi tạo template Excel: ${error.message}`,
        data: null
      });
    }
  }
  
  // POST /api/import/validate - Validate file Excel trước khi import
  static async validateExcel(req, res) {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file Excel được upload',
          data: null
        });
      }
      
      filePath = req.file.path;
      
      console.log('🔍 Đang validate file:', req.file.originalname);
      
      // Parse và validate file
      const parseResult = await ExcelImportService.parseExcelFile(filePath);
      
      // Xóa file sau khi validate
      try {
        await deleteFile(filePath);
      } catch (error) {
        console.error('Lỗi xóa file:', error);
      }
      
      const validationResult = {
        file: {
          originalName: req.file.originalname,
          size: req.file.size,
          validationTime: new Date().toISOString()
        },
        validation: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          errorRows: parseResult.errorRows,
          errors: parseResult.errors,
          isValid: parseResult.students.length > 0,
          canImport: parseResult.students.length > 0
        },
        preview: parseResult.students.slice(0, 5).map(student => ({
          maSV: student.maSV,
          hoTen: student.hoTen,
          email: student.email,
          lop: student.lop,
          khoa: student.khoa
        }))
      };
      
      res.json({
        success: true,
        message: validationResult.validation.isValid 
          ? `File hợp lệ với ${parseResult.validRows} sinh viên` 
          : 'File có lỗi, không thể import',
        data: validationResult
      });
      
    } catch (error) {
      console.error('Lỗi validate Excel:', error);
      
      // Xóa file nếu có lỗi
      if (filePath) {
        try {
          await deleteFile(filePath);
        } catch (deleteError) {
          console.error('Lỗi xóa file:', deleteError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: `Lỗi validate file Excel: ${error.message}`,
        data: null
      });
    }
  }
  
  // POST /api/import/preview/:type - Preview file Excel trước khi import
  static async previewFile(req, res) {
    let filePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Không có file Excel được upload'
        });
      }
      
      filePath = req.file.path;
      const accountType = req.params.type;
      
      console.log('🔍 Preview file:', req.file.originalname, 'Type:', accountType);
      
      // Parse file Excel
      const parseResult = await ExcelImportService.parseExcelFile(filePath, accountType);
      
      // Tạo response data
      let responseData = {
        totalRows: 0,
        columns: [],
        sampleData: []
      };
      
      if (accountType === 'sinh-vien' && parseResult.students) {
        responseData = {
          totalRows: parseResult.students.length,
          columns: ['Mã sinh viên', 'Họ tên', 'Email', 'Lớp', 'Khoa'],
          sampleData: parseResult.students.slice(0, 3).map(student => ({
            'Mã sinh viên': student.maSinhVien,
            'Họ tên': student.hoTen,
            'Email': student.email,
            'Lớp': student.lop,
            'Khoa': student.khoa
          }))
        };
      } else if (accountType === 'giang-vien' && parseResult.giangViens) {
        responseData = {
          totalRows: parseResult.giangViens.length,
          columns: ['Mã giảng viên', 'Họ tên', 'Email', 'Khoa', 'Bộ môn'],
          sampleData: parseResult.giangViens.slice(0, 3).map(gv => ({
            'Mã giảng viên': gv.maGiangVien,
            'Họ tên': gv.hoTen,
            'Email': gv.email,
            'Khoa': gv.khoa,
            'Bộ môn': gv.boMon
          }))
        };
      } else if (accountType === 'doanh-nghiep' && parseResult.doanhNghieps) {
        responseData = {
          totalRows: parseResult.doanhNghieps.length,
          columns: ['Mã doanh nghiệp', 'Tên doanh nghiệp', 'Email', 'Người liên hệ'],
          sampleData: parseResult.doanhNghieps.slice(0, 3).map(dn => ({
            'Mã doanh nghiệp': dn.maDoanhNghiep,
            'Tên doanh nghiệp': dn.tenDoanhNghiep,
            'Email': dn.email,
            'Người liên hệ': dn.nguoiLienHe
          }))
        };
      }
      
      res.json({
        success: true,
        message: 'Preview file thành công',
        data: responseData
      });
      
    } catch (error) {
      console.error('❌ Preview file error:', error);
      res.status(500).json({
        success: false,
        message: `Lỗi preview file: ${error.message}`
      });
    } finally {
      // Xóa file tạm
      if (filePath) {
        try {
          await deleteFile(filePath);
        } catch (deleteError) {
          console.error('Lỗi xóa file tạm:', deleteError);
        }
      }
    }
  }

  // GET /api/import/guide - Hướng dẫn sử dụng import
  static async getImportGuide(req, res) {
    try {
      const guide = {
        title: 'Hướng dẫn Import danh sách sinh viên từ Excel',
        steps: [
          {
            step: 1,
            title: 'Chuẩn bị file Excel',
            description: 'Tải template hoặc chuẩn bị file Excel với các cột cần thiết',
            required_columns: ['Mã sinh viên', 'Họ và tên', 'Mật khẩu'],
            optional_columns: ['Email', 'Lớp', 'Khoa', 'Số điện thoại']
          },
          {
            step: 2,
            title: 'Validate file',
            description: 'Sử dụng endpoint /api/import/validate để kiểm tra file trước khi import',
            endpoint: 'POST /api/import/validate'
          },
          {
            step: 3,
            title: 'Import dữ liệu',
            description: 'Sử dụng endpoint /api/import/students để import danh sách sinh viên',
            endpoint: 'POST /api/import/students',
            options: {
              updateExisting: 'true/false - Có cập nhật sinh viên đã tồn tại không',
              createUsers: 'true/false - Có tạo tài khoản đăng nhập không'
            }
          }
        ],
        notes: [
          'File Excel phải có định dạng .xls hoặc .xlsx',
          'Kích thước file tối đa 10MB',
          'Email sẽ được tạo tự động theo format: masv@student.dainam.edu.vn nếu không có',
          'Mật khẩu sẽ được mã hóa tự động khi lưu vào database',
          'Khoa mặc định là "Công nghệ thông tin" nếu không chỉ định'
        ],
        endpoints: {
          download_template: 'GET /api/import/template',
          validate_file: 'POST /api/import/validate',
          import_students: 'POST /api/import/students',
          get_guide: 'GET /api/import/guide'
        }
      };
      
      res.json({
        success: true,
        message: 'Hướng dẫn import sinh viên từ Excel',
        data: guide
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = ImportController;