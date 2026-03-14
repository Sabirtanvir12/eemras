const express = require('express');
const { getDb } = require('../../database/db');
const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  const db = getDb();
  const categories = await db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all();
  res.json({ categories });
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  const db = getDb();
  const category = await db.prepare('SELECT * FROM categories WHERE slug = $1').get(req.params.slug);
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  res.json({ category });
});

module.exports = router;
