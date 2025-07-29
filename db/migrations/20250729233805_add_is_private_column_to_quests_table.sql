-- migrate:up
ALTER TABLE quests
    ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- migrate:down
ALTER TABLE quests
    DROP COLUMN is_private

