import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { runMigrations } from '../scripts/runMigrations.js';

describe('Phase 1 Migration System Test Suite', () => {
  it('Migration directory database/migrations exists and contains SQL files', () => {
    const migrationsDir = path.resolve(process.cwd(), 'database', 'migrations');
    assert.equal(fs.existsSync(migrationsDir), true, 'database/migrations directory must exist');

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    assert.ok(files.length >= 6, `Expected at least 6 migration files, found ${files.length}`);
    assert.ok(files.includes('001_initial_queue_schema.sql'));
    assert.ok(files.includes('002_authentication_schema.sql'));
    assert.ok(files.includes('003_customer_tokens_user_id.sql'));
    assert.ok(files.includes('004_queue_config_columns.sql'));
    assert.ok(files.includes('005_notifications_table.sql'));
    assert.ok(files.includes('006_notification_settings.sql'));
  });

  it('Migration directory backend/migrations exists and contains SQL files', () => {
    const migrationsDir = path.resolve(process.cwd(), 'backend', 'migrations');
    assert.equal(fs.existsSync(migrationsDir), true, 'backend/migrations directory must exist');

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    assert.ok(files.length >= 6, `Expected at least 6 migration files, found ${files.length}`);
    assert.ok(files.includes('001_initial_queue_schema.sql'));
    assert.ok(files.includes('002_authentication_schema.sql'));
    assert.ok(files.includes('003_customer_tokens_user_id.sql'));
    assert.ok(files.includes('004_queue_config_columns.sql'));
    assert.ok(files.includes('005_notifications_table.sql'));
    assert.ok(files.includes('006_notification_settings.sql'));
  });

  it('runMigrations skips gracefully when DATABASE_URL is not set (in dev mode)', async () => {
    const origEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const result = await runMigrations();
      assert.equal(result.success, true);
      assert.equal(result.skipped, true);
      assert.equal(result.appliedCount, 0);
    } finally {
      process.env.DATABASE_URL = origEnv;
    }
  });

  it('runMigrations throws error in production mode when DATABASE_URL is missing', async () => {
    const origUrl = process.env.DATABASE_URL;
    const origEnv = process.env.NODE_ENV;

    delete process.env.DATABASE_URL;
    process.env.NODE_ENV = 'production';

    try {
      await assert.rejects(
        async () => {
          await runMigrations();
        },
        (err) => {
          assert.match(err.message, /DATABASE_URL is missing/);
          return true;
        }
      );
    } finally {
      process.env.DATABASE_URL = origUrl;
      process.env.NODE_ENV = origEnv;
    }
  });
});
