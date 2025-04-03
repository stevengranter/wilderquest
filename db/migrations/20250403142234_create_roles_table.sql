-- migrate:up
CREATE TABLE roles (
       id INT PRIMARY KEY AUTO_INCREMENT,
       role_name VARCHAR(255) UNIQUE NOT NULL
);
INSERT INTO roles (role_name)
VALUES ('user'), ('admin'), ('moderator');

-- migrate:down
drop table roles;

