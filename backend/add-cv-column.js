const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCvPathColumn() {
  let connection;
  
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'quanly_thuctap',
      charset: 'utf8mb4',
      timezone: '+07:00'
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
    
    // Add cv_path column
    await connection.execute(`
      ALTER TABLE sinh_vien 
      ADD COLUMN cv_path VARCHAR(255) NULL COMMENT 'Path to uploaded CV file' 
      AFTER sdt_nguoi_lien_he
    `);
    
    console.log('cv_path column added successfully');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('cv_path column already exists');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCvPathColumn();