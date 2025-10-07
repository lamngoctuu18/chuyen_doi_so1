const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const db = require('./src/database/connection');
    const [teachers] = await db.query('SELECT COUNT(*) as count FROM giang_vien');
    const [sampleTeachers] = await db.query('SELECT ma_giang_vien, ho_ten FROM giang_vien LIMIT 3');
    
    res.json({
      success: true,
      data: {
        totalTeachers: teachers.count,
        sampleTeachers: sampleTeachers
      }
    });
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test supervision overview endpoint
app.get('/api/teacher-reports/supervision-overview', async (req, res) => {
  try {
    const db = require('./src/database/connection');
    
    const query = [
      'SELECT * FROM (',
      '  SELECT',
      '    gv.id AS giang_vien_id,',
      '    gv.ma_giang_vien,',
      '    gv.ho_ten AS ten_giang_vien,',
      '    gv.email_ca_nhan AS email,',
      '    gv.khoa,',
      '    gv.bo_mon,',
      '    0 AS so_sinh_vien_huong_dan,',
      '    0 AS so_sinh_vien_da_cham,',
      "    'chua_cham_xong' AS trang_thai_cham_diem",
      '  FROM giang_vien gv',
      ') AS t',
      'ORDER BY t.ten_giang_vien ASC'
    ].join('\n');

    console.log('Executing query:', query);
    const [teachers] = await db.query(query);
    console.log('Query result:', teachers);
    
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Supervision overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const port = 3002;
app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});