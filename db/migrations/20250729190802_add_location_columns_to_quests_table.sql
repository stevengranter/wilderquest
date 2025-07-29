-- migrate:up
ALTER TABLE quests
    ADD COLUMN location_name VARCHAR(255),
    ADD COLUMN latitude DECIMAL(10,8),
    ADD COLUMN longitude DECIMAL(11,8),
    ADD COLUMN place_id VARCHAR(255),
    ADD COLUMN date_time_start TIMESTAMP,
    ADD COLUMN date_time_end TIMESTAMP;


-- migrate:down
ALTER TABLE quests
    DROP COLUMN location_name,
    DROP COLUMN latitude,
    DROP COLUMN longitude,
    DROP COLUMN place_id,
    DROP COLUMN date_time_start,
    DROP COLUMN date_time_end;
