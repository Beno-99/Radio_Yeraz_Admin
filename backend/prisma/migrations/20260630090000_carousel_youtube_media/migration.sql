-- Replace the old Ads feature table with Carousel.
-- Existing Ads data is intentionally discarded; unrelated tables are preserved.
DROP TABLE IF EXISTS `ads`;

CREATE TABLE `Carousel` (
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
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `carousels_author_idx`(`author`),
    INDEX `carousels_is_active_idx`(`isActive`),
    INDEX `carousels_name_idx`(`name`),
    INDEX `carousels_status_idx`(`status`),
    INDEX `carousels_display_order_idx`(`displayOrder`),
    INDEX `carousels_start_date_idx`(`startDate`),
    INDEX `carousels_end_date_idx`(`endDate`),
    INDEX `carousels_public_listing_idx`(`isActive`, `status`, `startDate`, `endDate`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Carousel` ADD CONSTRAINT `Carousel_author_fkey` FOREIGN KEY (`author`) REFERENCES `admins`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add YouTube media support while preserving legacy uploaded-video paths.
ALTER TABLE `posts`
    MODIFY `video` VARCHAR(1024) NULL,
    ADD COLUMN `videoSource` ENUM('UPLOAD', 'YOUTUBE') NULL,
    ADD COLUMN `youtubeUrl` VARCHAR(2048) NULL,
    ADD COLUMN `youtubeVideoId` VARCHAR(32) NULL;

UPDATE `posts`
SET `video` = NULL
WHERE `video` = '';

UPDATE `posts`
SET `videoSource` = 'UPLOAD'
WHERE `video` IS NOT NULL AND `video` <> '';

CREATE INDEX `posts_video_source_idx` ON `posts`(`videoSource`);
CREATE INDEX `posts_youtube_video_id_idx` ON `posts`(`youtubeVideoId`);

-- Rename persisted notification enum values from Ads to Carousel without dropping unrelated notifications.
ALTER TABLE `notifications`
    MODIFY `type` ENUM(
        'NEW_POST',
        'NEW_DRAFT',
        'POST_UPDATED',
        'POST_DELETED',
        'POST_PUBLISHED',
        'AD_CREATED',
        'AD_UPDATED',
        'AD_DELETED',
        'AD_TOGGLED',
        'AD_EXPIRING',
        'CAROUSEL_CREATED',
        'CAROUSEL_UPDATED',
        'CAROUSEL_DELETED',
        'CAROUSEL_TOGGLED',
        'CAROUSEL_EXPIRING',
        'ADMIN_CREATED',
        'ADMIN_UPDATED',
        'ADMIN_DELETED',
        'ADMIN_TOGGLED'
    ) NOT NULL;

UPDATE `notifications`
SET `type` = CASE `type`
    WHEN 'AD_CREATED' THEN 'CAROUSEL_CREATED'
    WHEN 'AD_UPDATED' THEN 'CAROUSEL_UPDATED'
    WHEN 'AD_DELETED' THEN 'CAROUSEL_DELETED'
    WHEN 'AD_TOGGLED' THEN 'CAROUSEL_TOGGLED'
    WHEN 'AD_EXPIRING' THEN 'CAROUSEL_EXPIRING'
    ELSE `type`
END
WHERE `type` IN ('AD_CREATED', 'AD_UPDATED', 'AD_DELETED', 'AD_TOGGLED', 'AD_EXPIRING');

ALTER TABLE `notifications`
    MODIFY `type` ENUM(
        'NEW_POST',
        'NEW_DRAFT',
        'POST_UPDATED',
        'POST_DELETED',
        'POST_PUBLISHED',
        'CAROUSEL_CREATED',
        'CAROUSEL_UPDATED',
        'CAROUSEL_DELETED',
        'CAROUSEL_TOGGLED',
        'CAROUSEL_EXPIRING',
        'ADMIN_CREATED',
        'ADMIN_UPDATED',
        'ADMIN_DELETED',
        'ADMIN_TOGGLED'
    ) NOT NULL;
