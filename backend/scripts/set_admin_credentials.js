// scripts/set_admin_credentials.js
require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function setAdmin() {
  try {
    const password = 'Admin@12345';
    const hash = await bcrypt.hash(password, 12);
    
    const res = await db.query(
      `UPDATE users 
       SET password_hash = $1,
           role = 'super_admin',
           subscription_status = 'active',
           subscription_plan = 'custom',
           subscription_ends_at = NOW() + INTERVAL '10 years',
           is_active = true,
           is_verified = true
       WHERE email = 'nithyananthan@nskgroups.website'
       RETURNING id, full_name, email, role, subscription_status`,
      [hash]
    );

    console.log('✅ Admin Credentials Configured Successfully:');
    console.log('-------------------------------------------');
    console.log('Email:    nithyananthan@nskgroups.website');
    console.log('Password: Admin@12345');
    console.log('Role:    ', res.rows[0].role);
    console.log('-------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

setAdmin();
