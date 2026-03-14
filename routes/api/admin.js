const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../../database/db');
const { requireAuth, requireSuperAdmin } = require('../../middleware/auth');
const { upload, optimizeAndSave, optimizeThumbnail, deleteFile } = require('../../middleware/upload');
const router = express.Router();

// All admin routes require auth
router.use(requireAuth);

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  const db = getDb();
  const stats = {
    totalProducts: (await db.prepare('SELECT COUNT(*) as n FROM products').get()).n,
    totalCategories: (await db.prepare('SELECT COUNT(*) as n FROM categories').get()).n,
    soldOut: (await db.prepare("SELECT COUNT(*) as n FROM products WHERE status='sold_out'").get()).n,
    totalViews: (await db.prepare('SELECT COALESCE(SUM(views),0) as n FROM products').get()).n,
  };
  const recentProducts = await db.prepare(`
    SELECT p.id, p.name, p.code, p.views, p.status, p.price,
           c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC LIMIT 5
  `).all();
  res.json({ stats, recentProducts });
});

// ─── PRODUCTS ──────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const { search } = req.query;

  let where = '';
  let params = [];
  if (search) {
    where = 'WHERE p.name LIKE ? OR p.code LIKE ? OR c.name LIKE ?';
    const q = `%${search}%`;
    params = [q, q, q];
  }

  const total = (await db.prepare(`SELECT COUNT(*) as n FROM products p LEFT JOIN categories c ON p.category_id=c.id ${where}`).get(...params)).n;
  const products = await db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id=c.id
    ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/products/:id', async (req, res) => {
  const db = getDb();
  const product = await db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id=c.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found.' });
  const images = await db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id);
  res.json({ product, images });
});

router.post('/products', upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  try {
    const { name, code, category_id, measurement, price, discount_price, description, status } = req.body;
    if (!name || !code || !price) return res.status(400).json({ error: 'Name, code, and price are required.' });
    
    // Input validation
    if (String(name).length > 255) return res.status(400).json({ error: 'Product name too long (max 255 chars).' });
    if (String(code).length > 50) return res.status(400).json({ error: 'Product code too long (max 50 chars).' });
    if (description && String(description).length > 5000) return res.status(400).json({ error: 'Description too long (max 5000 chars).' });
    
    // Validate status
    const validStatuses = ['available', 'sold_out'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid product status.' });
    
    // Validate prices
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Invalid price value.' });
    if (discount_price) {
      const discountPrice = parseFloat(discount_price);
      if (isNaN(discountPrice) || discountPrice < 0) return res.status(400).json({ error: 'Invalid discount price.' });
      if (discountPrice > parsedPrice) return res.status(400).json({ error: 'Discount price cannot exceed regular price.' });
    }

    const db = getDb();
    const exists = await db.prepare('SELECT id FROM products WHERE code = ?').get(code.trim().toUpperCase());
    if (exists) return res.status(400).json({ error: 'Product code already exists.' });

    let main_image = null;
    if (req.files?.main_image?.[0]) {
      main_image = await optimizeAndSave(req.files.main_image[0].buffer, req.files.main_image[0].originalname);
    }

    const result = await db.prepare(`
      INSERT INTO products (name, code, category_id, measurement, price, discount_price, description, main_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).run(
      name.trim(), code.trim().toUpperCase(),
      category_id || null, measurement || null,
      parseFloat(price), discount_price ? parseFloat(discount_price) : null,
      description || null, main_image,
      status || 'available'
    );

    const productId = result.lastID;

    // Gallery images
    if (req.files?.gallery) {
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?,?,?)');
      for (let i = 0; i < req.files.gallery.length; i++) {
        const url = await optimizeAndSave(req.files.gallery[i].buffer, req.files.gallery[i].originalname);
        await insertImg.run(productId, url, i);
      }
    }

    res.status(201).json({ success: true, id: productId });
  } catch (err) {
    console.error('[Product Create Error]', err.message);
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Product code already exists.' });
    res.status(500).json({ error: 'Failed to create product. Please check your input.' });
  }
});

router.put('/products/:id', upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid product ID.' });
    
    const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const { name, code, category_id, measurement, price, discount_price, description, status } = req.body;
    
    // Input validation
    if (name && String(name).length > 255) return res.status(400).json({ error: 'Product name too long.' });
    if (code && String(code).length > 50) return res.status(400).json({ error: 'Product code too long.' });
    if (description && String(description).length > 5000) return res.status(400).json({ error: 'Description too long.' });
    
    // Validate status
    const validStatuses = ['available', 'sold_out'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid product status.' });
    
    // Validate prices
    if (price) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Invalid price value.' });
    }
    if (discount_price) {
      const discountPrice = parseFloat(discount_price);
      if (isNaN(discountPrice) || discountPrice < 0) return res.status(400).json({ error: 'Invalid discount price.' });
    }

    let main_image = product.main_image;
    if (req.files?.main_image?.[0]) {
      if (product.main_image) deleteFile(product.main_image);
      main_image = await optimizeAndSave(req.files.main_image[0].buffer, req.files.main_image[0].originalname);
    }

    await db.prepare(`
      UPDATE products SET name=?, code=?, category_id=?, measurement=?, price=?,
      discount_price=?, description=?, main_image=?, status=?
      WHERE id=?
    `).run(
      name?.trim() || product.name,
      code?.trim().toUpperCase() || product.code,
      category_id || product.category_id,
      measurement || product.measurement,
      price ? parseFloat(price) : product.price,
      discount_price ? parseFloat(discount_price) : null,
      description || product.description,
      main_image,
      status || product.status,
      id
    );

    // Replace gallery images if uploaded
    if (req.files?.gallery) {
      // Delete old gallery images
      const oldImages = await db.prepare('SELECT image_url FROM product_images WHERE product_id = ?').all(id);
      for (const img of oldImages) {
        await deleteFile(img.image_url);
      }
      await db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      
      // Add new gallery images
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?,?,?)');
      for (let i = 0; i < req.files.gallery.length; i++) {
        const url = await optimizeAndSave(req.files.gallery[i].buffer, req.files.gallery[i].originalname);
        await insertImg.run(id, url, i);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Product Update Error]', err.message);
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Product code already exists.' });
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

router.delete('/products/:id', async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid product ID.' });
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).json({ error: 'Not found.' });

  // Delete images
  if (product.main_image) await deleteFile(product.main_image);
  const images = await db.prepare('SELECT image_url FROM product_images WHERE product_id = ?').all(id);
  for (const img of images) {
    await deleteFile(img.image_url);
  }

  await db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ success: true });
});

router.delete('/products/:id/images/:imgId', async (req, res) => {
  const db = getDb();
  const productId = parseInt(req.params.id);
  const imgId = parseInt(req.params.imgId);
  if (isNaN(productId) || isNaN(imgId) || productId <= 0 || imgId <= 0) {
    return res.status(400).json({ error: 'Invalid IDs.' });
  }
  const img = await db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(imgId, productId);
  if (!img) return res.status(404).json({ error: 'Image not found.' });
  await deleteFile(img.image_url);
  await db.prepare('DELETE FROM product_images WHERE id = ?').run(imgId);
  res.json({ success: true });
});

// ─── CATEGORIES ────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  const db = getDb();
  const cats = await db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c LEFT JOIN products p ON p.category_id=c.id
    GROUP BY c.id ORDER BY c.name ASC
  `).all();
  res.json({ categories: cats });
});

router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug required.' });
    
    // Input validation
    if (String(name).length > 100) return res.status(400).json({ error: 'Category name too long.' });
    if (String(slug).length > 50) return res.status(400).json({ error: 'Slug too long.' });

    const db = getDb();
    // Sanitize slug: lowercase, remove special chars, deduplicate hyphens
    const cleanSlug = String(slug).toLowerCase().trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!cleanSlug || cleanSlug.length === 0) {
      return res.status(400).json({ error: 'Invalid slug format.' });
    }

    let image = null;
    if (req.file) {
      image = await optimizeAndSave(req.file.buffer, req.file.originalname);
    }

    const result = await db.prepare('INSERT INTO categories (name, slug, image) VALUES (?,?,?) RETURNING id').run(name.trim(), cleanSlug, image);
    res.status(201).json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('[Category Create Error]', err.message);
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Category slug already exists.' });
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid category ID.' });
    
    const cat = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    const { name } = req.body;
    if (name && String(name).length > 100) return res.status(400).json({ error: 'Category name too long.' });

    let image = cat.image;
    if (req.file) {
      if (cat.image) deleteFile(cat.image);
      image = await optimizeAndSave(req.file.buffer, req.file.originalname);
    }

    const updateName = name ? String(name).trim() : cat.name;
    await db.prepare('UPDATE categories SET name=?, image=? WHERE id=?').run(updateName, image, id);
    res.json({ success: true });
  } catch (err) {
    console.error('[Category Update Error]', err.message);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid category ID.' });
  
  const cat = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  
  if (cat.image) await deleteFile(cat.image);
  await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true });
});

// ─── ADMIN MANAGEMENT (super admin only) ───────────────────────────────────
router.get('/admins', requireSuperAdmin, async (req, res) => {
  const db = getDb();
  const admins = await db.prepare('SELECT id, name, email, role, created_at FROM admins ORDER BY created_at DESC').all();
  res.json({ admins });
});

router.post('/admins', requireSuperAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
  
  // Input validation
  if (String(name).length > 100) return res.status(400).json({ error: 'Name too long.' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) return res.status(400).json({ error: 'Invalid email format.' });

  const db = getDb();
  const hash = bcrypt.hashSync(password, 12);
  try {
    const result = await db.prepare('INSERT INTO admins (name, email, password_hash, role) VALUES (?,?,?,?) RETURNING id').run(
      String(name).trim(), String(email).toLowerCase().trim(), hash, role === 'super_admin' ? 'super_admin' : 'admin'
    );
    res.status(201).json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('[Admin Create Error]', err.message);
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Email already in use.' });
    res.status(500).json({ error: 'Failed to create admin.' });
  }
});

router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) return res.status(400).json({ error: 'Invalid admin ID.' });
  
  if (id === req.session.adminId) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }
  
  const admin = await db.prepare('SELECT id FROM admins WHERE id = ?').get(id);
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  
  await db.prepare('DELETE FROM admins WHERE id = ?').run(id);
  res.json({ success: true });
});

router.put('/change-password', async (req, res) => {
  const { current_password, new_password, new_password_confirm } = req.body;
  if (!current_password || !new_password || !new_password_confirm) {
    return res.status(400).json({ error: 'All password fields required.' });
  }
  
  if (String(new_password).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  
  if (new_password !== new_password_confirm) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }
  
  if (current_password === new_password) {
    return res.status(400).json({ error: 'New password must be different from current password.' });
  }
 
  const db = getDb();
  const admin = await db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.adminId);
  if (!admin || !bcrypt.compareSync(String(current_password), admin.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  
  const hash = bcrypt.hashSync(String(new_password), 12);
  await db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(hash, req.session.adminId);
  res.json({ success: true });
});

module.exports = router;
