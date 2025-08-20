-- migrate:up
ALTER TABLE quests
ADD COLUMN starts_at TIMESTAMP,
ADD COLUMN ends_at TIMESTAMP;

-- migrate:down
ALTER TABLE quests
DROP COLUMN starts_at,
DROP COLUMN ends_at;
