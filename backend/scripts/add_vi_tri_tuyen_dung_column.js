/**
 * Migration: Thêm cột vi_tri_tuyen_dung vào bảng doanh_nghiep
 * Mục đích: Lưu thông tin vị trí tuyển dụng của doanh nghiệp
 */

const db = require('../src/database/connection');

async function addViTriTuyenDungColumn() {
  try {
    console.log('🔧 Bắt đầu migration: Thêm cột vi_tri_tuyen_dung vào bảng doanh_nghiep...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'doanh_nghiep' 
        AND column_name = 'vi_tri_tuyen_dung';
    `;
    
    const checkResult = await db.query(checkColumnQuery);
    
    if (checkResult.length > 0) {
      console.log('ℹ️  Cột vi_tri_tuyen_dung đã tồn tại. Bỏ qua.');
      return;
    }
    
    // Thêm cột mới
    const alterTableQuery = `
      ALTER TABLE doanh_nghiep 
      ADD COLUMN vi_tri_tuyen_dung TEXT;
    `;
    
    await db.query(alterTableQuery);
    console.log('✅ Đã thêm cột vi_tri_tuyen_dung vào bảng doanh_nghiep');
    
    // Hiển thị thống kê
    const countQuery = 'SELECT COUNT(*) as total FROM doanh_nghiep';
    const countResult = await db.query(countQuery);
    console.log(`📊 Tổng số doanh nghiệp: ${countResult[0].total}`);
    
    console.log('✨ Migration hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi thêm cột:', error.message);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Chạy migration
addViTriTuyenDungColumn()
  .then(() => {
    console.log('🎉 Script hoàn thành');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script thất bại:', error);
    process.exit(1);
  });
