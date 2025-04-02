-- migrate:up
CREATE TABLE
    collections_to_taxa (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    collection_id INT(16),
                    taxon_id VARCHAR(32)
);

-- migrate:down

