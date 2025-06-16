-- migrate:up
CREATE TABLE
    users
(
       id INT AUTO_INCREMENT PRIMARY KEY,
       email VARCHAR(60),
       username VARCHAR(24),
       password VARCHAR(255),
       created_at TIMESTAMP,
       updated_at TIMESTAMP,
       user_cuid VARCHAR(32),
       refresh_token VARCHAR(255)
    );
-- migrate:down
drop table users;
