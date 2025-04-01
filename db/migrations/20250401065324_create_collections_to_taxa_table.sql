-- migrate:up
CREATE TABLE
    collections_to_taxa (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    collection_id VARCHAR(32),
                    taxon_id VARCHAR(32)
);

-- migrate:down

