-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Projects & Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default demo collection to attach uploads to immediately
INSERT INTO collections (id, title, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Library', 'Main media library')
ON CONFLICT (id) DO NOTHING;

-- 3. Media Frames & Aesthetic Telemetry
CREATE TABLE IF NOT EXISTS media_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_url TEXT NOT NULL,
    timestamp_sec NUMERIC(8, 2),
    aspect_ratio NUMERIC(4, 2) NOT NULL,
    
    -- Photometric Telemetry
    avg_luminance REAL NOT NULL CHECK (avg_luminance BETWEEN 0.0 AND 1.0),
    shadow_crush_ratio REAL NOT NULL CHECK (shadow_crush_ratio BETWEEN 0.0 AND 1.0),
    
    -- Aesthetic Vector: 3 dominant centroids in Oklab space [L1, a1, b1, L2, a2, b2, L3, a3, b3]
    color_palette vector(9) NOT NULL,
    dominant_clusters JSONB,
    is_sample BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE media_frames ADD COLUMN IF NOT EXISTS dominant_clusters JSONB;
ALTER TABLE media_frames ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;

-- 4. Vector and Scalar Indexes
CREATE INDEX IF NOT EXISTS idx_frames_color_hnsw 
    ON media_frames USING hnsw (color_palette vector_l2_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_frames_mood 
    ON media_frames (avg_luminance, shadow_crush_ratio);

CREATE INDEX IF NOT EXISTS idx_frames_collection 
    ON media_frames (collection_id);
