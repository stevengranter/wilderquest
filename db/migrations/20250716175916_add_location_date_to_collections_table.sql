-- migrate:up
ALTER TABLE collections
    ADD COLUMN location_name VARCHAR(255),
    ADD COLUMN place_id VARCHAR(255),
    ADD COLUMN date_time_start TIMESTAMP,
    ADD COLUMN date_time_end TIMESTAMP;


-- migrate:down
ALTER TABLE collections
    DROP COLUMN location_name,
    DROP COLUMN place_id,
    DROP COLUMN date_time_start,
    DROP COLUMN date_time_end;


