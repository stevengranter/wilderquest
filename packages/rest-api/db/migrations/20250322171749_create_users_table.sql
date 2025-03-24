-- migrate:up
create table user_data (
       email varchar(60),
       username varchar(20),
       password varchar(255),
       createdAt timestamp,
       updatedAt timestamp
);
-- migrate:down
drop table user_data;
