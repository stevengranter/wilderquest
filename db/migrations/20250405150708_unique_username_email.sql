-- migrate:up
ALTER TABLE user_data
    ADD UNIQUE (username),
    ADD UNIQUE (email);
-- migrate:down

