const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let _dbWrapper = null;

// Helper to convert SQLite syntax to PostgreSQL if needed
function convertSql(sql) {
  let count = 0;
  return sql.replace(/\?/g, () => {
    count++;
    return `$${count}`;
  });
}

class Statement {
  constructor(pool, sql) {
    this.pool = pool;
    this.sql = sql;
  }

  async get(...params) {
    try {
      const pgSql = convertSql(this.sql);
      const res = await this.pool.query(pgSql, params);
      return res.rows[0];
    } catch (err) {
      console.error('PostgreSQL Error in get():', err.message, 'SQL:', this.sql, 'Params:', params);
      throw err;
    }
  }

  async all(...params) {
    try {
      const pgSql = convertSql(this.sql);
      const res = await this.pool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error('PostgreSQL Error in all():', err.message, 'SQL:', this.sql, 'Params:', params);
      throw err;
    }
  }

  async run(...params) {
    try {
      const pgSql = convertSql(this.sql);
      const res = await this.pool.query(pgSql, params);
      
      // PostgreSQL doesn't have last_insert_rowid() like SQLite
      // We usually use RETURNING id in Postgres, but to keep the routes same-ish
      // we can try to guess or use the result.
      // EEMRAS usually does SELECT last_insert_rowid() as id
      
      let lastID = null;
      if (res.rows && res.rows[0] && res.rows[0].id) {
        lastID = res.rows[0].id;
      }

      return { 
        changes: res.rowCount, 
        lastID, 
        lastInsertRowid: lastID 
      };
    } catch (err) {
      console.error('PostgreSQL Error in run():', err.message, 'SQL:', this.sql, 'Params:', params);
      throw err;
    }
  }
}

class DatabaseWrapper {
  constructor(pool) {
    this.pool = pool;
  }

  prepare(sql) {
    return new Statement(this.pool, sql);
  }

  async run(sql) {
    try {
      await this.pool.query(sql);
    } catch (err) {
      console.error('DB run error:', err);
      throw err;
    }
  }

  async exec(sql) {
    try {
      await this.pool.query(sql);
    } catch (err) {
      console.error('DB exec error:', err);
      throw err;
    }
  }

  async close() {
    await this.pool.end();
  }
}

async function initDb() {
  if (!_dbWrapper) {
    _dbWrapper = new DatabaseWrapper(pool);
    // Test connection
    try {
      await pool.query('SELECT 1');
      console.log('✅ Connected to Neon PostgreSQL');
    } catch (err) {
      console.error('❌ Failed to connect to Neon PostgreSQL:', err.message);
      throw err;
    }
  }
  return _dbWrapper;
}

function getDb() {
  if (!_dbWrapper) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _dbWrapper;
}

module.exports = { getDb, initDb, pool };
