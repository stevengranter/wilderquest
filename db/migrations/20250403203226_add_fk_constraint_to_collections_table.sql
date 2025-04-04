-- migrate:up
ALTER TABLE collections
    ADD CONSTRAINT
        FOREIGN KEY (user_id) REFERENCES user_data(id);

-- migrate:down

