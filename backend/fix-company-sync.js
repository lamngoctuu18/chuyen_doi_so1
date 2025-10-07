const connection = require('./src/database/connection');

async function checkAndSyncCompanyData() {
  try {
    console.log('🔍 Kiểm tra cấu trúc bảng doanh_nghiep...');
    const structure = await connection.query('DESCRIBE doanh_nghiep');
    console.log('📋 Columns found:');
    structure.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    
    console.log('\n🔍 Kiểm tra dữ liệu accounts doanh nghiệp...');
    const companies = await connection.query(`
      SELECT id, userCode, name, email 
      FROM accounts 
      WHERE role = 'doanh-nghiep' 
      LIMIT 5
    `);
    console.log('📋 Sample company accounts:');
    companies.forEach(c => console.log(`- ${c.id}: ${c.userCode} - ${c.name}`));
    
    console.log('\n🔄 Đồng bộ dữ liệu...');
    let syncCount = 0;
    
    for (const company of companies) {
      if (!company.userCode || !company.name) {
        console.log(`⚠️ Bỏ qua company ${company.id} - thiếu thông tin`);
        continue;
      }
      
      // Kiểm tra đã tồn tại chưa
      const existing = await connection.query(
        'SELECT id FROM doanh_nghiep WHERE ma_doanh_nghiep = ?',
        [company.userCode]
      );
      
      if (existing.length > 0) {
        console.log(`✅ ${company.userCode} đã tồn tại`);
        continue;
      }
      
      // Thêm mới với column names đúng
      try {
        await connection.query(`
          INSERT INTO doanh_nghiep (
            ma_doanh_nghiep, ten_cong_ty, ten_nguoi_lien_he, 
            dia_chi_cong_ty, so_dien_thoai, email, trang_thai
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          company.userCode,
          company.name,
          'Người liên hệ',
          'Địa chỉ công ty',
          '0123456789',
          company.email,
          'hoat-dong'
        ]);
        
        syncCount++;
        console.log(`✅ Đã thêm ${company.userCode} - ${company.name}`);
        
      } catch (insertError) {
        console.error(`❌ Lỗi thêm ${company.userCode}:`, insertError.message);
      }
    }
    
    console.log(`\n🎉 Hoàn thành! Đã đồng bộ ${syncCount} doanh nghiệp`);
    
    // Hiển thị danh sách cuối cùng
    const finalList = await connection.query('SELECT id, ma_doanh_nghiep, ten_cong_ty FROM doanh_nghiep LIMIT 10');
    console.log('\n📋 Danh sách doanh nghiệp sau khi đồng bộ:');
    finalList.forEach(c => console.log(`- ID: ${c.id}, Mã: ${c.ma_doanh_nghiep}, Tên: ${c.ten_cong_ty}`));
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

checkAndSyncCompanyData();