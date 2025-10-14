#!/usr/bin/env node
/**
 * Script kiểm tra Swagger API Documentation
 * Verify tất cả endpoints đã được load vào Swagger UI
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const EXPECTED_ENDPOINTS = [
  // Student Reports (8 endpoints)
  { method: 'POST', path: '/api/student-reports/upload', tag: 'Nộp Báo Cáo' },
  { method: 'GET', path: '/api/student-reports', tag: 'Nộp Báo Cáo' },
  { method: 'GET', path: '/api/student-reports/{id}', tag: 'Nộp Báo Cáo' },
  { method: 'POST', path: '/api/student-reports/{id}/review', tag: 'Nộp Báo Cáo' },
  { method: 'GET', path: '/api/student-reports/statistics/{ma_sinh_vien}', tag: 'Nộp Báo Cáo' },
  { method: 'DELETE', path: '/api/student-reports/{id}', tag: 'Nộp Báo Cáo' },
  { method: 'GET', path: '/api/student-reports/download/{id}', tag: 'Nộp Báo Cáo' },
  
  // Password Reset (6 endpoints)
  { method: 'POST', path: '/api/password-reset/request', tag: 'Đổi Mật Khẩu' },
  { method: 'POST', path: '/api/password-reset/verify', tag: 'Đổi Mật Khẩu' },
  { method: 'POST', path: '/api/password-reset/reset', tag: 'Đổi Mật Khẩu' },
  { method: 'GET', path: '/api/password-reset/history/{email}', tag: 'Đổi Mật Khẩu' },
  { method: 'POST', path: '/api/password-reset/cleanup', tag: 'Đổi Mật Khẩu' },
  { method: 'GET', path: '/api/password-reset/check-rate-limit/{email}', tag: 'Đổi Mật Khẩu' }
];

const EXPECTED_SCHEMAS = [
  'StudentReportUpload',
  'StudentReport',
  'ReviewReportRequest',
  'ReportStatistics',
  'PasswordResetRequest',
  'PasswordResetResponse',
  'VerifyResetCodeRequest',
  'ResetPasswordRequest',
  'PasswordResetHistory',
  'RateLimitStatus'
];

function fetchSwaggerJson() {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/api-docs/swagger.json`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Connection failed: ${error.message}`));
    });
  });
}

function checkEndpoints(swagger) {
  console.log('\n🔍 Kiểm tra Endpoints...\n');
  
  const paths = swagger.paths || {};
  let passCount = 0;
  let failCount = 0;
  const missing = [];
  
  EXPECTED_ENDPOINTS.forEach(endpoint => {
    const pathKey = endpoint.path;
    const method = endpoint.method.toLowerCase();
    
    if (paths[pathKey] && paths[pathKey][method]) {
      const apiDef = paths[pathKey][method];
      const tags = apiDef.tags || [];
      const hasTag = tags.includes(endpoint.tag);
      
      if (hasTag) {
        console.log(`✅ ${endpoint.method} ${endpoint.path}`);
        console.log(`   └─ Tag: ${endpoint.tag}`);
        console.log(`   └─ Summary: ${apiDef.summary || 'N/A'}`);
        passCount++;
      } else {
        console.log(`⚠️  ${endpoint.method} ${endpoint.path}`);
        console.log(`   └─ Thiếu tag: ${endpoint.tag}`);
        failCount++;
        missing.push(endpoint);
      }
    } else {
      console.log(`❌ ${endpoint.method} ${endpoint.path}`);
      console.log(`   └─ KHÔNG TÌM THẤY trong swagger.json`);
      failCount++;
      missing.push(endpoint);
    }
  });
  
  console.log(`\n📊 Kết quả: ${passCount}/${EXPECTED_ENDPOINTS.length} endpoints`);
  
  return { passCount, failCount, missing };
}

function checkSchemas(swagger) {
  console.log('\n🔍 Kiểm tra Schemas...\n');
  
  const schemas = swagger.components?.schemas || {};
  let passCount = 0;
  let failCount = 0;
  const missing = [];
  
  EXPECTED_SCHEMAS.forEach(schemaName => {
    if (schemas[schemaName]) {
      const schema = schemas[schemaName];
      const propCount = Object.keys(schema.properties || {}).length;
      console.log(`✅ ${schemaName}`);
      console.log(`   └─ Type: ${schema.type || 'N/A'}`);
      console.log(`   └─ Properties: ${propCount}`);
      passCount++;
    } else {
      console.log(`❌ ${schemaName}`);
      console.log(`   └─ KHÔNG TÌM THẤY`);
      failCount++;
      missing.push(schemaName);
    }
  });
  
  console.log(`\n📊 Kết quả: ${passCount}/${EXPECTED_SCHEMAS.length} schemas`);
  
  return { passCount, failCount, missing };
}

function checkTags(swagger) {
  console.log('\n🔍 Kiểm tra Tags...\n');
  
  const tags = swagger.tags || [];
  const requiredTags = ['Nộp Báo Cáo', 'Đổi Mật Khẩu'];
  let passCount = 0;
  let failCount = 0;
  
  requiredTags.forEach(tagName => {
    const found = tags.find(t => t.name === tagName);
    if (found) {
      console.log(`✅ ${tagName}`);
      console.log(`   └─ Description: ${found.description || 'N/A'}`);
      passCount++;
    } else {
      console.log(`❌ ${tagName}`);
      console.log(`   └─ KHÔNG TÌM THẤY`);
      failCount++;
    }
  });
  
  console.log(`\n📊 Kết quả: ${passCount}/${requiredTags.length} tags`);
  console.log(`\n📋 Tất cả tags có trong Swagger:`);
  tags.forEach(tag => {
    console.log(`   - ${tag.name}`);
  });
  
  return { passCount, failCount };
}

function printSummary(endpointResult, schemaResult, tagResult) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TỔNG KẾT KIỂM TRA SWAGGER DOCUMENTATION');
  console.log('='.repeat(60));
  
  console.log('\n✅ Endpoints:');
  console.log(`   - Passed: ${endpointResult.passCount}/${EXPECTED_ENDPOINTS.length}`);
  console.log(`   - Failed: ${endpointResult.failCount}`);
  
  console.log('\n✅ Schemas:');
  console.log(`   - Passed: ${schemaResult.passCount}/${EXPECTED_SCHEMAS.length}`);
  console.log(`   - Failed: ${schemaResult.failCount}`);
  
  console.log('\n✅ Tags:');
  console.log(`   - Passed: ${tagResult.passCount}/2`);
  console.log(`   - Failed: ${tagResult.failCount}`);
  
  const totalTests = EXPECTED_ENDPOINTS.length + EXPECTED_SCHEMAS.length + 2;
  const totalPassed = endpointResult.passCount + schemaResult.passCount + tagResult.passCount;
  const totalFailed = endpointResult.failCount + schemaResult.failCount + tagResult.failCount;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 TỔNG KẾT: ${totalPassed}/${totalTests} tests passed`);
  console.log('='.repeat(60));
  
  if (totalFailed === 0) {
    console.log('\n🎉 TẤT CẢ TESTS ĐỀU PASSED! Swagger documentation hoàn chỉnh!');
    console.log('\n🌐 Truy cập Swagger UI tại:');
    console.log(`   ${BASE_URL}/api/docs`);
    return 0;
  } else {
    console.log(`\n⚠️  CÓ ${totalFailed} TESTS FAILED!`);
    
    if (endpointResult.missing.length > 0) {
      console.log('\n❌ Các endpoints bị thiếu:');
      endpointResult.missing.forEach(ep => {
        console.log(`   - ${ep.method} ${ep.path}`);
      });
    }
    
    if (schemaResult.missing.length > 0) {
      console.log('\n❌ Các schemas bị thiếu:');
      schemaResult.missing.forEach(schema => {
        console.log(`   - ${schema}`);
      });
    }
    
    console.log('\n💡 Hướng dẫn khắc phục:');
    console.log('   1. Kiểm tra JSDoc comments trong route files');
    console.log('   2. Kiểm tra schemas trong swagger.js');
    console.log('   3. Restart server: node server.js');
    console.log('   4. Xem chi tiết: docs/TROUBLESHOOTING_SWAGGER.md');
    
    return 1;
  }
}

async function main() {
  console.log('🚀 Bắt đầu kiểm tra Swagger Documentation...');
  console.log(`📡 Server: ${BASE_URL}`);
  console.log(`📄 Swagger JSON: ${BASE_URL}/api-docs/swagger.json`);
  
  try {
    console.log('\n⏳ Đang tải swagger.json...');
    const swagger = await fetchSwaggerJson();
    console.log('✅ Tải swagger.json thành công!');
    
    // Kiểm tra endpoints
    const endpointResult = checkEndpoints(swagger);
    
    // Kiểm tra schemas
    const schemaResult = checkSchemas(swagger);
    
    // Kiểm tra tags
    const tagResult = checkTags(swagger);
    
    // In tổng kết
    const exitCode = printSummary(endpointResult, schemaResult, tagResult);
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error('\n💡 Giải pháp:');
    console.error('   1. Đảm bảo server đang chạy: node server.js');
    console.error('   2. Kiểm tra port 3001 không bị chiếm');
    console.error('   3. Kiểm tra swagger config trong src/config/swagger.js');
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  main();
}

module.exports = { fetchSwaggerJson, checkEndpoints, checkSchemas, checkTags };
