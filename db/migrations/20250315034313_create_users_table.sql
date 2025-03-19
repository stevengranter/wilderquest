-- migrate:up
create table users (
           email varchar(60),
           password varchar(255),
           created timestamp,
           updated timestamp
);
-- migrate:down
drop table users;
