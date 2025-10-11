// Add unique indexes to prevent duplicates
const db = require('../src/database/connection');

async function ensureUniqueIndex(table, indexName, column) {
  const rows = await db.query(
    `SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, indexName]
  );
  if ((rows[0]?.c || 0) === 0) {
    console.log(`Adding UNIQUE index ${indexName} on ${table}(${column})...`);
    await db.query(`ALTER TABLE ${table} ADD UNIQUE KEY ${indexName} (${column})`);
    console.log(`✅ Added ${indexName}`);
  } else {
    console.log(`ℹ️ Index ${indexName} already exists on ${table}`);
  }
}

(async () => {
  try {
    await ensureUniqueIndex('sinh_vien', 'uniq_ma_sinh_vien', 'ma_sinh_vien');
    await ensureUniqueIndex('accounts', 'uniq_user_id', 'user_id');
    console.log('All unique indexes ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to add unique indexes:', err);
    process.exit(1);
  }
})();
