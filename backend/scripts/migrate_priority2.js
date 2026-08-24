// scripts/migrate_priority2.js — Priority 2 Database Performance Indexes
require('dotenv').config();
const db = require('../config/db');

async function migratePriority2() {
  try {
    console.log('Running Priority 2 Database Optimizations...');

    // 1. Composite Index on generated_letters for ultra-fast monthly quota queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_generated_letters_quota 
      ON generated_letters(generated_by, created_at);
    `);

    // 2. Index on audit_logs for payment and notification audits
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
      ON audit_logs(action, created_at DESC);
    `);

    console.log('✅ Priority 2 database indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Priority 2 Migration Error:', err);
    process.exit(1);
  }
}

migratePriority2();
