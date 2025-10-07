const RegistrationPeriod = require('./src/models/RegistrationPeriod');

async function createRegistrationTable() {
  try {
    await RegistrationPeriod.createTable();
    console.log('✅ Registration periods table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating registration periods table:', error);
    process.exit(1);
  }
}

createRegistrationTable();