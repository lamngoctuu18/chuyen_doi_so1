/**
 * Script to create new database tables for:
 * 1. Student Report Submissions (bao_cao_da_nop)
 * 2. Password Reset (doi_mat_khau)
 */

const StudentReportSubmission = require('../src/models/StudentReportSubmission');
const PasswordReset = require('../src/models/PasswordReset');

async function createNewTables() {
  console.log('🚀 Starting table creation process...\n');

  try {
    // Create bao_cao_da_nop table
    console.log('📊 Creating bao_cao_da_nop table...');
    await StudentReportSubmission.createTable();
    console.log('✅ Table bao_cao_da_nop created successfully\n');

    // Create doi_mat_khau table
    console.log('🔐 Creating doi_mat_khau table...');
    await PasswordReset.createTable();
    console.log('✅ Table doi_mat_khau created successfully\n');

    console.log('🎉 All tables created successfully!');
    console.log('\n📋 Summary:');
    console.log('  - bao_cao_da_nop: Student report submissions with FK constraints');
    console.log('  - doi_mat_khau: Password reset requests with expiration\n');

    console.log('✨ Next steps:');
    console.log('  1. Verify tables in database');
    console.log('  2. Test API endpoints');
    console.log('  3. Check foreign key constraints\n');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error('\n🔍 Troubleshooting tips:');
    console.error('  - Check database connection in .env file');
    console.error('  - Ensure MySQL service is running');
    console.error('  - Verify referenced tables exist (sinh_vien, dot_thuc_tap, accounts)');
    console.error('  - Check user permissions for CREATE TABLE\n');
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
createNewTables();
