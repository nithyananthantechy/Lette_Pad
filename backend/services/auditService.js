// services/auditService.js — Audit Log Helper
const db = require('../config/db');

const logAction = async ({
  userId = null,
  action,
  resourceType = null,
  resourceId = null,
  ipAddress = null,
  userAgent = null,
  details = {},
}) => {
  try {
    await db.query(
      `INSERT INTO audit_logs 
         (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(details)]
    );
  } catch (err) {
    // Audit log failure should NOT break the main flow
    console.error('⚠️ Audit log failed:', err.message);
  }
};

// Extract IP from request
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

module.exports = { logAction, getClientIP };
