-- migrate:up
ALTER TABLE quests
MODIFY COLUMN name VARCHAR(255);

-- migrate:down
-- Truncate any names longer than 32 characters before reducing column size
UPDATE quests SET name = CONCAT(LEFT(name, 29), '...') WHERE LENGTH(name) > 32;

ALTER TABLE quests
MODIFY COLUMN name VARCHAR(32);
