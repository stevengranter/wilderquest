-- migrate:up
ALTER TABLE quests
ADD COLUMN mode VARCHAR(255) NOT NULL DEFAULT 'cooperative'
CHECK (mode IN ('competitive', 'cooperative'));

-- migrate:down
ALTER TABLE quests
DROP COLUMN mode;