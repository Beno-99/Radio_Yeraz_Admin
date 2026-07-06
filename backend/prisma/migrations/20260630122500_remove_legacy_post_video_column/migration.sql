-- Remove the legacy uploaded-video column now that posts use YouTube media only.
-- Existing uploaded-video references are discarded deliberately.
UPDATE `posts`
SET `videoSource` = NULL
WHERE `videoSource` = 'UPLOAD';

ALTER TABLE `posts`
    MODIFY `videoSource` ENUM('YOUTUBE') NULL,
    DROP COLUMN `video`;
