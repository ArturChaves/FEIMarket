import { Pool } from 'pg';
import { requireEnv } from '../utils/env';

export const pool = new Pool({
  connectionString: requireEnv('DATABASE_URL'),
});

export async function initPostgres(): Promise<void> {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  `);
}

export async function checkPostgres(): Promise<string> {
  try {
    const client = await pool.connect();
    client.release();
    return 'connected';
  } catch {
    return 'disconnected';
  }
}
