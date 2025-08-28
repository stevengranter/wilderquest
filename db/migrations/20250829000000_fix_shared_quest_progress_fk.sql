-- migrate:up
-- Ensure the foreign key constraint in shared_quest_progress table is correct
-- The taxon_id should reference quests_to_taxa.id (mapping ID)

-- Check if the foreign key constraint exists and drop it if it does
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'shared_quest_progress'
      AND CONSTRAINT_NAME = 'fk_taxon'
);

SET @sql = IF(@constraint_exists > 0,
    'ALTER TABLE shared_quest_progress DROP FOREIGN KEY fk_taxon;',
    'SELECT "Foreign key constraint fk_taxon does not exist, skipping drop" as message;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add the correct foreign key constraint
ALTER TABLE shared_quest_progress
ADD CONSTRAINT fk_taxon
FOREIGN KEY (taxon_id) REFERENCES quests_to_taxa(id) ON DELETE CASCADE;

-- migrate:down
-- Remove the foreign key constraint
ALTER TABLE shared_quest_progress DROP FOREIGN KEY fk_taxon;