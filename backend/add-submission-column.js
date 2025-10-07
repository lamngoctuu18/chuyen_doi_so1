const connection = require('./src/database/connection');

async function addSubmissionColumn() {
  try {
    console.log('🔧 Adding ngay_nop_danh_gia column to phan_cong_thuc_tap table...');

    // Check if column already exists
    const columns = await connection.query(`
      SHOW COLUMNS FROM phan_cong_thuc_tap 
      WHERE Field = 'ngay_nop_danh_gia'
    `);

    if (columns.length === 0) {
      // Add the column
      await connection.query(`
        ALTER TABLE phan_cong_thuc_tap 
        ADD COLUMN ngay_nop_danh_gia TIMESTAMP NULL 
        AFTER nhan_xet
      `);
      console.log('✅ Added ngay_nop_danh_gia column successfully');
    } else {
      console.log('⚠️ Column ngay_nop_danh_gia already exists');
    }

    console.log('🎉 Database update completed!');

  } catch (error) {
    console.error('❌ Error adding column:', error);
  } finally {
    process.exit(0);
  }
}

addSubmissionColumn();