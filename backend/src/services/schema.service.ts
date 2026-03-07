import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class SchemaService {
  private static pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  /**
   * Automatically initializes the database schema if tables do not exist.
   * This ensures the multimillion-dollar data remains structured.
   */
  static async initializeSchema() {
    const client = await this.pool.connect();
    try {
      console.log('[SchemaService] Initiating database schema check...');

      // 1. User Profiles
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          full_name TEXT NOT NULL,
          date_of_birth DATE,
          gender TEXT CHECK (gender IN ('male', 'female', 'other')),
          base_health_conditions TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. Lab Reports Metadata
      await client.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(id),
          report_date TIMESTAMPTZ NOT NULL,
          file_url TEXT NOT NULL,
          overall_summary TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. Granular Biomarkers (Longitudinal Data)
      await client.query(`
        CREATE TABLE IF NOT EXISTS biomarkers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_id UUID REFERENCES reports(id),
          user_id UUID REFERENCES profiles(id),
          category TEXT,
          name TEXT NOT NULL,
          value NUMERIC NOT NULL,
          unit TEXT,
          reference_range TEXT,
          is_abnormal BOOLEAN DEFAULT FALSE,
          clinical_insight TEXT,
          recorded_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      console.log('[SchemaService] Database schema verified and initialized.');
    } catch (error) {
      console.error('[SchemaService] Error during schema initialization:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async closePool() {
    await this.pool.end();
  }
}
