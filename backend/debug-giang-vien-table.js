const db = require('./src/database/connection');

async function checkGiangVienTable() {
  try {
    console.log('🔍 Checking if giang_vien table exists...');
    
    // Check if table exists
    const tables = await db.query("SHOW TABLES LIKE 'giang_vien'");
    console.log('📋 Tables matching giang_vien:', tables);
    
    if (tables.length > 0) {
      console.log('✅ Table giang_vien exists!');
      
      // Check table structure
      const structure = await db.query("DESCRIBE giang_vien");
      console.log('🏗️  Table structure:', JSON.stringify(structure, null, 2));
      
      // Check data count
      const count = await db.query("SELECT COUNT(*) as count FROM giang_vien");
      console.log('📊 Current row count:', count[0].count);
      
      // Check sample data
      const sample = await db.query("SELECT * FROM giang_vien LIMIT 3");
      console.log('📄 Sample data:', JSON.stringify(sample, null, 2));
      
    } else {
      console.log('❌ Table giang_vien does not exist!');
      
      // Show all tables
      const allTables = await db.query("SHOW TABLES");
      console.log('📋 All tables in database:', allTables);
    }
    
  } catch (error) {
    console.error('❌ Error checking giang_vien table:', error);
  } finally {
    process.exit(0);
  }
}

checkGiangVienTable();