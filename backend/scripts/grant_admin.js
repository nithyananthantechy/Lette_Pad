// scripts/grant_admin.js
const db = require('../config/db');

async function grantAdmin() {
  try {
    const res = await db.query(
      `UPDATE users 
       SET role = 'super_admin',
           subscription_status = 'active',
           subscription_plan = 'custom',
           subscription_ends_at = NOW() + INTERVAL '10 years'
       WHERE email = 'nithyananthan@nskgroups.website'
       RETURNING id, full_name, email, role, subscription_status`
    );
    console.log('✅ Super Admin configured successfully:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error granting super admin:', err);
    process.exit(1);
  }
}

grantAdmin();
