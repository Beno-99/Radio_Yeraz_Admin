ALTER TABLE `streamlinks`
  ADD COLUMN `author` CHAR(24) NULL;

CREATE INDEX `streamlinks_author_idx` ON `streamlinks`(`author`);

ALTER TABLE `streamlinks`
  ADD CONSTRAINT `streamlinks_author_fkey`
  FOREIGN KEY (`author`) REFERENCES `admins`(`_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
