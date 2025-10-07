// Script để chạy migration tạo cấu trúc bảng mới
// File: run-new-migration.js

const fs = require('fs');
const path = require('path');
const db = require('./src/database/connection');

async function runMigration() {
  try {
    console.log('🚀 Bắt đầu chạy migration tạo cấu trúc bảng mới...');
    
    // Đọc file migration
    const migrationPath = path.join(__dirname, 'migrations', '004_create_separate_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('File migration không tồn tại');
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Tách các câu lệnh SQL (bỏ qua comment và dòng trống)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Bỏ qua dòng trống, comment và dòng chỉ có comment
        if (!stmt || stmt.length === 0) return false;
        if (stmt.startsWith('--')) return false;
        // Loại bỏ comment từ statement
        const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
        return cleanStmt.length > 0;
      })
      .map(stmt => stmt.replace(/--.*$/gm, '').trim()); // Loại bỏ comment inline
    
    console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL`);
    
    // Thực thi từng câu lệnh
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('drop table')) {
        console.log(`🗑️  Xóa bảng cũ...`);
      } else if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/create table (?:if not exists )?`?(\w+)`?/i)?.[1];
        console.log(`🏗️  Tạo bảng: ${tableName}`);
      } else if (statement.toLowerCase().includes('insert into')) {
        console.log(`📥 Insert dữ liệu mặc định...`);
      }
      
      try {
        await db.execute(statement);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Bảng đã tồn tại, bỏ qua...`);
        } else {
          console.error(`❌ Lỗi khi thực thi câu lệnh ${i + 1}:`, error.message);
          console.error(`📄 SQL: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('✅ Migration hoàn thành!');
    
    // Kiểm tra các bảng đã được tạo
    console.log('\n🔍 Kiểm tra các bảng đã tạo:');
    
    const tables = ['accounts', 'admin', 'sinh_vien', 'giang_vien', 'doanh_nghiep'];
    
    for (const table of tables) {
      try {
        const [rows] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✓ Bảng ${table}: ${rows[0].count} bản ghi`);
      } catch (error) {
        console.log(`✗ Bảng ${table}: Không tồn tại hoặc lỗi`);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi chạy migration:', error);
  } finally {
    // Đóng kết nối database
    try {
      if (db && typeof db.end === 'function') {
        await db.end();
      } else if (db && db.pool && typeof db.pool.end === 'function') {
        await db.pool.end();
      }
      console.log('\n🔌 Đã đóng kết nối database');
    } catch (error) {
      console.error('Lỗi đóng kết nối:', error);
    }
    
    // Force exit
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

// Chạy migration
runMigration();