ALTER TABLE `streamlinks`
  ADD COLUMN `bitrate` INTEGER NULL,
  ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `streamlinks_display_order_idx` ON `streamlinks`(`displayOrder`);
CREATE INDEX `streamlinks_active_order_idx` ON `streamlinks`(`isActive`, `displayOrder`);
