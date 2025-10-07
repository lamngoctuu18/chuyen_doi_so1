const mysql = require('mysql2/promise');
require('dotenv').config();

// Kết nối MySQL để tạo database (không chỉ định database)
const createDatabaseConnection = async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    charset: 'utf8mb4',
    timezone: '+07:00'
  };

  try {
    console.log('🔗 Đang kết nối MySQL server...');
    const connection = await mysql.createConnection(config);
    
    // Tạo database nếu chưa tồn tại
    const databaseName = process.env.DB_NAME || 'quanly_thuctap';
    console.log(`📝 Tạo database: ${databaseName}...`);
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database ${databaseName} đã được tạo hoặc đã tồn tại!`);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Lỗi tạo database:', error.message);
    throw error;
  }
};

// Config cho connection pool (sau khi đã có database)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'quanly_thuctap',
  charset: 'utf8mb4',
  timezone: '+07:00',
  dateStrings: true,
  connectionLimit: 10,
  // Removed invalid options to avoid mysql2 warnings
};

// Tạo connection pool
let pool;

const initializePool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Test connection sau khi đã có database
const testConnection = async () => {
  try {
    const poolInstance = initializePool();
    const connection = await poolInstance.getConnection();
    console.log('✅ Kết nối MySQL database thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL database:', error.message);
    return false;
  }
};

// Query helper function
const query = async (sql, params = []) => {
  try {
    const poolInstance = initializePool();
    
    // Try using query() instead of execute() for parameter binding issues
    if (params && params.length > 0) {
      console.log('🔍 Using query() with params:', params);
      const [results] = await poolInstance.query(sql, params);
      return results;
    } else {
      console.log('🔍 Using query() without params');
      const [results] = await poolInstance.query(sql);
      return results;
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const poolInstance = initializePool();
  const connection = await poolInstance.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Close all connections
const closeConnections = async () => {
  if (pool) {
    await pool.end();
    console.log('🔌 Đã đóng tất cả kết nối database');
  }
};

module.exports = {
  createDatabaseConnection,
  testConnection,
  query,
  transaction,
  closeConnections
};