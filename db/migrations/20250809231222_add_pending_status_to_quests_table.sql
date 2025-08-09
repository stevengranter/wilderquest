-- migrate:up

ALTER TABLE quests
    MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'pending';

ALTER TABLE quests
    ADD CONSTRAINT quests_status_check CHECK (status IN ('pending', 'active', 'paused', 'ended'));

-- migrate:down
ALTER TABLE quests
DROP CHECK quests_status_check;

ALTER TABLE quests
    MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'active';

ALTER TABLE quests
    ADD CONSTRAINT quests_status_check CHECK (status IN ('active', 'paused', 'ended'));
