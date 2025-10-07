const connection = require('./src/database/connection');

async function createPasswordResetTable() {
  try {
    console.log('🔧 Creating password_reset_codes table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        INDEX idx_email_code (email, code),
        INDEX idx_expires_at (expires_at),
        UNIQUE KEY unique_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.query(createTableSQL);
    console.log('✅ Table password_reset_codes created successfully!');
    
    // Verify table structure
    const describeResult = await connection.query('DESCRIBE password_reset_codes');
    console.log('📋 Table structure:');
    console.table(describeResult);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createPasswordResetTable();