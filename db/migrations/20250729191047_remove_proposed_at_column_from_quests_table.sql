-- migrate:up
ALTER TABLE quests
    DROP COLUMN proposed_at;

-- migrate:down



