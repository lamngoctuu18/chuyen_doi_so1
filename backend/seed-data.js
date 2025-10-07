const connection = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function seedSampleData() {
  try {
    console.log('🌱 Starting to seed sample data...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'seed-sample-data.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await connection.query(statement);
      }
    }
    
    console.log('✅ Sample data seeded successfully!');
    
    // Test the supervision query
    console.log('\n🔍 Testing supervision overview query...');
    const testQuery = `
      SELECT 
        gv.id AS giang_vien_id,
        gv.ma_giang_vien,
        gv.ho_ten AS ten_giang_vien,
        gv.email_ca_nhan AS email,
        gv.khoa,
        gv.bo_mon,
        COALESCE(pct_counts.total_sv, sv_name_counts.total_sv, 0) AS so_sinh_vien_huong_dan,
        COALESCE(graded_counts.graded_sv, 0) AS so_sinh_vien_da_cham,
        CASE WHEN COALESCE(pct_counts.total_sv, sv_name_counts.total_sv, 0) > 0 AND COALESCE(graded_counts.graded_sv, 0) = COALESCE(pct_counts.total_sv, sv_name_counts.total_sv, 0)
             THEN 'da_cham_xong' ELSE 'chua_cham_xong' END AS trang_thai_cham_diem
      FROM giang_vien gv
      LEFT JOIN (
        SELECT giang_vien_id, COUNT(DISTINCT sinh_vien_id) AS total_sv
        FROM phan_cong_thuc_tap
        WHERE giang_vien_id IS NOT NULL
        GROUP BY giang_vien_id
      ) AS pct_counts ON pct_counts.giang_vien_id = gv.id
      LEFT JOIN (
        SELECT giang_vien_id, COUNT(DISTINCT sinh_vien_id) AS graded_sv
        FROM phan_cong_thuc_tap
        WHERE giang_vien_id IS NOT NULL AND (diem_giang_vien IS NOT NULL OR diem_so IS NOT NULL) AND (nhan_xet_giang_vien IS NOT NULL OR nhan_xet IS NOT NULL)
        GROUP BY giang_vien_id
      ) AS graded_counts ON graded_counts.giang_vien_id = gv.id
      LEFT JOIN (
        SELECT gv2.id AS giang_vien_id, COUNT(*) AS total_sv
        FROM sinh_vien sv2
        JOIN giang_vien gv2 ON TRIM(LOWER(sv2.giang_vien_huong_dan)) = TRIM(LOWER(gv2.ho_ten))
        GROUP BY gv2.id
      ) AS sv_name_counts ON sv_name_counts.giang_vien_id = gv.id
      ORDER BY gv.ho_ten ASC
      LIMIT 5
    `;
    
    const [results] = await connection.query(testQuery);
    console.log('\n📊 Supervision overview results:');
    console.table(results);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedSampleData();