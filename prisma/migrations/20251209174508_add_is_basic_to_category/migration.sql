-- AlterTable
ALTER TABLE `categories` ADD COLUMN `is_basic` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `courses` ADD COLUMN `is_basic` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `gender` ENUM('MALE', 'FEMALE') NULL;
