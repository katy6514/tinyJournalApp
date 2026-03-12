-- Migration 002: Add GPS coordinates and datetime to photos table
-- Backfills lat/lon from existing description text:
--   "Photo taken on 2024:07:01 13:37:11 at 47.91065..., -113.09856..."

-- 1. Add columns (idempotent)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS lat       NUMERIC,
  ADD COLUMN IF NOT EXISTS lon       NUMERIC,
  ADD COLUMN IF NOT EXISTS date_time TEXT;

-- 2. Backfill lat from description
UPDATE photos
SET lat = (REGEXP_MATCH(description, 'at\s+(-?\d+(?:\.\d+)?),'))[1]::NUMERIC
WHERE description LIKE '%at %,%' AND lat IS NULL;

-- 3. Backfill lon from description
UPDATE photos
SET lon = (REGEXP_MATCH(description, 'at\s+-?\d+(?:\.\d+)?,\s*(-?\d+(?:\.\d+)?)'))[1]::NUMERIC
WHERE description LIKE '%at %,%' AND lon IS NULL;

-- 4. Backfill date_time from description
UPDATE photos
SET date_time = (REGEXP_MATCH(description, 'Photo taken on (\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2})'))[1]
WHERE description LIKE 'Photo taken on %' AND date_time IS NULL;
