const connection = require('./src/database/connection');

async function syncCompanyData() {
  try {
    console.log('🔄 Đồng bộ dữ liệu doanh nghiệp từ accounts...');
    
    // Lấy tất cả tài khoản doanh nghiệp từ bảng accounts
    const companyAccounts = await connection.query(
      "SELECT * FROM accounts WHERE role = 'doanh-nghiep'"
    );
    
    console.log(`📊 Tìm thấy ${companyAccounts.length} tài khoản doanh nghiệp`);
    
    if (companyAccounts.length === 0) {
      console.log('❌ Không có tài khoản doanh nghiệp nào trong bảng accounts');
      process.exit(0);
    }
    
    // Kiểm tra bảng doanh_nghiep có tồn tại không
    try {
      await connection.query('SELECT 1 FROM doanh_nghiep LIMIT 1');
      console.log('✅ Bảng doanh_nghiep đã tồn tại');
    } catch (error) {
      console.log('❌ Bảng doanh_nghiep chưa tồn tại, đang tạo...');
      
      // Tạo bảng doanh_nghiep
      await connection.query(`
        CREATE TABLE doanh_nghiep (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ma_doanh_nghiep VARCHAR(50) UNIQUE NOT NULL,
          ten_doanh_nghiep VARCHAR(255) NOT NULL,
          dia_chi TEXT,
          so_dien_thoai VARCHAR(20),
          email VARCHAR(255),
          nguoi_lien_he VARCHAR(255),
          linh_vuc_hoat_dong VARCHAR(255),
          quy_mo_nhan_su VARCHAR(100),
          website VARCHAR(255),
          mo_ta TEXT,
          trang_thai ENUM('hoat-dong', 'tam-ngung', 'ngung-hoat-dong') DEFAULT 'hoat-dong',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Đã tạo bảng doanh_nghiep');
    }
    
    // Đồng bộ dữ liệu
    let syncCount = 0;
    
    for (const account of companyAccounts) {
      try {
        // Kiểm tra doanh nghiệp đã tồn tại chưa
        const existing = await connection.query(
          'SELECT id FROM doanh_nghiep WHERE ma_doanh_nghiep = ?',
          [account.userCode]
        );
        
        if (existing.length > 0) {
          console.log(`⚠️  Doanh nghiệp ${account.userCode} đã tồn tại, bỏ qua`);
          continue;
        }
        
        // Thêm doanh nghiệp mới
        const result = await connection.query(`
          INSERT INTO doanh_nghiep (
            ma_doanh_nghiep, ten_doanh_nghiep, so_dien_thoai, email,
            nguoi_lien_he, trang_thai
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          account.userCode,
          account.hoTen || account.userCode,
          account.soDienThoai || '',
          account.userCode + '@company.com',
          account.hoTen || account.userCode,
          'hoat-dong'
        ]);
        
        console.log(`✅ Đã thêm doanh nghiệp: ${account.userCode} (ID: ${result.insertId})`);
        syncCount++;
        
      } catch (error) {
        console.error(`❌ Lỗi khi thêm doanh nghiệp ${account.userCode}:`, error.message);
      }
    }
    
    console.log(`🎉 Hoàn thành! Đã đồng bộ ${syncCount}/${companyAccounts.length} doanh nghiệp`);
    
    // Hiển thị danh sách doanh nghiệp sau khi đồng bộ
    const companies = await connection.query('SELECT * FROM doanh_nghiep ORDER BY id');
    console.log('\n📋 Danh sách doanh nghiệp trong hệ thống:');
    companies.forEach(company => {
      console.log(`- ID: ${company.id}, Mã: ${company.ma_doanh_nghiep}, Tên: ${company.ten_doanh_nghiep}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

syncCompanyData();