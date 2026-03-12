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
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
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
      await client.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);
      await client.query(`ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();`);

      // 2. Lab Reports Metadata
      await client.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
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
          report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
          user_id UUID REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
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
          user_id UUID REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
          title TEXT DEFAULT 'New Protocol Discussion',
          platform TEXT DEFAULT 'dashboard' CHECK (platform IN ('dashboard', 'whatsapp')),
          summary TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure summary and platform columns exist
      await client.query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS summary TEXT;`);
      await client.query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'dashboard';`);

      // 5. Chat Messages (Contextual Memory)
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
          role TEXT CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          platform TEXT DEFAULT 'dashboard' CHECK (platform IN ('dashboard', 'whatsapp')),
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure platform column exists
      await client.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'dashboard' CHECK (platform IN ('dashboard', 'whatsapp'));`);

      // 6. LID Identity Mappings (LID Bridge)
      await client.query(`
        CREATE TABLE IF NOT EXISTS lid_mappings (
          lid TEXT PRIMARY KEY,
          phone TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Ensure constraints for existing tables
      const alterConstraints = async (table: string, fk: string) => {
        try {
          // Drop existing FK if it exists (by finding its name)
          const res = await client.query(`
            SELECT conname FROM pg_constraint 
            WHERE conrelid = '${table}'::regclass 
            AND confrelid = 'profiles'::regclass 
            AND contype = 'f';
          `);
          for (const row of res.rows) {
            await client.query(`ALTER TABLE ${table} DROP CONSTRAINT ${row.conname};`);
          }
          // Add new FK with CASCADE
          await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_${fk}_fkey FOREIGN KEY (${fk}) REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;`);
        } catch (e) {
          console.warn(`[SchemaService] Could not update constraints for ${table}:`, e);
        }
      };

      await alterConstraints('reports', 'user_id');
      await alterConstraints('biomarkers', 'user_id');
      await alterConstraints('chat_sessions', 'user_id');

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
