// scripts/migrate_all.js
require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function migrateAll() {
  try {
    console.log('Connecting to database...');

    // 1. Add subscription and trial columns to users
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    console.log('✅ Users table columns updated');

    // 2. Create subscriptions table
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
    console.log('✅ Subscriptions table verified');

    // 3. Set Super Admin user
    const password = 'Admin@12345';
    const hash = await bcrypt.hash(password, 12);

    const adminRes = await db.query(`
      UPDATE users 
      SET password_hash = $1,
          role = 'super_admin',
          subscription_status = 'active',
          subscription_plan = 'custom',
          subscription_ends_at = NOW() + INTERVAL '10 years',
          is_active = true,
          is_verified = true,
          updated_at = NOW()
      WHERE email = 'nithyananthan@nskgroups.website'
      RETURNING id, full_name, email, role, subscription_status;
    `, [hash]);

    console.log('✅ Super Admin Account Configured:');
    console.log(adminRes.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateAll();
