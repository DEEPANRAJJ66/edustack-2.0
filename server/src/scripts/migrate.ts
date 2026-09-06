import pg from 'pg';
import fs from 'fs';
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
  console.log('Connecting to Supabase PostgreSQL at:', DATABASE_URL.replace(/:[^:]+@/, ':***@'));
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  const sqlPath = path.resolve(__dirname, '../../../supabase/migrations/01_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Applying 01_initial_schema.sql to Supabase database...');
  await client.query(sql);
  console.log('Schema migration applied successfully!');

  // Verify create_next_attempt function
  const res = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'create_next_attempt';
  `);
  console.log('Function check:', res.rows);

  // Check tables
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'tests', 'attempts', 'responses', 'error_notes');
  `);
  console.log('Tables created:', tables.rows.map(r => r.table_name));

  // Insert default tests metadata if not existing
  await client.query(`
    INSERT INTO tests (id, title, description, category, duration_minutes, total_questions, total_marks)
    VALUES 
      ('jee-main-mock-01', 'JEE Main 2026 — Official Mock 01', 'Full Syllabus NTA Pattern Mock Test (15 Questions)', 'JEE Main Full Mock Tests', 180, 15, 60),
      ('jee-main-mock-02', 'JEE Main 2026 — Official Mock 02', 'High-Yield Revision Mock Test (15 Questions)', 'JEE Main Full Mock Tests', 180, 15, 60)
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('Default tests verified in database!');

  // Grant execution permissions on create_next_attempt to anon and authenticated roles
  await client.query(`
    GRANT EXECUTE ON FUNCTION create_next_attempt(UUID, TEXT, INT, BOOLEAN, UUID) TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  `);
  console.log('Granted permissions to anon, authenticated, service_role!');

  await client.end();
  console.log('Migration completed perfectly.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
