-- CreateTable
CREATE TABLE `admins` (
    `_id` CHAR(24) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL DEFAULT 'Admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    INDEX `admins_role_idx`(`role`),
    INDEX `admins_is_active_idx`(`isActive`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `_id` CHAR(24) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `admin` CHAR(24) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_admin_idx`(`admin`),
    INDEX `refresh_tokens_expires_at_idx`(`expiresAt`),
    INDEX `refresh_tokens_is_revoked_idx`(`isRevoked`),
    INDEX `refresh_tokens_admin_active_expiry_idx`(`admin`, `isRevoked`, `expiresAt`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `_id` CHAR(24) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `mainImage` VARCHAR(1024) NOT NULL DEFAULT '',
    `video` VARCHAR(1024) NOT NULL DEFAULT '',
    `profileName` VARCHAR(191) NOT NULL DEFAULT 'Radio Yeraz',
    `eventDate` DATETIME(3) NULL,
    `eventTime` VARCHAR(50) NULL,
    `location` VARCHAR(255) NULL,
    `isLive` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('draft', 'published', 'expired') NOT NULL DEFAULT 'draft',
    `postedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `author` CHAR(24) NULL,
    `link` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `reminderSentAt` DATETIME(3) NULL,

    INDEX `posts_author_idx`(`author`),
    INDEX `posts_posted_date_idx`(`postedDate`),
    INDEX `posts_event_date_idx`(`eventDate`),
    INDEX `posts_status_idx`(`status`),
    INDEX `posts_is_live_idx`(`isLive`),
    INDEX `posts_is_published_idx`(`isPublished`),
    INDEX `posts_public_listing_idx`(`isPublished`, `status`, `postedDate`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ads` (
    `_id` CHAR(24) NOT NULL,
    `image` VARCHAR(1024) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('pending', 'active', 'inactive', 'expired') NOT NULL DEFAULT 'pending',
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `author` CHAR(24) NULL,
    `targetUrl` VARCHAR(2048) NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ads_author_idx`(`author`),
    INDEX `ads_is_active_idx`(`isActive`),
    INDEX `ads_name_idx`(`name`),
    INDEX `ads_status_idx`(`status`),
    INDEX `ads_start_date_idx`(`startDate`),
    INDEX `ads_end_date_idx`(`endDate`),
    INDEX `ads_public_listing_idx`(`isActive`, `status`, `startDate`, `endDate`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `streamlinks` (
    `_id` CHAR(24) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `streamlinks_is_active_idx`(`isActive`),
    INDEX `streamlinks_created_at_idx`(`createdAt`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `_id` CHAR(24) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('NEW_POST', 'NEW_DRAFT', 'POST_UPDATED', 'POST_DELETED', 'POST_PUBLISHED', 'AD_CREATED', 'AD_UPDATED', 'AD_DELETED', 'AD_TOGGLED', 'AD_EXPIRING', 'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DELETED', 'ADMIN_TOGGLED') NOT NULL,
    `data` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `postId` CHAR(24) NULL,
    `authorName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_is_read_idx`(`isRead`),
    INDEX `notifications_created_at_idx`(`createdAt`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_post_id_idx`(`postId`),
    INDEX `notifications_type_created_at_idx`(`type`, `createdAt`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_admin_fkey` FOREIGN KEY (`admin`) REFERENCES `admins`(`_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_fkey` FOREIGN KEY (`author`) REFERENCES `admins`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ads` ADD CONSTRAINT `ads_author_fkey` FOREIGN KEY (`author`) REFERENCES `admins`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;
