function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  return res.redirect('/headshot/login.html');
}

function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.adminRole === 'super_admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden. Super Admin access required.' });
}

module.exports = { requireAuth, requireSuperAdmin };
