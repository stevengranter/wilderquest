-- migrate:up
-- Drop the old inline check constraint that only allows 'active', 'paused', 'ended'
-- This constraint was created in the first status migration and conflicts with the new one
-- that includes 'pending' as a valid status
ALTER TABLE quests DROP CHECK quests_chk_1;

-- migrate:down
-- Re-add the old constraint (this is just for rollback purposes)
-- Note: This will only work if all existing quests have status in ('active', 'paused', 'ended')
ALTER TABLE quests ADD CONSTRAINT quests_chk_1 CHECK (status IN ('active', 'paused', 'ended'));
