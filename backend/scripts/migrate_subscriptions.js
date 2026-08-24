// scripts/migrate_subscriptions.js
const db = require('../config/db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;
    `);

    await db.query(`
      UPDATE users 
      SET trial_ends_at = COALESCE(created_at, NOW()) + INTERVAL '7 days'
      WHERE trial_ends_at IS NULL;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_id VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        upi_ref_no VARCHAR(100),
        payment_method VARCHAR(50) DEFAULT 'upi_qr',
        payment_screenshot TEXT,
        status VARCHAR(50) DEFAULT 'active',
        starts_at TIMESTAMP DEFAULT NOW(),
        ends_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Subscription tables and trial columns migrated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
