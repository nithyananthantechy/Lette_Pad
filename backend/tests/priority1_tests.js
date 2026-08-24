// tests/priority1_tests.js — Automated Priority 1 Security & Verification Test Suite
require('dotenv').config();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const http = require('http');

const PORT = 5000;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (dataString) {
      reqHeaders['Content-Length'] = Buffer.byteLength(dataString);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = responseBody ? JSON.parse(responseBody) : {};
            resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
          } catch {
            resolve({ statusCode: res.statusCode, headers: res.headers, rawBody: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING LEADPAD AI — PRIORITY 1 AUTOMATED TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extra}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra}`);
      failed++;
    }
  }

  try {
    // Setup Test Users in Database
    // 1. Active Trial User
    const trialUserRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, password_hash)
      VALUES ('Trial User', 'test_trial@leadpad.ai', '9000000001', 'party_member', true, true, NOW() + INTERVAL '5 days', 'trial', 'hash123')
      ON CONFLICT (email) DO UPDATE SET trial_ends_at = NOW() + INTERVAL '5 days', subscription_status = 'trial', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const trialUser = trialUserRes.rows[0];
    const trialToken = jwt.sign({ userId: trialUser.id, role: trialUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 2. Expired Trial User
    const expiredTrialRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, password_hash)
      VALUES ('Expired Trial User', 'test_expired_trial@leadpad.ai', '9000000002', 'party_member', true, true, NOW() - INTERVAL '2 days', 'expired', 'hash123')
      ON CONFLICT (email) DO UPDATE SET trial_ends_at = NOW() - INTERVAL '2 days', subscription_status = 'expired', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const expiredTrialUser = expiredTrialRes.rows[0];
    const expiredTrialToken = jwt.sign({ userId: expiredTrialUser.id, role: expiredTrialUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 3. Expired Paid Subscription User
    const expiredSubRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, subscription_ends_at, password_hash)
      VALUES ('Expired Sub User', 'test_expired_sub@leadpad.ai', '9000000003', 'party_member', true, true, NOW() - INTERVAL '10 days', 'active', NOW() - INTERVAL '1 day', 'hash123')
      ON CONFLICT (email) DO UPDATE SET trial_ends_at = NOW() - INTERVAL '10 days', subscription_status = 'active', subscription_ends_at = NOW() - INTERVAL '1 day', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const expiredSubUser = expiredSubRes.rows[0];
    const expiredSubToken = jwt.sign({ userId: expiredSubUser.id, role: expiredSubUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 4. Active Paid Subscription User
    const activeSubRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, subscription_ends_at, password_hash)
      VALUES ('Active Paid User', 'test_active_paid@leadpad.ai', '9000000004', 'party_member', true, true, NOW() - INTERVAL '10 days', 'active', NOW() + INTERVAL '25 days', 'hash123')
      ON CONFLICT (email) DO UPDATE SET trial_ends_at = NOW() - INTERVAL '10 days', subscription_status = 'active', subscription_ends_at = NOW() + INTERVAL '25 days', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const activeSubUser = activeSubRes.rows[0];
    const activeSubToken = jwt.sign({ userId: activeSubUser.id, role: activeSubUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // 5. Super Admin User
    const superAdminRes = await db.query(`
      SELECT id, role FROM users WHERE email = 'nithyananthan@nskgroups.website'
    `);
    const superAdmin = superAdminRes.rows[0];
    const superAdminToken = jwt.sign({ userId: superAdmin.id, role: 'super_admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // ── TEST 1: Active Trial User accessing POST /api/letters
    const res1 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${trialToken}` }, {
      subject: 'Test Letter Under Active Trial',
      body_text: 'Trial content',
    });
    assert(res1.statusCode === 201 || (res1.statusCode !== 402 && res1.statusCode !== 401), 'Test 1: Active 7-Day Trial User is Allowed', `(Status: ${res1.statusCode})`);

    // ── TEST 2: Expired Trial User accessing POST /api/letters -> HTTP 402
    const res2 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${expiredTrialToken}` }, {
      subject: 'Test Blocked Letter',
      body_text: 'Should be blocked',
    });
    assert(res2.statusCode === 402 && res2.body.error === 'SUBSCRIPTION_REQUIRED', 'Test 2: Expired Trial User Returns HTTP 402 Payment Required', `(Status: ${res2.statusCode}, Code: ${res2.body.error})`);

    // ── TEST 3: Expired Paid Subscription User accessing POST /api/letters -> HTTP 402
    const res3 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${expiredSubToken}` }, {
      subject: 'Test Blocked Letter',
      body_text: 'Should be blocked',
    });
    assert(res3.statusCode === 402 && res3.body.error === 'SUBSCRIPTION_REQUIRED', 'Test 3: Expired Paid Subscription Returns HTTP 402 Payment Required', `(Status: ${res3.statusCode})`);

    // ── TEST 4: Active Paid Subscription User accessing POST /api/letters -> Allowed
    const res4 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${activeSubToken}` }, {
      subject: 'Paid Member Official Letter',
      body_text: 'Paid content',
    });
    assert(res4.statusCode === 201 || (res4.statusCode !== 402 && res4.statusCode !== 401), 'Test 4: Active Paid Subscription User is Allowed', `(Status: ${res4.statusCode})`);

    // ── TEST 5: Direct API bypass attempt on AI Generation endpoint -> HTTP 402
    const res5 = await makeRequest('POST', '/api/intelligence/analyze', { Authorization: `Bearer ${expiredTrialToken}` }, {
      district: 'ஈரோடு',
    });
    assert(res5.statusCode === 402 && res5.body.subscription_required === true, 'Test 5: Expired User Direct API Call on AI Studio is Blocked (402)', `(Status: ${res5.statusCode})`);

    // ── TEST 6: Payment Submission Sets status = 'pending_approval' and does NOT activate immediately
    const testUTR1 = 'UTR_' + Date.now().toString().slice(-8) + '11';
    const res6 = await makeRequest('POST', '/api/subscription/submit-payment', { Authorization: `Bearer ${expiredTrialToken}` }, {
      plan_id: 'medium',
      upi_ref_no: testUTR1,
    });
    assert(res6.statusCode === 200 && res6.body.subscription?.status === 'pending_approval', 'Test 6: Payment Submission Enters PENDING_APPROVAL State without immediate activation', `(Status: ${res6.body.subscription?.status})`);

    // Verify in DB that user is still not active
    const userCheck = await db.query('SELECT subscription_status FROM users WHERE id = $1', [expiredTrialUser.id]);
    assert(userCheck.rows[0].subscription_status === 'pending_approval', 'Test 6b: User subscription_status is pending_approval in DB');

    const paymentId = res6.body.subscription?.id;

    // ── TEST 7: Super Admin Approves Payment -> status = 'approved', subscription activated
    const res7 = await makeRequest('PUT', `/api/admin/subscriptions/${paymentId}/approve`, { Authorization: `Bearer ${superAdminToken}` }, {
      daysToAdd: 30,
    });
    assert(res7.statusCode === 200 && res7.body.success === true, 'Test 7: Super Admin Atomically Approves Payment', `(Msg: ${res7.body.message})`);

    // Verify user is now active in DB
    const userCheckAfterApprove = await db.query('SELECT subscription_status, subscription_ends_at FROM users WHERE id = $1', [expiredTrialUser.id]);
    assert(userCheckAfterApprove.rows[0].subscription_status === 'active' && new Date(userCheckAfterApprove.rows[0].subscription_ends_at) > new Date(), 'Test 7b: User Subscription Atomically Activated in DB with Future Expiry');

    // ── TEST 8: Super Admin Rejects a Payment -> status = 'rejected', subscription remains inactive
    const testUTR2 = 'UTR_' + Date.now().toString().slice(-8) + '22';
    const res8Sub = await makeRequest('POST', '/api/subscription/submit-payment', { Authorization: `Bearer ${expiredSubToken}` }, {
      plan_id: 'simple',
      upi_ref_no: testUTR2,
    });
    const paymentId2 = res8Sub.body.subscription?.id;

    const res8 = await makeRequest('PUT', `/api/admin/subscriptions/${paymentId2}/reject`, { Authorization: `Bearer ${superAdminToken}` }, {
      reason: 'Invalid UPI Transaction UTR. Amount not credited.',
    });
    assert(res8.statusCode === 200 && res8.body.success === true, 'Test 8: Super Admin Atomically Rejects Payment with Reason');

    const userCheckAfterReject = await db.query('SELECT subscription_status FROM users WHERE id = $1', [expiredSubUser.id]);
    assert(userCheckAfterReject.rows[0].subscription_status === 'expired', 'Test 8b: Rejected User Remains Expired / Inactive in DB');

    // ── TEST 9: Unauthorized User attempts to call Admin Approval API -> HTTP 403 Forbidden
    const res9 = await makeRequest('PUT', `/api/admin/subscriptions/${paymentId}/approve`, { Authorization: `Bearer ${trialToken}` }, {
      daysToAdd: 30,
    });
    assert(res9.statusCode === 403, 'Test 9: Normal User Calling Admin Approval API is Rejected with HTTP 403 Forbidden', `(Status: ${res9.statusCode})`);

    // ── TEST 10: Duplicate UTR Submission is Rejected -> HTTP 400 DUPLICATE_UTR
    const res10 = await makeRequest('POST', '/api/subscription/submit-payment', { Authorization: `Bearer ${trialToken}` }, {
      plan_id: 'simple',
      upi_ref_no: testUTR1, // Already submitted in Test 6
    });
    assert(res10.statusCode === 400 && res10.body.error === 'DUPLICATE_UTR', 'Test 10: Duplicate UTR Submission is Rejected with HTTP 400 DUPLICATE_UTR', `(Status: ${res10.statusCode}, Error: ${res10.body.error})`);

    // ── TEST 11: Audit Trail Verification
    const auditRes = await db.query(`
      SELECT action, details FROM audit_logs 
      WHERE action IN ('PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'SUBSCRIPTION_ACTIVATED')
      ORDER BY created_at DESC LIMIT 5
    `);
    assert(auditRes.rows.length >= 4, 'Test 11: Audit Logs Recorded for Payment Submission, Approval, Rejection, and Activation');

    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
    process.exit(1);
  }
}

runTests();
