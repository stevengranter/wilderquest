-- migrate:up
ALTER TABLE collections
    ADD COLUMN is_private BOOLEAN DEFAULT false NOT NULL;

-- migrate:down
ALTER TABLE collections
    DROP COLUMN is_private
