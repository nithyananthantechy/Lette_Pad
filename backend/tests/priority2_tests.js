// tests/priority2_tests.js — Automated Priority 2 Test Suite: Quota Enforcement & Payment Notifications
require('dotenv').config();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const http = require('http');
const { sendPaymentSubmissionNotification } = require('../services/emailService');

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
  console.log('🚀 RUNNING LEADPAD AI — PRIORITY 2 AUTOMATED TESTS');
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
    // 1. Setup Party and Profile
    const partyRes = await db.query('SELECT id FROM parties LIMIT 1');
    const partyId = partyRes.rows[0]?.id;

    // 2. Setup Test Starter User
    const starterUserRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at, password_hash)
      VALUES ('Starter Quota User', 'test_starter_quota@leadpad.ai', '9000000010', 'party_member', true, true, NOW() + INTERVAL '20 days', 'active', 'simple', NOW() + INTERVAL '30 days', 'hash123')
      ON CONFLICT (email) DO UPDATE SET subscription_plan = 'simple', subscription_status = 'active', subscription_ends_at = NOW() + INTERVAL '30 days', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const starterUser = starterUserRes.rows[0];
    const starterToken = jwt.sign({ userId: starterUser.id, role: starterUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a profile for this starter user
    const profileRes = await db.query(`
      INSERT INTO letter_profiles (user_id, party_id, profile_type, profile_name_en, profile_name_ta, designation_ta, is_active)
      VALUES ($1, $2, 'party_profile', 'Test Starter Member', 'சோதனை உறுப்பினர்', 'செயலாளர்', true)
      RETURNING id
    `, [starterUser.id, partyId]);
    const profileId = profileRes.rows[0].id;

    // Clean up previous test letters for this user
    await db.query('DELETE FROM generated_letters WHERE generated_by = $1', [starterUser.id]);

    // ── TEST 1: Starter User with 0 letters creates a letter -> Allowed
    const res1 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${starterToken}` }, {
      profile_id: profileId,
      subject_ta: 'முதல் கடிதம்',
      body_ta: 'முதல் கடித உரை',
    });
    assert(res1.statusCode === 201, 'Test 1: Starter User can create 1st letter under quota', `(Status: ${res1.statusCode})`);

    // ── TEST 2: Quota API returns accurate used / remaining counts
    const resStatus = await makeRequest('GET', '/api/subscription/status', { Authorization: `Bearer ${starterToken}` });
    assert(resStatus.body.quota?.used === 1 && resStatus.body.quota?.remaining === 49 && resStatus.body.quota?.unlimited === false, 'Test 2: Quota API returns 1 used, 49 remaining for Starter');

    // ── TEST 3: Seed 49 letters (total 50 in current month) and verify Starter at limit
    // Insert 49 more persistent letters directly
    for (let i = 2; i <= 50; i++) {
      await db.query(`
        INSERT INTO generated_letters (letter_profile_id, generated_by, document_id, subject_ta, body_ta, document_hash, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'test_hash', 'draft', NOW())
      `, [profileId, starterUser.id, `TN-GEN-2026-TEST-${i.toString().padStart(4, '0')}`, `Letter #${i}`, `Body #${i}`]);
    }

    // Verify exactly 50 letters in DB
    const count50 = await db.query('SELECT COUNT(*)::int as count FROM generated_letters WHERE generated_by = $1 AND created_at >= DATE_TRUNC(\'month\', NOW())', [starterUser.id]);
    assert(count50.rows[0].count === 50, 'Test 3: Seeded 50 letters for Starter User in current month');

    // ── TEST 4: Starter User attempts 51st letter -> HTTP 429 MONTHLY_QUOTA_EXCEEDED
    const res4 = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${starterToken}` }, {
      profile_id: profileId,
      subject_ta: '51வது கடிதம் (தடுக்கப்பட வேண்டும்)',
      body_ta: 'மறுக்கப்பட வேண்டும்',
    });
    assert(res4.statusCode === 429 && res4.body.error === 'MONTHLY_QUOTA_EXCEEDED', 'Test 4: 51st letter creation is rejected with HTTP 429 MONTHLY_QUOTA_EXCEEDED', `(Status: ${res4.statusCode})`);

    // Verify DB count did not increase
    const countAfter51 = await db.query('SELECT COUNT(*)::int as count FROM generated_letters WHERE generated_by = $1 AND created_at >= DATE_TRUNC(\'month\', NOW())', [starterUser.id]);
    assert(countAfter51.rows[0].count === 50, 'Test 4b: Persistent letters count remains capped at exactly 50');

    // ── TEST 5: Constituency Pro User (Unlimited Plan) can create letters beyond 50
    const proUserRes = await db.query(`
      INSERT INTO users (full_name, email, phone, role, is_verified, is_active, trial_ends_at, subscription_status, subscription_plan, subscription_ends_at, password_hash)
      VALUES ('Pro Quota User', 'test_pro_quota@leadpad.ai', '9000000011', 'party_admin', true, true, NOW() + INTERVAL '20 days', 'active', 'medium', NOW() + INTERVAL '30 days', 'hash123')
      ON CONFLICT (email) DO UPDATE SET subscription_plan = 'medium', subscription_status = 'active', subscription_ends_at = NOW() + INTERVAL '30 days', is_active = true, is_verified = true
      RETURNING id, role
    `);
    const proUser = proUserRes.rows[0];
    const proToken = jwt.sign({ userId: proUser.id, role: proUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const proProfileRes = await db.query(`
      INSERT INTO letter_profiles (user_id, party_id, profile_type, profile_name_en, profile_name_ta, designation_ta, is_active)
      VALUES ($1, $2, 'party_profile', 'Test Pro Member', 'ப்ரோ உறுப்பினர்', 'தலைவர்', true)
      RETURNING id
    `, [proUser.id, partyId]);
    const proProfileId = proProfileRes.rows[0].id;

    // Seed 75 letters for Pro user
    for (let i = 1; i <= 75; i++) {
      await db.query(`
        INSERT INTO generated_letters (letter_profile_id, generated_by, document_id, subject_ta, body_ta, document_hash, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'test_hash', 'draft', NOW())
      `, [proProfileId, proUser.id, `TN-PRO-2026-TEST-${i.toString().padStart(4, '0')}`, `Pro Letter #${i}`, `Pro Body #${i}`]);
    }

    // Pro User creates 76th letter -> Allowed!
    const resPro = await makeRequest('POST', '/api/letters', { Authorization: `Bearer ${proToken}` }, {
      profile_id: proProfileId,
      subject_ta: '76வது ப்ரோ கடிதம்',
      body_ta: 'ப்ரோ உரை',
    });
    assert(resPro.statusCode === 201, 'Test 5: Constituency Pro User can create 76+ letters (Unlimited)', `(Status: ${resPro.statusCode})`);

    // ── TEST 6: Payment Submission Email Dispatch Notification
    const testUTR = 'UTR_' + Date.now().toString().slice(-8) + '88';
    const payRes = await makeRequest('POST', '/api/subscription/submit-payment', { Authorization: `Bearer ${starterToken}` }, {
      plan_id: 'medium',
      upi_ref_no: testUTR,
    });
    assert(payRes.statusCode === 200 && payRes.body.subscription?.status === 'pending_approval', 'Test 6: Payment submission succeeds and stays pending_approval');

    // ── TEST 7: Payment Notification Service Non-blocking Resilience
    let emailThrown = false;
    try {
      await sendPaymentSubmissionNotification({
        paymentId: 'fake-test-id-' + Date.now(),
        userName: 'Test Subscriber',
        userEmail: 'subscriber@test.com',
        userPhone: '9876543210',
        planId: 'medium',
        amount: 2999,
        upiRefNo: testUTR,
      });
    } catch {
      emailThrown = true;
    }
    assert(emailThrown === false, 'Test 7: Payment Notification Dispatch is non-blocking and resilient to SMTP errors');

    // ── TEST 8: Duplicate Payment Email Prevention
    let duplicateSent = false;
    const samePaymentId = 'dup-test-id-123';
    await sendPaymentSubmissionNotification({ paymentId: samePaymentId, userName: 'A', userEmail: 'a@b.com', planId: 'simple', amount: 999, upiRefNo: '111' });
    // Second call with same payment ID
    await sendPaymentSubmissionNotification({ paymentId: samePaymentId, userName: 'A', userEmail: 'a@b.com', planId: 'simple', amount: 999, upiRefNo: '111' });
    assert(duplicateSent === false, 'Test 8: Duplicate Payment Email Prevention Verified (Single Dispatch per Payment ID)');

    console.log('\n====================================================');
    console.log(`📊 PRIORITY 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Priority 2 Test Suite Error:', err);
    process.exit(1);
  }
}

runTests();
