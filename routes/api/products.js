const express = require('express');
const { getDb } = require('../../database/db');
const router = express.Router();

// GET /api/products — paginated list with filters
router.get('/', async (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(40, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const { category, measurement, status, search, sort } = req.query;

  let where = [];
  let params = [];

  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (measurement) { where.push('p.measurement = ?'); params.push(measurement); }
  if (status) { where.push('p.status = ?'); params.push(status); }
  if (search) {
    where.push('(p.name LIKE ? OR p.code LIKE ? OR c.name LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'name') orderBy = 'p.name ASC';

  const countRow = await db.prepare(`
    SELECT COUNT(*) as total FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSQL}
  `).get(...params);

  const products = await db.prepare(`
    SELECT p.id, p.name, p.code, p.price, p.discount_price,
           p.measurement, p.status, p.main_image, p.created_at,
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereSQL}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total: countRow.total,
      pages: Math.ceil(countRow.total / limit)
    }
  });
});

// GET /api/products/latest — for homepage
router.get('/latest', async (req, res) => {
  const db = getDb();
  const products = await db.prepare(`
    SELECT p.id, p.name, p.code, p.price, p.discount_price,
           p.measurement, p.status, p.main_image,
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
    LIMIT 10
  `).all();
  res.json({ products });
});

// GET /api/products/:id — product detail (increments views)
router.get('/:id', async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

  const product = await db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id);

  if (!product) return res.status(404).json({ error: 'Product not found.' });

  // Increment views
  await db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(id);

  // Get gallery images
  const images = await db.prepare('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order').all(id);

  // Get related products
  const related = await db.prepare(`
    SELECT p.id, p.name, p.code, p.price, p.discount_price, p.status, p.main_image,
           c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.id != ?
    ORDER BY p.created_at DESC
    LIMIT 6
  `).all(product.category_id, id);

  res.json({ product: { ...product, views: product.views + 1 }, images, related });
});

module.exports = router;
