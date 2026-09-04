import path from 'path';
import fs from 'fs';
import fileUrl from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

export async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.includes('localhost:5432/shewwina')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: DATABASE_URL is missing or unconfigured in production mode.');
    }
    console.log('[MIGRATIONS] NOT EXECUTED — no live DATABASE_URL configured');
    return { success: true, skipped: true, appliedCount: 0 };
  }

  const isRemote = dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: (process.env.NODE_ENV === 'production' || isRemote) ? { rejectUnauthorized: false } : false,
  });

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    console.error(`[MIGRATIONS] Database connection error: ${err.message}`);
    throw err;
  }

  try {
    console.log('[MIGRATIONS] Connected to PostgreSQL. Initializing schema_migrations table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const executedRes = await client.query('SELECT name FROM schema_migrations;');
    const executedMigrations = new Set(executedRes.rows.map((r) => r.name));

    // Support both backend/migrations and database/migrations
    const possibleDirs = [
      path.resolve(process.cwd(), 'backend', 'migrations'),
      path.resolve(process.cwd(), 'database', 'migrations'),
    ];

    let migrationsDir = possibleDirs.find((d) => fs.existsSync(d));

    if (!migrationsDir) {
      console.warn('[MIGRATIONS] No migrations directory found.');
      return { success: true, appliedCount: 0 };
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (executedMigrations.has(file)) {
        console.log(`[MIGRATIONS] Already applied: ${file}`);
        continue;
      }

      console.log(`[MIGRATIONS] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`[MIGRATIONS] Successfully applied: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATIONS] Migration failed on ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log(`[MIGRATIONS] Total new migrations applied: ${appliedCount}`);
    return { success: true, appliedCount };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Execute directly if script is run directly
const currentFile = fileUrl.fileURLToPath(import.meta.url);
const entryFile = path.resolve(process.argv[1] || '');

if (currentFile === entryFile) {
  runMigrations()
    .then((res) => {
      if (res?.skipped) {
        process.exit(0);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATIONS] Migration execution error:', err.message);
      process.exit(1);
    });
}

export default runMigrations;
