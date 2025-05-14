-- Create the uploads storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the uploads bucket
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Public Read Access',
  '(bucket_id = ''uploads''::text)',
  'uploads'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

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