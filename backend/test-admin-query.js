const db = require('./src/database/connection');

async function testAdminQuery() {
  try {
    console.log('🔍 Testing admin supervision overview query...');
    
    // Test simple query first
    console.log('\n1. Testing sinh_vien_huong_dan data:');
    const svhdResult = await db.query('SELECT ma_giang_vien, COUNT(*) as count FROM sinh_vien_huong_dan GROUP BY ma_giang_vien LIMIT 5');
    console.log('Records in sinh_vien_huong_dan:', svhdResult);
    
    // Test giang_vien table
    console.log('\n2. Testing giang_vien data:');
    const gvResult = await db.query('SELECT ma_giang_vien, ho_ten, email_ca_nhan FROM giang_vien WHERE ma_giang_vien IN (SELECT DISTINCT ma_giang_vien FROM sinh_vien_huong_dan) LIMIT 5');
    console.log('Matching teachers in giang_vien:', gvResult);
    
    // Test the main query
    console.log('\n3. Testing main admin query:');
    const query = `
      SELECT * FROM (
        SELECT
          gv.id AS giang_vien_id,
          gv.ma_giang_vien,
          gv.ho_ten AS ten_giang_vien,
          gv.email_ca_nhan AS email,
          gv.khoa,
          gv.bo_mon,
          COALESCE(svhd_counts.total_sv, 0) AS so_sinh_vien_huong_dan,
          COALESCE(graded_counts.graded_sv, 0) AS so_sinh_vien_da_cham,
          CASE WHEN COALESCE(svhd_counts.total_sv, 0) > 0 AND COALESCE(graded_counts.graded_sv, 0) = COALESCE(svhd_counts.total_sv, 0)
               THEN 'da_cham_xong' ELSE 'chua_cham_xong' END AS trang_thai_cham_diem
        FROM giang_vien gv
        LEFT JOIN (
          SELECT gv2.id AS giang_vien_id, COUNT(*) AS total_sv
          FROM sinh_vien_huong_dan svhd
          JOIN giang_vien gv2 ON gv2.ma_giang_vien = svhd.ma_giang_vien
          GROUP BY gv2.id
        ) AS svhd_counts ON svhd_counts.giang_vien_id = gv.id
        LEFT JOIN (
          SELECT pct.giang_vien_id, COUNT(DISTINCT pct.sinh_vien_id) AS graded_sv
          FROM phan_cong_thuc_tap pct
          WHERE pct.giang_vien_id IS NOT NULL
            AND (pct.diem_giang_vien IS NOT NULL OR pct.diem_so IS NOT NULL)
            AND (pct.nhan_xet_giang_vien IS NOT NULL OR pct.nhan_xet IS NOT NULL)
          GROUP BY pct.giang_vien_id
        ) AS graded_counts ON graded_counts.giang_vien_id = gv.id
      ) AS t
      WHERE t.so_sinh_vien_huong_dan > 0
      ORDER BY t.ten_giang_vien ASC
    `;
    
    const result = await db.query(query);
    console.log('Admin query result count:', result.length);
    
    if (result.length > 0) {
      console.log('First few results:');
      result.slice(0, 5).forEach(r => {
        console.log(`  ${r.ma_giang_vien} - ${r.ten_giang_vien}: ${r.so_sinh_vien_huong_dan} students, status: ${r.trang_thai_cham_diem}`);
      });
    } else {
      console.log('❌ No results returned from main query!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAdminQuery();