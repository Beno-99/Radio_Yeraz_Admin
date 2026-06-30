ALTER TABLE `posts`
    ADD COLUMN `liveStatus` ENUM('UNKNOWN', 'UPCOMING', 'LIVE', 'WAS_LIVE', 'NOT_LIVE') NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN `liveStatusCheckedAt` DATETIME(3) NULL;

UPDATE `posts`
SET `liveStatus` = CASE
    WHEN `isLive` = TRUE THEN 'LIVE'
    ELSE 'UNKNOWN'
END;

CREATE INDEX `posts_live_status_idx` ON `posts`(`liveStatus`);
