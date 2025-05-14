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
