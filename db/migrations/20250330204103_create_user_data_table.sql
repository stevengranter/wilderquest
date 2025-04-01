-- migrate:up
CREATE TABLE
    user_data (
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(60),
       username VARCHAR(24),
       user_cuid VARCHAR(32),
       password VARCHAR(255),
       created_at TIMESTAMP,
       updated_at TIMESTAMP,
       refresh_token VARCHAR(255)
    );
-- migrate:down
drop table user_data;
