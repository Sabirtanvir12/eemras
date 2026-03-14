const bcrypt = require('bcryptjs');
const { initDb, getDb, pool } = require('./db');

async function initDatabase() {
  try {
    // Initialize database
    await initDb();
    const db = getDb();

    // Create tables with PostgreSQL syntax
    const tables = `
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        category_id INTEGER,
        measurement TEXT,
        price NUMERIC NOT NULL,
        discount_price NUMERIC,
        description TEXT,
        main_image TEXT,
        views INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'sold_out')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "idx_session_expire" ON "session" ("expire");
    `;

    // Execute table creation statements
    // PostgreSQL can execute multiple statements in one query if semicolon-separated
    await db.exec(tables);

    // Seed super admin if none exists
    const adminCount = await db.prepare('SELECT COUNT(*) as cnt FROM admins').get();
    if (parseInt(adminCount.cnt) === 0) {
      const hash = bcrypt.hashSync('Admin@123', 12);
      await db.prepare(`
        INSERT INTO admins (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
      `).run('Super Admin', 'admin@eemras.com', hash, 'super_admin');
      console.log('✅ Default super admin created: admin@eemras.com / Admin@123');
    }

    // Seed sample categories if empty
    const catCount = await db.prepare('SELECT COUNT(*) as cnt FROM categories').get();
    if (parseInt(catCount.cnt) === 0) {
      const cats = [
        { name: 'Shirt', slug: 'shirt', image: null },
        { name: 'Pant', slug: 'pant', image: null },
        { name: 'T-Shirt', slug: 't-shirt', image: null },
        { name: 'Hoodie', slug: 'hoodie', image: null },
        { name: 'Jacket', slug: 'jacket', image: null },
      ];
      for (const c of cats) {
        await db.prepare('INSERT INTO categories (name, slug, image) VALUES ($1, $2, $3)').run(c.name, c.slug, c.image);
      }
      console.log('✅ Sample categories seeded.');
    }

    console.log('✅ Database initialized and synced with Neon.');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase };
