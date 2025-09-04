-- migrate:up
ALTER TABLE quest_shares ADD COLUMN shared_with_user_id INT NULL;

-- Add foreign key constraint to users table
ALTER TABLE quest_shares ADD CONSTRAINT fk_shared_with_user
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for performance on user-based queries
CREATE INDEX idx_quest_shares_shared_with_user ON quest_shares(shared_with_user_id);

-- migrate:down
DROP INDEX idx_quest_shares_shared_with_user ON quest_shares;
ALTER TABLE quest_shares DROP FOREIGN KEY fk_shared_with_user;
ALTER TABLE quest_shares DROP COLUMN shared_with_user_id;