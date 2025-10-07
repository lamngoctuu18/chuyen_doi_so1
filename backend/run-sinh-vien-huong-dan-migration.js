const db = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🧩 Chạy migration cho bảng sinh_vien_huong_dan...');
        
        const migrationPath = path.join(__dirname, 'migrations', '010_create_sinh_vien_huong_dan_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL by semicolons and execute each statement
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('🔍 Executing:', statement.trim().substring(0, 100) + '...');
                await db.query(statement.trim());
            }
        }
        
        console.log('✅ Migration completed successfully!');
        
        // Test the new table
        const [tables] = await db.query("SHOW TABLES LIKE 'sinh_vien_huong_dan'");
        if (tables.length > 0) {
            console.log('✅ Bảng sinh_vien_huong_dan đã được tạo thành công');
        }
        
        // Check if column was added to giang_vien table
        const [columns] = await db.query("SHOW COLUMNS FROM giang_vien LIKE 'so_sinh_vien_huong_dan'");
        if (columns.length > 0) {
            console.log('✅ Cột so_sinh_vien_huong_dan đã được thêm vào bảng giang_vien');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();