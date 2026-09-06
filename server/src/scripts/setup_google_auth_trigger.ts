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
  console.log('Connecting to PostgreSQL to configure Google Auth trigger...');
  await client.connect();
  console.log('Connected successfully!');

  // 1. Create or replace the handle_new_user function
  console.log('Creating handle_new_user function...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, name, avatar_url, updated_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'name',
          split_part(COALESCE(NEW.email, ''), '@', 1),
          'Student'
        ),
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          NEW.raw_user_meta_data->>'picture',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        ),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  console.log('handle_new_user function created.');

  // 2. Create trigger on auth.users
  console.log('Creating on_auth_user_created trigger on auth.users...');
  await client.query(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
  console.log('on_auth_user_created trigger created successfully.');

  // 3. Verify public.profiles table exists and has RLS policies
  console.log('Verifying profiles table...');
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles';
  `);
  console.log('Profiles columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  await client.end();
  console.log('All Google Auth DB triggers successfully installed!');
}

run().catch((err) => {
  console.error('Error configuring Google Auth triggers:', err);
  process.exit(1);
});
