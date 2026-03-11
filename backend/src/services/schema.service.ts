import { Pool } from 'pg';

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
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          whatsapp_number TEXT UNIQUE,
          username TEXT UNIQUE,
          full_name TEXT NOT NULL DEFAULT 'Sovereign User',
          email TEXT,
          country TEXT,
          is_registered BOOLEAN DEFAULT FALSE,
          words_consumed INTEGER DEFAULT 0,
          docs_consumed INTEGER DEFAULT 0,
          date_of_birth DATE,
          gender TEXT CHECK (gender IN ('male', 'female', 'other')),
          base_health_conditions TEXT[],
          welcome_sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure columns exist if table was created earlier
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number TEXT UNIQUE;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS words_consumed INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS docs_consumed INTEGER DEFAULT 0;`);
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT FALSE;`);
      await client.query(`ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`);

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

      // 4. Chat Sessions (ChatGPT-like History)
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(id),
          title TEXT DEFAULT 'New Protocol Discussion',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 5. Chat Messages (Contextual Memory)
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
          role TEXT CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          metadata JSONB,
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
