// server/middleware/admin.js
module.exports = (req, res, next) => {
  // Confirm that auth middleware has run and the user possesses the admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access Denied: Administrative permissions required.' });
  }
  next();
};
