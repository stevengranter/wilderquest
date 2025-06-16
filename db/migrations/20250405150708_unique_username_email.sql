-- migrate:up
ALTER TABLE users
    ADD UNIQUE (username),
    ADD UNIQUE (email);
-- migrate:down

