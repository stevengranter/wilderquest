-- migrate:up
ALTER TABLE user_data ALTER role_id SET DEFAULT 1;

-- migrate:down

