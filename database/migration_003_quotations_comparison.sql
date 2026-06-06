USE `vendorbridge`;

-- ── 1. Create quotation_comparisons table ──
CREATE TABLE IF NOT EXISTS `quotation_comparisons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `selected_quotation_id` INT NOT NULL,
  `selected_by` INT NOT NULL,
  `selection_reason` TEXT NOT NULL,
  `selected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`selected_quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Add missing columns to quotations table ──
ALTER TABLE `quotations`
  ADD COLUMN `quotation_number` VARCHAR(50) NULL UNIQUE AFTER `id`,
  ADD COLUMN `quantity` INT NOT NULL DEFAULT 1 AFTER `vendor_id`,
  ADD COLUMN `attachment_url` VARCHAR(255) NULL AFTER `notes`,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `submitted_at`;

-- ── 3. Populate existing quotations with quantity from RFQ if missing ──
UPDATE `quotations` q
JOIN `rfqs` r ON q.rfq_id = r.id
SET q.quantity = r.quantity, q.updated_at = CURRENT_TIMESTAMP
WHERE q.quantity = 1 OR q.quantity IS NULL;

-- ── 4. Generate unique quotation numbers for existing quotations ──
UPDATE `quotations`
SET `quotation_number` = CONCAT('QTN-', DATE_FORMAT(COALESCE(`submitted_at`, NOW()), '%Y'), '-', LPAD(`id`, 5, '0'))
WHERE `quotation_number` IS NULL;
