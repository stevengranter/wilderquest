-- migrate:up
ALTER TABLE user_data
    ADD COLUMN refresh_token VARCHAR(255);

-- migrate:down

