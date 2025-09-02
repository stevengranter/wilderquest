-- migrate:up
ALTER TABLE quest_shares ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Set is_primary = true for the oldest share per quest created by the quest owner with guest_name IS NULL
-- This identifies the primary share for each quest
SET @sql = '
UPDATE quest_shares qs
INNER JOIN (
    SELECT
        quest_id,
        MIN(created_at) as oldest_created_at
    FROM quest_shares
    WHERE guest_name IS NULL
    GROUP BY quest_id
) oldest_shares ON qs.quest_id = oldest_shares.quest_id
    AND qs.created_at = oldest_shares.oldest_created_at
    AND qs.guest_name IS NULL
SET qs.is_primary = TRUE
WHERE qs.is_primary = FALSE';

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- migrate:down
ALTER TABLE quest_shares DROP COLUMN is_primary;