-- migrate:up
CREATE TABLE
quests_to_taxa(
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  quest_id INT(16),
                  taxon_id INT(16)
);

-- migrate:down
DROP TABLE quests_to_taxa

