// services/emailService.js — Super Admin Payment Notification & Email Dispatcher
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { logAction } = require('./auditService');

const ADMIN_EMAIL = process.env.ADMIN_PAYMENT_EMAIL || 'nskgroups2@gmail.com';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, ''),
  },
});

// Cache to prevent duplicate notification sends for the same payment ID in memory
const sentPaymentNotifications = new Set();

/**
 * Sends an email notification to the Super Admin when a new manual UPI payment is submitted.
 * Designed to execute non-blockingly after DB transaction commit.
 */
const sendPaymentSubmissionNotification = async ({
  paymentId,
  userName,
  userEmail,
  userPhone,
  planId,
  amount,
  upiRefNo,
  createdAt,
}) => {
  if (!paymentId) return;

  // Duplicate send prevention
  if (sentPaymentNotifications.has(paymentId)) {
    console.log(`[Email Service] Notification already dispatched for payment: ${paymentId}`);
    return;
  }
  sentPaymentNotifications.add(paymentId);

  const planName = planId === 'medium' ? 'Constituency Pro (₹2,999)' : planId === 'custom' ? 'State Enterprise (₹14,999)' : 'Starter (₹999)';
  const formattedDate = new Date(createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const mailOptions = {
    from: `"LeadPad AI Notifications" <${process.env.EMAIL_USER || 'nskgroups2@gmail.com'}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 New UPI Payment Pending Approval — ${userName} (₹${amount}) — LeadPad AI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 20px; border-radius: 12px; text-align: center; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; color: #f8fafc;">🏛️ LeadPad AI — Payment Notification</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">New UPI / Google Pay Transaction Awaiting Verification</p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; color: #92400e; font-size: 13px;">
          <strong>⏳ Action Required:</strong> A user has submitted a Google Pay UPI payment. Please verify credit in your bank/UPI app and approve the plan on the Admin Panel.
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 24px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">User Name:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0f172a;">${userName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">User Email:</td>
            <td style="padding: 10px 0; color: #0f172a;">${userEmail}</td>
          </tr>
          ${userPhone ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Phone:</td>
            <td style="padding: 10px 0; color: #0f172a;">${userPhone}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Selected Plan:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #2563eb;">${planName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Amount:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #059669; font-size: 15px;">₹${Number(amount).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">UPI Ref / UTR:</td>
            <td style="padding: 10px 0; font-family: monospace; font-weight: bold; color: #d97706; background-color: #fffbeb; padding-left: 6px; border-radius: 4px;">${upiRefNo}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Submission Time:</td>
            <td style="padding: 10px 0; color: #64748b;">${formattedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Payment Record ID:</td>
            <td style="padding: 10px 0; font-family: monospace; font-size: 11px; color: #94a3b8;">${paymentId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #64748b;">Status:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #d97706;">PENDING_APPROVAL</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">
            👑 Open Admin Panel to Approve
          </a>
        </div>

        <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          LeadPad AI Security & Billing Engine &bull; Confidential
        </div>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[Email Service] SMTP credentials not configured. Skipping email dispatch.');
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Payment submission notification sent to Admin: ${info.messageId}`);

    // Audit notification success
    await logAction({
      userId: null,
      action: 'ADMIN_PAYMENT_NOTIFICATION_SENT',
      resourceType: 'subscription',
      resourceId: paymentId,
      details: {
        recipient: ADMIN_EMAIL,
        messageId: info.messageId,
        paymentId,
        amount,
        upiRefNo,
      },
    });
  } catch (err) {
    console.error('[Email Service] Failed to send admin payment notification:', err.message);

    // Audit notification failure safely (does NOT crash or rollback payment)
    await logAction({
      userId: null,
      action: 'ADMIN_PAYMENT_NOTIFICATION_FAILED',
      resourceType: 'subscription',
      resourceId: paymentId,
      details: {
        recipient: ADMIN_EMAIL,
        error: err.message,
        paymentId,
      },
    }).catch(() => {});
  }
};

module.exports = {
  sendPaymentSubmissionNotification,
};
