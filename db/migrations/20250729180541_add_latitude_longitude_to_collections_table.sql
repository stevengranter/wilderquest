-- migrate:up
ALTER TABLE collections
    ADD COLUMN latitude DECIMAL(10,8),
    ADD COLUMN longitude DECIMAL(11,8);

-- migrate:down
ALTER TABLE collections
    DROP COLUMN latitude,
    DROP COLUMN longitude;
