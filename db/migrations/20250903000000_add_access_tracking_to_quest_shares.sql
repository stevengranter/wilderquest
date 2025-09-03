-- migrate:up
ALTER TABLE quest_shares ADD COLUMN first_accessed_at TIMESTAMP NULL;
ALTER TABLE quest_shares ADD COLUMN last_accessed_at TIMESTAMP NULL;

-- Add index for performance on access tracking queries
CREATE INDEX idx_quest_shares_first_accessed ON quest_shares(first_accessed_at);
CREATE INDEX idx_quest_shares_last_accessed ON quest_shares(last_accessed_at);

-- migrate:down
DROP INDEX idx_quest_shares_first_accessed ON quest_shares;
DROP INDEX idx_quest_shares_last_accessed ON quest_shares;
ALTER TABLE quest_shares DROP COLUMN first_accessed_at;
ALTER TABLE quest_shares DROP COLUMN last_accessed_at;