const { createTables } = require('./src/database/migrate');
const { seedData } = require('./src/database/seed');

const setupDatabase = async () => {
  try {
    console.log('🎯 ===== THIẾT LẬP DATABASE THỰC TẬP =====');
    console.log('📍 Khoa CNTT - Đại học Đại Nam');
    console.log('');

    // Bước 1: Tạo schema
    console.log('📝 Bước 1: Tạo database schema...');
    await createTables();
    console.log('✅ Hoàn thành tạo schema!');
    console.log('');

    // Bước 2: Thêm dữ liệu mẫu
    console.log('📝 Bước 2: Thêm dữ liệu mẫu...');
    await seedData();
    console.log('✅ Hoàn thành thêm dữ liệu mẫu!');
    console.log('');

    console.log('🎉 ===== THIẾT LẬP HOÀN TẤT =====');
    console.log('');
    console.log('📊 Hệ thống đã sẵn sàng với:');
    console.log('   ✓ 10 bảng dữ liệu');
    console.log('   ✓ Dữ liệu mẫu cho tất cả roles');
    console.log('   ✓ Tài khoản demo');
    console.log('');
    console.log('🔐 Tài khoản demo:');
    console.log('   👤 Admin: admin@dainam.edu.vn / 123456');
    console.log('   🎓 Sinh viên: sv001@student.dainam.edu.vn / 123456');
    console.log('   👨‍🏫 Giảng viên: gv001@dainam.edu.vn / 123456');
    console.log('   🏢 Doanh nghiệp: contact@techcorp.com / 123456');
    console.log('');
    console.log('🚀 Bây giờ bạn có thể chạy: npm start');
    console.log('───────────────────────────────────────');

  } catch (error) {
    console.error('💥 Lỗi thiết lập database:', error);
    process.exit(1);
  }
};

// Chạy setup
setupDatabase();