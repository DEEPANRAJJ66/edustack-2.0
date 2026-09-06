import pg from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to PostgreSQL...');
  await client.connect();
  console.log('Connected successfully!');

  // 1. Grant schema usage and permissions
  console.log('Granting schema usage to anon and authenticated roles...');
  await client.query(`
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  `);
  console.log('Privileges granted successfully.');

  // 2. Drop FK constraint on profiles.id referencing auth.users so demo/guest UUIDs are valid
  console.log('Dropping foreign key constraint to auth.users if exists...');
  await client.query(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY'
      ) LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(r.constraint_name);
      END LOOP;
    END $$;
  `);
  console.log('Profiles table can now accept student UUIDs.');

  // 3. Upsert default student profile in profiles table
  console.log('Upserting default demo student profiles in profiles table...');
  await client.query(`
    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES 
      (
        '00000000-0000-0000-0000-000000000001',
        'arjun.sharma@edustack.app',
        'Arjun Sharma (Student A)',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      ),
      (
        '00000000-0000-0000-0000-000000000002',
        'priya.patel@edustack.app',
        'Priya Patel (Student B)',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
      )
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name, 
      email = EXCLUDED.email, 
      avatar_url = EXCLUDED.avatar_url;
  `);
  console.log('Demo profiles active in Supabase profiles.');

  // 4. Update RLS policies to allow anon and authenticated users
  console.log('Configuring Row-Level Security policies for public anon & auth access...');
  await client.query(`
    DROP POLICY IF EXISTS "Users can read own attempts" ON attempts;
    DROP POLICY IF EXISTS "Users can insert own attempts" ON attempts;
    DROP POLICY IF EXISTS "Users can update own attempts" ON attempts;
    DROP POLICY IF EXISTS "Allow public attempts access" ON attempts;
    CREATE POLICY "Allow public attempts access" ON attempts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can read own responses" ON responses;
    DROP POLICY IF EXISTS "Users can insert own responses" ON responses;
    DROP POLICY IF EXISTS "Users can update own responses" ON responses;
    DROP POLICY IF EXISTS "Allow public responses access" ON responses;
    CREATE POLICY "Allow public responses access" ON responses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can read own error_notes" ON error_notes;
    DROP POLICY IF EXISTS "Users can insert own error_notes" ON error_notes;
    DROP POLICY IF EXISTS "Users can update own error_notes" ON error_notes;
    DROP POLICY IF EXISTS "Users can delete own error_notes" ON error_notes;
    DROP POLICY IF EXISTS "Allow public error_notes access" ON error_notes;
    CREATE POLICY "Allow public error_notes access" ON error_notes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Allow public profiles access" ON profiles;
    CREATE POLICY "Allow public profiles access" ON profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Tests are readable by everyone" ON tests;
    DROP POLICY IF EXISTS "Allow public tests read" ON tests;
    CREATE POLICY "Allow public tests read" ON tests FOR SELECT USING (true);
  `);
  console.log('RLS policies successfully updated.');

  // 5. Recreate create_next_attempt function without aggregate FOR UPDATE error
  console.log('Recreating create_next_attempt PostgreSQL function...');
  await client.query(`
    CREATE OR REPLACE FUNCTION create_next_attempt(
        p_student_id UUID,
        p_test_id TEXT,
        p_duration_minutes INT DEFAULT 180,
        p_is_error_correct_test BOOLEAN DEFAULT FALSE,
        p_parent_attempt_id UUID DEFAULT NULL
    )
    RETURNS TABLE (
        attempt_id UUID,
        attempt_number INT,
        started_at TIMESTAMPTZ
    ) AS $$
    DECLARE
        v_next_num INT;
        v_attempt_id UUID;
        v_started_at TIMESTAMPTZ := NOW();
    BEGIN
        -- Lock existing rows for this student + test to serialize concurrent attempts safely
        PERFORM 1 FROM attempts 
        WHERE student_id = p_student_id AND test_id = p_test_id 
        FOR UPDATE;

        SELECT COALESCE(MAX(a.attempt_number), 0) + 1
        INTO v_next_num
        FROM attempts a
        WHERE a.student_id = p_student_id AND a.test_id = p_test_id;

        INSERT INTO attempts (
            student_id,
            test_id,
            attempt_number,
            status,
            started_at,
            duration_minutes,
            is_error_correct_test,
            parent_attempt_id
        )
        VALUES (
            p_student_id,
            p_test_id,
            v_next_num,
            'IN_PROGRESS',
            v_started_at,
            p_duration_minutes,
            p_is_error_correct_test,
            p_parent_attempt_id
        )
        RETURNING id INTO v_attempt_id;

        RETURN QUERY SELECT v_attempt_id, v_next_num, v_started_at;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    GRANT EXECUTE ON FUNCTION create_next_attempt(UUID, TEXT, INT, BOOLEAN, UUID) TO anon, authenticated, service_role;
  `);
  console.log('create_next_attempt function fixed and granted.');

  await client.end();
  console.log('Grant and RLS configuration completed successfully!');
}

run().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
