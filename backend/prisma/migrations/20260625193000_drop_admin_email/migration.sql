-- DropIndex
DROP INDEX `admins_email_key` ON `admins`;

-- AlterTable
ALTER TABLE `admins` DROP COLUMN `email`;
