-- migrate:up
ALTER TABLE collections
    ADD COLUMN description VARCHAR(128),
    ADD COLUMN emoji VARCHAR(16),
    CONVERT TO CHARACTER SET utf8mb4;

-- migrate:down
ALTER TABLE collections
    DROP COLUMN description,
    DROP COLUMN emoji,
    CONVERT TO CHARACTER SET utf8;
