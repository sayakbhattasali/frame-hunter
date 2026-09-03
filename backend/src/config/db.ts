import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dev:devpassword@localhost:5432/frame_hunter',
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    await client.query('ALTER TABLE media_frames ADD COLUMN IF NOT EXISTS dominant_clusters JSONB;');
    await client.query('ALTER TABLE media_frames ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}