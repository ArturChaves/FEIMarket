import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

export async function checkPostgres(): Promise<string> {
  try {
    const client = await pool.connect();
    client.release();
    return 'connected';
  } catch {
    return 'disconnected';
  }
}
