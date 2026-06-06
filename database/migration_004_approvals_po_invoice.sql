USE `vendorbridge`;

-- ── 1. Update approvals table ──
ALTER TABLE `approvals`
  ADD COLUMN `rfq_id` INT NULL AFTER `id`,
  ADD COLUMN `requested_by` INT NULL AFTER `quotation_id`,
  ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER `remarks`,
  ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `status`;

ALTER TABLE `approvals`
  ADD CONSTRAINT `fk_approvals_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_approvals_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update approvals status to match decision for consistency
UPDATE `approvals` SET `status` = `decision`;

-- ── 2. Update purchase_orders table ──
ALTER TABLE `purchase_orders`
  ADD COLUMN `rfq_id` INT NULL AFTER `approval_id`,
  ADD COLUMN `vendor_id` INT NULL AFTER `rfq_id`,
  ADD COLUMN `quotation_id` INT NULL AFTER `vendor_id`,
  ADD COLUMN `generated_by` INT NULL AFTER `grand_total`,
  ADD COLUMN `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `status`,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `generated_at`;

ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `fk_pos_rfq` FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pos_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pos_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pos_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Populate existing PO details from approvals and quotations
UPDATE `purchase_orders` po
JOIN `approvals` a ON po.approval_id = a.id
JOIN `quotations` q ON a.quotation_id = q.id
SET po.rfq_id = q.rfq_id,
    po.vendor_id = q.vendor_id,
    po.quotation_id = q.id,
    po.generated_by = a.approver_id;

-- ── 3. Update invoices table ──
ALTER TABLE `invoices`
  ADD COLUMN `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `subtotal`,
  ADD COLUMN `generated_by` INT NULL AFTER `grand_total`,
  ADD COLUMN `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `status`,
  ADD COLUMN `sent_at` TIMESTAMP NULL AFTER `generated_at`;

ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Populate existing invoices details
UPDATE `invoices` i
JOIN `purchase_orders` po ON i.po_id = po.id
SET i.tax_amount = i.tax,
    i.generated_by = po.generated_by;
