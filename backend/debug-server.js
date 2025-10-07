const express = require('express');
const cors = require('cors');
const { query } = require('./src/database/connection');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Test endpoint đơn giản
app.get('/api/test-students', async (req, res) => {
  try {
    console.log('🧪 Test students endpoint called');
    
    // Test query đơn giản nhất
    const simpleQuery = `SELECT COUNT(*) as total FROM sinh_vien`;
    const result = await query(simpleQuery);
    
    console.log('✅ Simple count result:', result);
    
    // Test query với JOIN
    const joinQuery = `
      SELECT 
        sv.id, sv.ma_sinh_vien, sv.ho_ten,
        a.user_id, a.email, a.role
      FROM sinh_vien sv
      INNER JOIN accounts a ON sv.account_id = a.id
      LIMIT 5
    `;
    
    const joinResult = await query(joinQuery);
    console.log('✅ Join result:', joinResult);
    
    res.json({
      success: true,
      message: 'Test thành công',
      data: {
        total: result[0].total,
        sample: joinResult
      }
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

// Test connection
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Debug server running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Debug server running on port ${PORT}`);
});

module.exports = app;