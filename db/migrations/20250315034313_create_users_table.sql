-- migrate:up
create table if not exists users (
           username varchar(20),
           email varchar(60),
           password varchar(255),
           created timestamp,
           updated timestamp
);
-- migrate:down
drop table users;
