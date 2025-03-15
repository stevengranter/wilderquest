-- migrate:up
create table users (
	id integer,
	username varchar(255),
    created timestamp

)

-- migrate:down

