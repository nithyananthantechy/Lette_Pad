// scripts/migrate_priority1.js
require('dotenv').config();
const db = require('../config/db');

async function migratePriority1() {
  try {
    console.log('Running Priority 1 Database Schema Updates...');

    // 1. Update subscriptions table schema
    await db.query(`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
    `);

    // 2. Add Unique Index for upi_ref_no to prevent duplicate submission of the same transaction
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_unique_upi_ref 
      ON subscriptions(upi_ref_no) 
      WHERE upi_ref_no IS NOT NULL AND upi_ref_no != '' AND upi_ref_no != 'MANUAL_UPI_SCAN';
    `);

    console.log('✅ Subscriptions table schema updated with approval fields and unique UTR index');
    process.exit(0);
  } catch (err) {
    console.error('Priority 1 Migration Error:', err);
    process.exit(1);
  }
}

migratePriority1();
