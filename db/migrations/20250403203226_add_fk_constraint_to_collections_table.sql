-- migrate:up
ALTER TABLE collections
    ADD CONSTRAINT
        FOREIGN KEY (user_id) REFERENCES users (id);

-- migrate:down

