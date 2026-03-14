require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { initDb, pool } = require('./database/db');
const { initDatabase } = require('./database/init');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/api/products');
const categoriesRoutes = require('./routes/api/categories');
const headshotRoutes = require('./routes/api/admin');

const app = express();

// Trust Render/Railway/Heroku reverse proxy so secure cookies work on HTTPS
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: SESSION_SECRET environment variable must be set in production!');
  process.exit(1);
}

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────
// Enable only basic security (no CSP restrictions)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ─── SESSION ───────────────────────────────────────────────────────────────
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  },
  name: 'eemras.sid'
}));

// ─── PARSERS ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: false }));

// ─── STATIC FILES ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  etag: true
}));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  index: false
}));

// ─── API ROUTES ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/headshot', headshotRoutes);

// ─── PAGE ROUTES ───────────────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/products', (req, res) => res.sendFile(path.join(__dirname, 'public', 'products.html')));
app.get('/product/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'product-detail.html')));
app.get('/category/:slug', (req, res) => res.sendFile(path.join(__dirname, 'public', 'category.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'search.html')));
app.get('/wishlist', (req, res) => res.sendFile(path.join(__dirname, 'public', 'wishlist.html')));

// Headshot panel pages
app.get('/headshot', (req, res) => res.redirect('/headshot/dashboard.html'));
app.get('/headshot/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'headshot', 'login.html')));

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ─── ERROR HANDLER ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 5MB per image.' });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDb();
    await initDatabase();

    // Only listen if not on Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 EEMRAS running at http://localhost:${PORT}`);
        console.log(`📊 Admin Panel: http://localhost:${PORT}/headshot`);
        console.log(`🔑 Default login: admin@eemras.com / Admin@123\n`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    if (!process.env.VERCEL) process.exit(1);
  }
}

startServer();

// Export for Vercel
module.exports = app;
