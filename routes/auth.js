const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../database/db');
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const db = getDb();
    const admin = await db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase().trim());

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.adminId = admin.id;
    req.session.adminName = admin.name;
    req.session.adminRole = admin.role;

    res.json({
      success: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('eemras.sid');
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    admin: {
      id: req.session.adminId,
      name: req.session.adminName,
      role: req.session.adminRole
    }
  });
});

module.exports = router;
