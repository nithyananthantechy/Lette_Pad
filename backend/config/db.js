// config/db.js — PostgreSQL Connection Pool (Neon Cloud & Local Support)
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'letterpad_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max:      20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  // Gracefully handle remote Neon socket drop on idle
  if (err.message && (err.message.includes('Connection terminated') || err.message.includes('timeout'))) {
    console.warn('⚠️ Idle PostgreSQL connection closed by server (will auto-reconnect on next query)');
  } else {
    console.error('❌ PostgreSQL pool error:', err.message);
  }
});

// Robust query executor with auto-retry on stale connection drops
const query = async (text, params, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const isStaleConn =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('timeout') ||
        err.message?.includes('ECONNRESET') ||
        err.code === '57P01';

      if (isStaleConn && attempt <= retries) {
        console.warn(`⚠️ Database query retry ${attempt}/${retries} after stale connection drop...`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
};

module.exports = {
  query,
  pool,
};
