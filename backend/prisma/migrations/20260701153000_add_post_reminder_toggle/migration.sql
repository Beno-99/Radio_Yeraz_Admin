ALTER TABLE `posts`
    ADD COLUMN `reminderEnabled` BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX `posts_reminder_enabled_idx` ON `posts`(`reminderEnabled`);
