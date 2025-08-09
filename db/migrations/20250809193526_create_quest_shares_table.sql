-- migrate:up
-- Get quests.id column definition
SET @quest_id_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'quests'
      AND COLUMN_NAME = 'id'
);

-- Get users.id column definition
SET @user_id_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'id'
);

-- Build and execute the CREATE TABLE statement dynamically
SET @sql = CONCAT('
CREATE TABLE quest_shares (
    id ', @quest_id_type, ' NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token CHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    quest_id ', @quest_id_type, ' NOT NULL,
    CONSTRAINT fk_quest FOREIGN KEY (quest_id)
        REFERENCES quests(id) ON DELETE CASCADE,
    created_by_user_id ', @user_id_type, ' NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (created_by_user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    guest_name VARCHAR(255),
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
)');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;



-- migrate:down
DROP TABLE quest_shares

