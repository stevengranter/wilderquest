-- migrate:up
ALTER TABLE quests
ADD COLUMN status VARCHAR(255) NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'paused', 'ended'));

-- migrate:down
ALTER TABLE quests
DROP COLUMN status;