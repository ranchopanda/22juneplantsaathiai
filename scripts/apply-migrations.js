import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials from client.ts
const SUPABASE_URL = "https://cyjjohiyjitexuicdipo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ampvaGl5aml0ZXh1aWNkaXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTQ0ODksImV4cCI6MjA1OTM3MDQ4OX0.ZqvH3JsvoIsGyZHcUW88jSP7LgseAGnmHQ8xKRrFAfc";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createStorageBucket() {
  try {
    console.log('Creating storage bucket: uploads');
    
    // Create bucket (this requires admin privileges)
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    });
    
    if (bucketError) {
      console.error('Error creating bucket:', bucketError);
      return;
    }
    
    console.log('Storage bucket created successfully:', bucketData);
  } catch (error) {
    console.error('Error in createStorageBucket:', error);
  }
}

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250418233000_create_farm_data_snapshots.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL (this requires admin privileges)
    const { data, error } = await supabase.rpc('pg_exec', {
      command: migrationSQL
    });
    
    if (error) {
      console.error('Error running migrations:', error);
      console.log('Note: You need ADMIN API KEY to run migrations directly. Consider using Supabase dashboard instead.');
      return;
    }
    
    console.log('Migrations applied successfully:', data);
  } catch (error) {
    console.error('Error in runMigrations:', error);
  }
}

async function runSeed() {
  try {
    console.log('Running seed data...');
    
    // Read seed SQL file
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Execute the SQL (this requires admin privileges)
    const { data, error } = await supabase.rpc('pg_exec', {
      command: seedSQL
    });
    
    if (error) {
      console.error('Error running seed:', error);
      console.log('Note: You need ADMIN API KEY to run seed directly. Consider using Supabase dashboard instead.');
      return;
    }
    
    console.log('Seed data applied successfully:', data);
  } catch (error) {
    console.error('Error in runSeed:', error);
  }
}

async function main() {
  console.log('Starting migration and bucket creation...');
  await createStorageBucket();
  await runMigrations();
  await runSeed();
  console.log('Migration and setup complete!');
  console.log('If you see errors, please run migrations and create bucket manually through Supabase Dashboard.');
}

main(); 