-- AlterTable
ALTER TABLE `admins` ADD COLUMN `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `admins_email_key` ON `admins`(`email`);
