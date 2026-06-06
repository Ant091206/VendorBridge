USE `vendorbridge`;

ALTER TABLE `vendor_categories`
  ADD COLUMN `description` TEXT NULL AFTER `name`,
  ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `description`;

ALTER TABLE `vendors`
  ADD COLUMN `vendor_code` VARCHAR(50) NULL UNIQUE AFTER `id`,
  ADD COLUMN `vendor_name` VARCHAR(255) NULL AFTER `vendor_code`,
  ADD COLUMN `company_name` VARCHAR(255) NULL AFTER `vendor_name`,
  ADD COLUMN `pan_number` VARCHAR(20) NULL AFTER `gst_number`,
  ADD COLUMN `contact_person` VARCHAR(255) NULL AFTER `pan_number`,
  ADD COLUMN `alternate_phone` VARCHAR(20) NULL AFTER `phone`,
  ADD COLUMN `address_line1` VARCHAR(255) NULL AFTER `alternate_phone`,
  ADD COLUMN `address_line2` VARCHAR(255) NULL AFTER `address_line1`,
  ADD COLUMN `city` VARCHAR(120) NULL AFTER `address_line2`,
  ADD COLUMN `state` VARCHAR(120) NULL AFTER `city`,
  ADD COLUMN `country` VARCHAR(120) NULL DEFAULT 'India' AFTER `state`,
  ADD COLUMN `postal_code` VARCHAR(20) NULL AFTER `country`,
  ADD COLUMN `created_by` INT NULL AFTER `category_id`,
  ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
  ADD UNIQUE KEY `vendors_vendor_code_unique` (`vendor_code`),
  ADD INDEX `vendors_status_idx` (`status`),
  ADD INDEX `vendors_category_idx` (`category_id`),
  ADD INDEX `vendors_city_idx` (`city`),
  ADD CONSTRAINT `vendors_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE `vendors`
SET
  `vendor_code` = COALESCE(`vendor_code`, CONCAT('VND-', LPAD(`id`, 5, '0'))),
  `vendor_name` = COALESCE(`vendor_name`, `name`),
  `company_name` = COALESCE(`company_name`, `name`),
  `contact_person` = COALESCE(`contact_person`, `name`),
  `address_line1` = COALESCE(`address_line1`, `address`);

ALTER TABLE `rfqs`
  ADD COLUMN `rfq_number` VARCHAR(50) NULL UNIQUE AFTER `id`,
  ADD COLUMN `product_name` VARCHAR(255) NULL AFTER `description`,
  ADD COLUMN `product_details` TEXT NULL AFTER `product_name`,
  ADD COLUMN `estimated_budget` DECIMAL(12,2) NULL DEFAULT 0 AFTER `quantity`,
  MODIFY COLUMN `status` ENUM('draft', 'open', 'closed', 'cancelled') NOT NULL DEFAULT 'draft',
  ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
  ADD UNIQUE KEY `rfqs_rfq_number_unique` (`rfq_number`),
  ADD INDEX `rfqs_status_idx` (`status`),
  ADD INDEX `rfqs_deadline_idx` (`deadline`);

UPDATE `rfqs`
SET
  `rfq_number` = COALESCE(`rfq_number`, CONCAT('RFQ-', DATE_FORMAT(`created_at`, '%Y'), '-', LPAD(`id`, 5, '0'))),
  `product_name` = COALESCE(`product_name`, `title`),
  `product_details` = COALESCE(`product_details`, `description`),
  `estimated_budget` = COALESCE(`estimated_budget`, 0);

ALTER TABLE `rfq_vendors`
  ADD COLUMN `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `vendor_id`;
