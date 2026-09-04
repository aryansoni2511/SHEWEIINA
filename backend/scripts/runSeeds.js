import path from 'path';
import fs from 'fs';
import fileUrl from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

export async function runSeeds() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.includes('localhost:5432/shewwina')) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: DATABASE_URL is missing or unconfigured in production mode.');
    }
    console.log('[SEEDS] NOT EXECUTED — no live DATABASE_URL configured');
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
    console.error(`[SEEDS] Database connection error: ${err.message}`);
    throw err;
  }

  try {
    console.log('[SEEDS] Connected to PostgreSQL. Inspecting seed files...');

    const possibleDirs = [
      path.resolve(process.cwd(), 'database', 'seeds'),
      path.resolve(process.cwd(), 'backend', 'seeds'),
    ];

    const seedsDir = possibleDirs.find((d) => fs.existsSync(d));

    if (!seedsDir) {
      console.warn('[SEEDS] No seeds directory found.');
      return { success: true, appliedCount: 0 };
    }

    const files = fs.readdirSync(seedsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      console.log(`[SEEDS] Applying seed file: ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query(sql);
      console.log(`[SEEDS] Successfully applied seed: ${file}`);
      appliedCount++;
    }

    console.log(`[SEEDS] Total seed files executed: ${appliedCount}`);
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
  runSeeds()
    .then((res) => {
      if (res?.skipped) {
        process.exit(0);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEEDS] Seed execution error:', err.message);
      process.exit(1);
    });
}

export default runSeeds;
