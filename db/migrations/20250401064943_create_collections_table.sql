-- migrate:up
CREATE TABLE
    collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT(16),
        name VARCHAR(32),
        created_at TIMESTAMP,
        updated_at TIMESTAMP
);
-- migrate:down
drop table collections;

