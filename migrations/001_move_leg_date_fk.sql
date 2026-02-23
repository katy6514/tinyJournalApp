-- Migration: move leg/date relationship from legs.date_id to dates.leg_id
-- This allows multiple dates to reference the same leg (e.g. "zero day")

-- 1. Add the new column to dates
ALTER TABLE dates ADD COLUMN leg_id integer REFERENCES legs(id);

-- 2. Migrate existing assignments: read legs.date_id and write to dates.leg_id
UPDATE dates
SET leg_id = legs.id
FROM legs
WHERE legs.date_id = dates.id;

-- 3. Drop the old column from legs
ALTER TABLE legs DROP COLUMN date_id;
