-- MySQL Database Schema for VendorBridge ERP
-- Procurement & Vendor Management System
-- Consolidated Schema for Modules 1 - 8

DROP DATABASE IF EXISTS `vendorbridge`;
CREATE DATABASE `vendorbridge`;
USE `vendorbridge`;

-- Disable FK checks during initialization
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'officer', 'finance', 'vendor') NOT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Profiles Table
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `profile_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `phone` VARCHAR(20) NULL,
  `company` VARCHAR(255) NULL,
  `department` VARCHAR(255) NULL,
  `address` TEXT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_profiles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Sessions Table
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `session_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `login_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_time` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_sessions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Password Reset Tokens Table
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `unique_token` (`token`),
  INDEX `idx_expires` (`expires_at`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Vendor Categories Table
DROP TABLE IF EXISTS `vendor_categories`;
CREATE TABLE `vendor_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Vendors Table
DROP TABLE IF EXISTS `vendors`;
CREATE TABLE `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_code` VARCHAR(50) UNIQUE NOT NULL,
  `vendor_name` VARCHAR(255) NULL,
  `company_name` VARCHAR(255) NULL,
  `name` VARCHAR(255) NOT NULL, -- Keep original for backup compatibility
  `gst_number` VARCHAR(50) NOT NULL,
  `pan_number` VARCHAR(20) NULL,
  `contact_person` VARCHAR(255) NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `alternate_phone` VARCHAR(20) NULL,
  `address_line1` VARCHAR(255) NULL,
  `address_line2` VARCHAR(255) NULL,
  `address` TEXT NOT NULL, -- Keep original for compatibility
  `city` VARCHAR(120) NULL,
  `state` VARCHAR(120) NULL,
  `country` VARCHAR(120) NULL DEFAULT 'India',
  `postal_code` VARCHAR(20) NULL,
  `status` ENUM('active', 'inactive', 'blacklisted') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `category_id` INT,
  `created_by` INT,
  `updated_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `vendor_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_vendors_status` (`status`),
  INDEX `idx_vendors_gst_number` (`gst_number`),
  INDEX `idx_vendors_phone` (`phone`),
  INDEX `idx_vendors_state` (`state`),
  INDEX `idx_vendors_city` (`city`),
  INDEX `idx_vendors_email_status` (`email`, `status`),
  INDEX `vendors_category_idx` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. RFQs (Request For Quotations) Table
DROP TABLE IF EXISTS `rfqs`;
CREATE TABLE `rfqs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_number` VARCHAR(50) UNIQUE NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(100) NOT NULL DEFAULT 'Other',
  `priority` ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  `status` ENUM('draft', 'open', 'closed', 'cancelled') NOT NULL DEFAULT 'draft',
  `notes` TEXT NULL,
  `created_by` INT,
  `updated_by` INT,
  `issue_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `submission_deadline` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_rfqs_status` (`status`),
  INDEX `idx_rfqs_priority` (`priority`),
  INDEX `idx_rfqs_submission_deadline` (`submission_deadline`),
  INDEX `idx_rfqs_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RFQ Items Table
DROP TABLE IF EXISTS `rfq_items`;
CREATE TABLE `rfq_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Units',
  `expected_price` DECIMAL(12,2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_rfq_items_rfq` (`rfq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. RFQ Attachments Table
DROP TABLE IF EXISTS `rfq_attachments`;
CREATE TABLE `rfq_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_rfq_attachments_rfq` (`rfq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. RFQ Vendors Junction Table
DROP TABLE IF EXISTS `rfq_vendors`;
CREATE TABLE `rfq_vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `rfq_vendor_unique` (`rfq_id`, `vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Quotations Table
DROP TABLE IF EXISTS `quotations`;
CREATE TABLE `quotations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_number` VARCHAR(50) NOT NULL UNIQUE,
  `rfq_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `submission_date` TIMESTAMP NULL,
  `delivery_days` INT NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `notes` TEXT NULL,
  `terms_conditions` TEXT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_quotations_rfq` (`rfq_id`),
  INDEX `idx_quotations_vendor` (`vendor_id`),
  INDEX `idx_quotations_status` (`status`),
  INDEX `idx_quotations_sub_date` (`submission_date`),
  INDEX `idx_quotations_number` (`quotation_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Quotation Items Table
DROP TABLE IF EXISTS `quotation_items`;
CREATE TABLE `quotation_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT NOT NULL,
  `rfq_item_id` INT NOT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`rfq_item_id`) REFERENCES `rfq_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_qitems_quotation` (`quotation_id`),
  INDEX `idx_qitems_rfq_item` (`rfq_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Quotation Attachments Table
DROP TABLE IF EXISTS `quotation_attachments`;
CREATE TABLE `quotation_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_qattachments_quotation` (`quotation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Quotation Selections Table
DROP TABLE IF EXISTS `quotation_selections`;
CREATE TABLE `quotation_selections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `quotation_id` INT NOT NULL,
  `selected_by` INT NOT NULL,
  `selection_reason` TEXT NOT NULL,
  `selection_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Recommended',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_selections_rfq` (`rfq_id`),
  INDEX `idx_selections_quote` (`quotation_id`),
  INDEX `idx_selections_user` (`selected_by`),
  INDEX `idx_selections_status` (`status`),
  INDEX `idx_selections_date` (`selection_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Quotation Comparisons Table
DROP TABLE IF EXISTS `quotation_comparisons`;
CREATE TABLE `quotation_comparisons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rfq_id` INT NOT NULL,
  `compared_by` INT NOT NULL,
  `comparison_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`compared_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_comparisons_rfq` (`rfq_id`),
  INDEX `idx_comparisons_user` (`compared_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Approval Requests Table
DROP TABLE IF EXISTS `approval_requests`;
CREATE TABLE `approval_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `approval_number` VARCHAR(100) UNIQUE NOT NULL,
  `rfq_id` INT NOT NULL,
  `quotation_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `requested_by` INT NOT NULL,
  `assigned_to` INT NOT NULL,
  `request_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `selection_reason` TEXT NOT NULL,
  `remarks` TEXT NULL,
  `approved_at` TIMESTAMP NULL,
  `rejected_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_approval_number` (`approval_number`),
  INDEX `idx_approval_status` (`status`),
  INDEX `idx_approval_assigned` (`assigned_to`),
  INDEX `idx_approval_rfq` (`rfq_id`),
  INDEX `idx_approval_quote` (`quotation_id`),
  INDEX `idx_approval_vendor` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Approval History Table
DROP TABLE IF EXISTS `approval_history`;
CREATE TABLE `approval_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `approval_request_id` INT NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `action_by` INT NOT NULL,
  `action_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `remarks` TEXT NULL,
  FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_history_request` (`approval_request_id`),
  INDEX `idx_history_action_by` (`action_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Purchase Orders Table
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `po_number` VARCHAR(100) UNIQUE NOT NULL,
  `approval_request_id` INT NOT NULL,
  `rfq_id` INT NOT NULL,
  `quotation_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `issue_date` DATE NOT NULL,
  `expected_delivery_date` DATE NOT NULL,
  `delivery_method` VARCHAR(255) NULL,
  `delivery_address` TEXT NOT NULL,
  `notes` TEXT NULL,
  `terms_conditions` TEXT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `tax_amount` DECIMAL(12,2) NOT NULL,
  `discount_amount` DECIMAL(12,2) NOT NULL,
  `grand_total` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`approval_request_id`) REFERENCES `approval_requests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_po_number` (`po_number`),
  INDEX `idx_po_vendor_id` (`vendor_id`),
  INDEX `idx_po_status` (`status`),
  INDEX `idx_po_issue_date` (`issue_date`),
  INDEX `idx_po_approval_id` (`approval_request_id`),
  INDEX `idx_po_quotation_id` (`quotation_id`),
  INDEX `idx_po_rfq_id` (`rfq_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Purchase Order Items Table
DROP TABLE IF EXISTS `purchase_order_items`;
CREATE TABLE `purchase_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_order_id` INT NOT NULL,
  `quotation_item_id` INT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Units',
  `unit_price` DECIMAL(12,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`quotation_item_id`) REFERENCES `quotation_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_po_item_po` (`purchase_order_id`),
  INDEX `idx_po_item_quote` (`quotation_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Purchase Order History Table
DROP TABLE IF EXISTS `purchase_order_history`;
CREATE TABLE `purchase_order_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_order_id` INT NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `action_by` INT NOT NULL,
  `action_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `remarks` TEXT NULL,
  FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_po_hist_po` (`purchase_order_id`),
  INDEX `idx_po_hist_user` (`action_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Invoices Table
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(100) UNIQUE NOT NULL,
  `po_id` INT NOT NULL,
  `rfq_id` INT NOT NULL,
  `quotation_id` INT NOT NULL,
  `vendor_id` INT NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `payment_terms` VARCHAR(255) NOT NULL DEFAULT 'Net 30',
  `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `round_off_amount` DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
  `grand_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Unpaid', 'Partial', 'Paid') NOT NULL DEFAULT 'Unpaid',
  `payment_reference` VARCHAR(255) NULL,
  `status` ENUM('Draft', 'Generated', 'Sent', 'Viewed', 'Paid', 'Cancelled') NOT NULL DEFAULT 'Draft',
  `notes` TEXT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`rfq_id`) REFERENCES `rfqs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_inv_number` (`invoice_number`),
  INDEX `idx_inv_po` (`po_id`),
  INDEX `idx_inv_vendor` (`vendor_id`),
  INDEX `idx_inv_status` (`status`),
  INDEX `idx_inv_issue_date` (`issue_date`),
  INDEX `idx_inv_due_date` (`due_date`),
  INDEX `idx_inv_pay_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Invoice Items Table
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `purchase_order_item_id` INT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(12,2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'Units',
  `unit_price` DECIMAL(12,2) NOT NULL,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `discount_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_inv_item_inv` (`invoice_id`),
  INDEX `idx_inv_item_poi` (`purchase_order_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Invoice History Table
DROP TABLE IF EXISTS `invoice_history`;
CREATE TABLE `invoice_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `action_type` ENUM('Created', 'Generated', 'Downloaded', 'Printed', 'Sent', 'Viewed', 'Paid', 'Cancelled', 'Updated', 'EmailFailed') NOT NULL,
  `action_by` INT NOT NULL,
  `action_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `remarks` TEXT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_inv_hist_inv` (`invoice_id`),
  INDEX `idx_inv_hist_user` (`action_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Invoice Emails Table
DROP TABLE IF EXISTS `invoice_emails`;
CREATE TABLE `invoice_emails` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `email_subject` VARCHAR(500) NOT NULL,
  `email_status` ENUM('Sent', 'Failed', 'Pending') NOT NULL DEFAULT 'Pending',
  `delivery_status` VARCHAR(100) NULL,
  `error_message` TEXT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_inv_email_inv` (`invoice_id`),
  INDEX `idx_inv_email_status` (`email_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Activity Logs Table
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_name` VARCHAR(255) NULL,
  `role` VARCHAR(50) NULL,
  `module_name` VARCHAR(100) NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NOT NULL,
  `action_type` VARCHAR(255) NOT NULL,
  `old_value` JSON NULL,
  `new_value` JSON NULL,
  `description` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `device_info` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_activity_logs_created_at` (`created_at` DESC),
  INDEX `idx_logs_module_name` (`module_name`),
  INDEX `idx_activity_logs_user_id` (`user_id`),
  INDEX `idx_logs_entity` (`entity_type`, `entity_id`),
  INDEX `idx_logs_action_type` (`action_type`),
  INDEX `idx_logs_user_created` (`user_id`, `created_at` DESC),
  INDEX `idx_logs_module_created` (`module_name`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Notifications Table
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('Unread', 'Read', 'Archived', 'Dismissed') NOT NULL DEFAULT 'Unread',
  `notification_type` VARCHAR(50) NOT NULL,
  `reference_module` VARCHAR(50) NULL,
  `reference_id` INT NULL,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_notif_user_status` (`user_id`, `status`),
  INDEX `idx_notif_type` (`notification_type`),
  INDEX `idx_notif_status` (`status`),
  INDEX `idx_notif_created_at` (`created_at` DESC),
  INDEX `idx_notif_user_created` (`user_id`, `created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
