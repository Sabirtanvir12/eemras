# 🛍️ EEMRAS — Secure Product Catalog System

A full-stack, secure EEMRAS product catalog website with public storefront and admin panel.

---

## ✨ Features

### Public Store
- 📱 Mobile-first responsive design (2→5 column grid)
- 🏷️ Category browsing with product counts
- 🔍 Search by name, code, or category
- 🔽 Filters: category, size, availability, sort order
- 📄 Pagination on all product lists
- ⭐ Wishlist (localStorage, no login needed)
- 💾 Copy-to-clipboard product codes with toast animation
- 🖼️ Lazy-loading images with skeleton loading
- 💰 Discount price display (~~original~~ discounted)
- 🖼️ Product gallery with swipe support on mobile
- 🔗 Share product button

### Admin Panel
- 🔐 Secure login with bcrypt password hashing
- ⏱️ Rate limiting (10 attempts per 15 minutes)
- 👥 Multiple admin accounts with roles (Admin / Super Admin)
- 📊 Dashboard with stats (products, categories, sold out, views)
- ✏️ Full product CRUD (add, edit, delete, status toggle)
- 🖼️ Drag & drop image upload with automatic WebP conversion
- 🗂️ Category management with images
- 👁️ View counter (only visible to admins)
- 🔑 Change password from settings
- 🚪 Logout with session cleanup

### Security
- 🔒 bcrypt password hashing (12 rounds)
- 🛡️ Helmet.js security headers
- 💉 SQL injection protection (parameterized queries)
- ✅ Input validation on all endpoints
- 🔐 Session-based auth with secure cookies
- 🖼️ Image upload validation (type + size)
- 🚫 XSS protection

---

## 🚀 Setup

### Prerequisites
- Node.js 18+ 
- npm

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start the server (database auto-initializes)
npm start

# For development with auto-reload:
npm run dev
```

### Access
| URL | Description |
|-----|-------------|
| `http://localhost:3000` | EEMRAS Store |
| `http://localhost:3000/admin` | Admin Panel |
| `http://localhost:3000/admin/login.html` | Admin Login |
| `http://localhost:3000/color-palette.html` | Color Palette |

### Default Admin Credentials
```
Email:    admin@eemras.com
Password: Admin@123
```
**⚠️ Change this password immediately after first login!**

---

## 📁 Project Structure

```
eemras/
├── server.js              # Main Express server
├── database/
│   ├── init.js            # SQLite schema + seed
│   └── db.js              # DB connection singleton
├── middleware/
│   ├── auth.js            # Auth guard middleware
│   └── upload.js          # Multer + Sharp image processing
├── routes/
│   ├── auth.js            # Login/logout/session
│   └── api/
│       ├── products.js    # Public product API
│       ├── categories.js  # Public category API
│       └── admin.js       # Admin CRUD API
├── public/
│   ├── index.html         # Homepage
│   ├── products.html      # Product listing
│   ├── product-detail.html# Product page
│   ├── category.html      # Category page
│   ├── search.html        # Search results
│   ├── wishlist.html      # Wishlist page
│   ├── logo.jpg           # EEMRAS logo
│   ├── 404.html           # Error page
│   ├── css/
│   │   ├── style.css      # Public styles
│   │   ├── admin.css      # Admin styles
│   │   └── colors.css     # Color utilities
│   ├── js/
│   │   ├── utils.js       # Shared public utilities
│   │   ├── admin-utils.js # Admin utilities
│   │   └── sidebar.js     # Sidebar template
│   └── admin/
│       ├── login.html     # Admin login
│       ├── dashboard.html # Admin dashboard
│       ├── products.html  # Product management
│       ├── add-product.html
│       ├── edit-product.html
│       ├── categories.html
│       ├── admins.html    # (Super Admin only)
│       └── settings.html
└── uploads/               # Uploaded images (auto-created)
```

---

## 🗄️ Database Schema

SQLite database (`eemras.db`) auto-created on first run.

| Table | Description |
|-------|-------------|
| `admins` | Admin accounts with hashed passwords |
| `categories` | Product categories with images |
| `products` | Products with pricing, status, views |
| `product_images` | Gallery images per product |
| `sessions` | Session storage |

---

## 🌐 API Reference

### Public Endpoints
```
GET  /api/products              # List products (pagination, filters)
GET  /api/products/latest       # Latest 10 products
GET  /api/products/:id          # Product detail (increments views)
GET  /api/categories            # All categories with counts
GET  /api/categories/:slug      # Single category
```

### Auth
```
POST /api/auth/login            # { email, password }
POST /api/auth/logout
GET  /api/auth/me
```

### Admin (requires auth)
```
GET    /api/admin/dashboard
GET    /api/admin/products
POST   /api/admin/products      # multipart/form-data
PUT    /api/admin/products/:id  # multipart/form-data
DELETE /api/admin/products/:id
DELETE /api/admin/products/:id/images/:imgId

GET    /api/admin/categories
POST   /api/admin/categories    # multipart/form-data
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

GET    /api/admin/admins        # Super Admin only
POST   /api/admin/admins        # Super Admin only
DELETE /api/admin/admins/:id    # Super Admin only
PUT    /api/admin/admins/change-password
```

---

## ⚙️ Environment Variables

Create a `.env` file (optional):
```env
PORT=3000
SESSION_SECRET=your-very-secret-key-change-this
NODE_ENV=production
```

---

## 🛡️ Production Notes

1. Set `NODE_ENV=production` for secure cookies
2. Use a strong, random `SESeemrasCRET`
3. Set up HTTPS (nginx reverse proxy recommended)
4. Consider moving to PostgreSQL/MySQL for scale
5. Add backup strategy for `eemras.db` and `uploads/`

---

## 📝 License

MIT — Built for educational and commercial use.
