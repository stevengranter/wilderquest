-- migrate:up
-- Detect quest_shares.id type
SET @quest_share_id_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'quest_shares'
      AND COLUMN_NAME = 'id'
);

-- Detect taxa.id type (change "taxa" if your table has a different name)
SET @taxon_id_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'quests_to_taxa'
      AND COLUMN_NAME = 'id'
);

-- Build and execute CREATE TABLE with exact FK types
SET @sql = CONCAT('
CREATE TABLE shared_quest_progress (
    id ', @quest_share_id_type, ' NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Foreign key to the specific share link this progress belongs to.
    quest_share_id ', @quest_share_id_type, ' NOT NULL,
    CONSTRAINT fk_quest_share FOREIGN KEY (quest_share_id)
        REFERENCES quest_shares(id) ON DELETE CASCADE,

    -- The ID of the taxon/species that was observed by the guest.
    taxon_id ', @taxon_id_type, ' NOT NULL,
    CONSTRAINT fk_taxon FOREIGN KEY (taxon_id)
        REFERENCES quests_to_taxa(id) ON DELETE CASCADE,

    -- When the guest marked this species as found.
    observed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Ensure a guest can''t mark the same species twice on the same link.
    UNIQUE (quest_share_id, taxon_id)
)');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- migrate:down


