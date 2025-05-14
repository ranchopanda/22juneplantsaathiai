# Supabase Setup Guide

This guide will help you set up the required database schema and storage buckets for the Anand Krishi app.

## Access Supabase Dashboard

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Sign in and select your project (the one with ID: `cyjjohiyjitexuicdipo`)

## Create Required Storage Bucket

1. In the Supabase dashboard, navigate to **Storage** in the left sidebar
2. Click on **New Bucket**
3. Enter `uploads` as the bucket name
4. Check **Public Bucket** (to allow public access to images)
5. Click **Create Bucket**

## Apply Database Migrations

1. In the Supabase dashboard, navigate to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the following SQL:

```sql
-- Create farm_data_snapshots table
CREATE TABLE IF NOT EXISTS public.farm_data_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    data JSONB,
    -- Flattened fields for easier querying
    image_url TEXT,
    crop TEXT,
    disease TEXT,
    severity TEXT,
    confidence FLOAT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

-- Add RLS policies to secure the table
ALTER TABLE public.farm_data_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can insert and read their own data
CREATE POLICY "Users can insert their own snapshots"
    ON public.farm_data_snapshots
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own snapshots"
    ON public.farm_data_snapshots
    FOR SELECT
    USING (true);

-- Add proper indexes
CREATE INDEX farm_data_snapshots_user_id_idx ON public.farm_data_snapshots (user_id);
CREATE INDEX farm_data_snapshots_type_idx ON public.farm_data_snapshots (type);
CREATE INDEX farm_data_snapshots_crop_idx ON public.farm_data_snapshots (crop);
CREATE INDEX farm_data_snapshots_disease_idx ON public.farm_data_snapshots (disease);
CREATE INDEX farm_data_snapshots_created_at_idx ON public.farm_data_snapshots (created_at);
CREATE INDEX farm_data_snapshots_lat_lng_idx ON public.farm_data_snapshots (lat, lng);
```

4. Click **Run** to execute the migration

## Apply Seed Data (Optional)

1. Create another new query
2. Copy and paste the following SQL:

```sql
-- Sample farm data for testing (optional)
INSERT INTO public.farm_data_snapshots (
  user_id,
  type,
  timestamp,
  data,
  image_url,
  crop,
  disease,
  severity,
  confidence,
  lat,
  lng
) VALUES (
  'demo_user',
  'plant_disease',
  current_timestamp,
  '{
    "structuredData": {
      "type": "plant_disease",
      "crop": "Wheat",
      "disease": "Leaf Rust",
      "severity": "moderate",
      "confidence": 0.92,
      "notes": "Sample data for testing",
      "location": {
        "lat": 28.6139,
        "lng": 77.2090
      }
    }
  }'::jsonb,
  'https://cyjjohiyjitexuicdipo.supabase.co/storage/v1/object/public/uploads/demo_user/2025-05-15/plant_disease/sample_wheat_rust.jpg',
  'Wheat',
  'Leaf Rust',
  'moderate',
  0.92,
  28.6139,
  77.2090
)
ON CONFLICT DO NOTHING;
```

3. Click **Run** to execute the seed data

## Set Bucket Policies

1. In the Supabase dashboard, go to **Storage** in the left sidebar
2. Select the `uploads` bucket you created
3. Go to the **Policies** tab
4. Click **New Policy**
5. Select **Create a policy from scratch**
6. Policy Type: Select **INSERT** to allow uploads
   - Policy Name: `Allow public uploads`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated, anon`
   - Policy definition: `true`
   - Click **Save Policy**
7. Repeat to create a **SELECT** policy for public reading:
   - Policy Name: `Allow public downloads`
   - Allowed operation: `SELECT`
   - Target roles: `authenticated, anon`
   - Policy definition: `true`
   - Click **Save Policy**

## Verify Setup

1. Go back to your application
2. Test the image upload functionality
3. Check that data is being stored in the database

If you encounter any issues, check the browser console for specific error messages. 