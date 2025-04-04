-- migrate:up
ALTER TABLE collections_to_taxa
    ADD CONSTRAINT
        FOREIGN KEY (collection_id) REFERENCES collections(id);

-- migrate:down

