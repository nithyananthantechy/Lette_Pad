// middleware/rbac.js — Role Based Access Control
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role,
      });
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email to continue.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

// Roles: super_admin, party_admin, party_member, govt_official, govt_staff
const ROLES = {
  SUPER_ADMIN:   'super_admin',
  PARTY_ADMIN:   'party_admin',
  PARTY_MEMBER:  'party_member',
  GOVT_OFFICIAL: 'govt_official',
  GOVT_STAFF:    'govt_staff',
};

module.exports = { requireRole, requireVerified, ROLES };
