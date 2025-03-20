-- migrate:up
create table users (
           email varchar(60),
           username varchar(20),
           password varchar(255),
           createdAt timestamp,
           updatedAt timestamp
);
-- migrate:down
drop table users;
