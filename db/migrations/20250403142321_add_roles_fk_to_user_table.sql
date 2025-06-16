-- migrate:up
-- Add the role_id column
ALTER TABLE users
    ADD COLUMN role_id INT;

-- Set default role for existing user
UPDATE users
SET role_id = 1  -- default 'user' role
WHERE role_id IS NULL;

-- Add foreign key constraint to the roles table
ALTER TABLE users
    ADD CONSTRAINT fk_role
        FOREIGN KEY (role_id) REFERENCES roles(id);

--  Set role_id as NOT NULL if you require it
ALTER TABLE users
    MODIFY COLUMN role_id INT NOT NULL;

-- migrate:down

