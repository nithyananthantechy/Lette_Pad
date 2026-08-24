// services/otpService.js — Email OTP Service
const nodemailer = require('nodemailer');
const db = require('../config/db');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
});

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to DB
const saveOTP = async (email, purpose) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000);

  // Invalidate old OTPs for same email+purpose
  await db.query(
    'UPDATE email_otps SET is_used = TRUE WHERE email = $1 AND purpose = $2 AND is_used = FALSE',
    [email, purpose]
  );

  await db.query(
    'INSERT INTO email_otps (email, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
    [email, otp, purpose, expiresAt]
  );

  return otp;
};

// Verify OTP
const verifyOTP = async (email, otp, purpose) => {
  const result = await db.query(
    `SELECT id FROM email_otps 
     WHERE email = $1 AND otp_code = $2 AND purpose = $3 
       AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, otp, purpose]
  );

  if (!result.rows[0]) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark as used
  await db.query('UPDATE email_otps SET is_used = TRUE WHERE id = $1', [result.rows[0].id]);
  return { valid: true };
};

// Send OTP Email (Tamil + English bilingual) with safe fallback
const sendOTPEmail = async (email, otp, purpose, userName = '') => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║ 🔑 [OTP GENERATED]                                    ║
║ Email:   ${email}
║ Purpose: ${purpose}
║ OTP:     ${otp}
╚═══════════════════════════════════════════════════════╝
  `);

  const purposeLabels = {
    email_verification: { en: 'Email Verification', ta: 'மின்னஞ்சல் சரிபார்ப்பு' },
    login_mfa:          { en: 'Login Verification', ta: 'உள்நுழைவு சரிபார்ப்பு' },
    password_reset:     { en: 'Password Reset', ta: 'கடவுச்சொல் மீட்டமைவு' },
  };

  const label = purposeLabels[purpose] || { en: 'Verification', ta: 'சரிபார்ப்பு' };

  const htmlContent = `
<!DOCTYPE html>
<html lang="ta">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${label.ta} OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 24px; text-align: center;">
              <div style="font-size: 38px; line-height: 1; margin-bottom: 12px;">🏛️</div>
              <h1 style="margin: 0; color: #ffffff !important; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">AI Letter Pad</h1>
              <p style="margin: 6px 0 0; color: #94a3b8 !important; font-size: 14px; font-weight: 500;">தமிழ்நாடு அரசியல் &amp; அரசு அலுவலர் தளம்</p>
            </td>
          </tr>

          <!-- Purpose Badge Bar -->
          <tr>
            <td style="background-color: #1e293b; padding: 10px 24px; text-align: center; border-top: 1px solid #334155;">
              <span style="display: inline-block; color: #38bdf8 !important; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                🔒 ${label.ta} | ${label.en}
              </span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              <h2 style="margin: 0 0 16px; color: #0f172a !important; font-size: 18px; font-weight: 600;">
                வணக்கம் ${userName ? `<span style="color: #2563eb;">${userName}</span>` : 'அன்பான பயனர்'},
              </h2>
              
              <p style="margin: 0 0 24px; color: #334155 !important; font-size: 15px; line-height: 1.6;">
                உங்கள் கணக்கிற்கான <strong>${label.ta} (${label.en})</strong> குறியீடு கீழே கொடுக்கப்பட்டுள்ளது:
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 24px 16px;">
                    <div style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 44px; font-weight: 800; color: #1e3a8a !important; letter-spacing: 12px; margin-left: 12px; line-height: 1.2;">
                      ${otp}
                    </div>
                    <div style="margin-top: 10px; color: #64748b !important; font-size: 13px; font-weight: 500;">
                      ⏱️ இந்த OTP <strong style="color: #0f172a !important;">${process.env.OTP_EXPIRES_MINUTES || 10} நிமிடங்கள்</strong> மட்டுமே செல்லுபடியாகும்
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #475569 !important; font-size: 14px; line-height: 1.5;">
                This OTP is valid for <strong>${process.env.OTP_EXPIRES_MINUTES || 10} minutes</strong>. Please enter this code on the verification screen to proceed.
              </p>

              <!-- Security Warning Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
                <tr>
                  <td style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 16px;">
                    <p style="margin: 0; color: #991b1b !important; font-size: 13px; line-height: 1.5; font-weight: 500;">
                      ⚠️ <strong>பாதுகாப்பு எச்சரிக்கை:</strong> இந்த OTP-ஐ யாரிடமும் பகிர வேண்டாம். எங்கள் குழுவினர் உங்களிடம் OTP கேட்க மாட்டார்கள்.<br>
                      <strong>Security Note:</strong> Never share this OTP with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px; color: #64748b !important; font-size: 12px; font-weight: 600;">
                AI Letter Pad Platform — Tamil Nadu Political &amp; Government Edition
              </p>
              <p style="margin: 0; color: #94a3b8 !important; font-size: 11px;">
                Secure &bull; Encrypted &bull; DPDP Act 2023 Compliant
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_USER.includes('YOUR_GMAIL')) {
      await transporter.sendMail({
        from:    process.env.EMAIL_FROM || 'AI Letter Pad <noreply@letterpad.tn>',
        to:      email,
        subject: `${otp} - உங்கள் ${label.ta} OTP | ${label.en} OTP`,
        html:    htmlContent,
      });
      console.log(`✉️ OTP Email sent successfully to ${email}`);
    } else {
      console.log(`ℹ️ SMTP not configured. Use the OTP printed above in the console.`);
    }
  } catch (err) {
    console.warn(`⚠️ SMTP send failed (${err.message}). Use the OTP printed above.`);
  }
};

const sendAndSaveOTP = async (email, purpose, userName = '') => {
  const otp = await saveOTP(email, purpose);
  await sendOTPEmail(email, otp, purpose, userName);
  return otp;
};

module.exports = { sendAndSaveOTP, verifyOTP, generateOTP };
