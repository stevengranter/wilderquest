-- migrate:up
ALTER TABLE users
    ALTER role_id SET DEFAULT 1;

-- migrate:down

