import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function nuke() {
  const client = await pool.connect();
  try {
    console.log('[NUKE] Initiating total data wipe...');
    
    // Disable triggers if any
    await client.query('SET session_replication_role = "replica";');

    await client.query('TRUNCATE chat_messages CASCADE;');
    await client.query('TRUNCATE chat_sessions CASCADE;');
    await client.query('TRUNCATE biomarkers CASCADE;');
    await client.query('TRUNCATE reports CASCADE;');
    await client.query('TRUNCATE lid_mappings CASCADE;');
    await client.query('TRUNCATE profiles CASCADE;');

    // NEW: Clear Supabase Auth Users
    console.log('[NUKE] Clearing Supabase Auth Users...');
    await client.query('TRUNCATE auth.users CASCADE;');
    await client.query('TRUNCATE auth.identities CASCADE;');

    await client.query('SET session_replication_role = "origin";');

    console.log('[NUKE] Database cleared successfully. You can now re-register.');
  } catch (e) {
    console.error('[NUKE] Failure:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

nuke();
