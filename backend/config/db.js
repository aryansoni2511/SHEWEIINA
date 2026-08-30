import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Pool Configuration
let pool = null;

const dbUrl = process.env.DATABASE_URL;

if (dbUrl && !dbUrl.includes('localhost:5432/shewwina')) {
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  } catch (err) {
    console.warn('PostgreSQL Pool Initialization Warning:', err.message);
  }
}

/**
 * Executes a PostgreSQL database query using connection pool,
 * or returns null if DB connection is unconfigured.
 */
export async function query(text, params = []) {
  if (pool) {
    return pool.query(text, params);
  }
  return null;
}

/**
 * Checks PostgreSQL database connection health & reports status
 */
export async function checkDatabaseConnection() {
  if (pool) {
    try {
      const res = await pool.query('SELECT NOW() as now, current_database() as db_name;');
      return {
        connected: true,
        type: 'PostgreSQL / Supabase',
        database: res.rows[0]?.db_name,
        timestamp: res.rows[0]?.now,
        message: 'Active PostgreSQL pool connected successfully.',
      };
    } catch (err) {
      return {
        connected: false,
        type: 'PostgreSQL / Supabase',
        error: err.message,
        message: 'Failed to execute health check query on configured database.',
      };
    }
  }

  return {
    connected: false,
    type: 'PostgreSQL / Supabase Schema Ready',
    message: 'Database schema defined. Set DATABASE_URL in .env to connect to live PostgreSQL/Supabase instance.',
    tables: ['businesses', 'services', 'queues', 'tokens'],
  };
}

export default {
  query,
  checkDatabaseConnection,
};
