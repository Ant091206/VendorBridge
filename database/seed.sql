-- ============================================================
-- VendorBridge ERP — Demo Seed Data
-- Run: mysql -u root -p vendorbridge < database/seed.sql
-- ============================================================

USE `vendorbridge`;

-- ============================================================
-- CLEAN SLATE (delete in FK-safe order)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `activity_logs`;
DELETE FROM `invoices`;
DELETE FROM `purchase_orders`;
DELETE FROM `approvals`;
DELETE FROM `quotations`;
DELETE FROM `rfq_vendors`;
DELETE FROM `rfqs`;
DELETE FROM `vendors`;
DELETE FROM `vendor_categories`;
DELETE FROM `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters
ALTER TABLE `activity_logs`    AUTO_INCREMENT = 1;
ALTER TABLE `invoices`         AUTO_INCREMENT = 1;
ALTER TABLE `purchase_orders`  AUTO_INCREMENT = 1;
ALTER TABLE `approvals`        AUTO_INCREMENT = 1;
ALTER TABLE `quotations`       AUTO_INCREMENT = 1;
ALTER TABLE `rfq_vendors`      AUTO_INCREMENT = 1;
ALTER TABLE `rfqs`             AUTO_INCREMENT = 1;
ALTER TABLE `vendors`          AUTO_INCREMENT = 1;
ALTER TABLE `vendor_categories` AUTO_INCREMENT = 1;
ALTER TABLE `users`            AUTO_INCREMENT = 1;

-- ============================================================
-- 1. USERS
-- All passwords hashed with bcrypt (rounds: 10)
-- Admin@123     => $2a$10$ROAEW3slmPjqjtJU.yNoEO6bCYPWpnqgggoH5iiTbRbEE7h3JUvEq
-- Officer@123   => $2a$10$7s8xWKWNMaF.ogllStUGseM/ay.kWEfdXvqPkKfrYh73W6zQoyTSa
-- Manager@123   => $2a$10$9W08outhanRJ3D50fMhEFeSbGLUzIB6yOeyWyqPHEbBY7OC3pX5ea
-- Vendor@123    => $2a$10$QyP9k5QtHy2kWqoBvtp6feNd9bISoEZn4evXeNg5JH/5t808kjDH6
-- ============================================================
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Rajesh Kumar',       'admin@vendorbridge.com',    '$2a$10$ROAEW3slmPjqjtJU.yNoEO6bCYPWpnqgggoH5iiTbRbEE7h3JUvEq', 'admin',   NOW() - INTERVAL 60 DAY),
(2, 'Priya Sharma',       'officer@vendorbridge.com',  '$2a$10$7s8xWKWNMaF.ogllStUGseM/ay.kWEfdXvqPkKfrYh73W6zQoyTSa', 'officer', NOW() - INTERVAL 55 DAY),
(3, 'Vikram Mehta',       'manager@vendorbridge.com',  '$2a$10$9W08outhanRJ3D50fMhEFeSbGLUzIB6yOeyWyqPHEbBY7OC3pX5ea', 'manager', NOW() - INTERVAL 50 DAY),
(4, 'Arjun Patel',        'vendor1@vendorbridge.com',  '$2a$10$QyP9k5QtHy2kWqoBvtp6feNd9bISoEZn4evXeNg5JH/5t808kjDH6', 'vendor',  NOW() - INTERVAL 45 DAY),
(5, 'Sneha Gupta',        'vendor2@vendorbridge.com',  '$2a$10$QyP9k5QtHy2kWqoBvtp6feNd9bISoEZn4evXeNg5JH/5t808kjDH6', 'vendor',  NOW() - INTERVAL 40 DAY),
(6, 'Ravi Technologies',  'vendor3@vendorbridge.com',  '$2a$10$QyP9k5QtHy2kWqoBvtp6feNd9bISoEZn4evXeNg5JH/5t808kjDH6', 'vendor',  NOW() - INTERVAL 35 DAY);

-- ============================================================
-- 2. VENDOR CATEGORIES
-- ============================================================
INSERT INTO `vendor_categories` (`id`, `name`) VALUES
(1, 'IT & Software'),
(2, 'Hardware & Electronics'),
(3, 'Office Supplies'),
(4, 'Logistics & Transport'),
(5, 'Furniture'),
(6, 'Maintenance & Repair');

-- ============================================================
-- 3. VENDOR COMPANIES
-- ============================================================
INSERT INTO `vendors` (`id`, `name`, `gst_number`, `email`, `phone`, `address`, `status`, `category_id`, `created_at`) VALUES
(1, 'TechVision Solutions',    '27AABCT1332L1ZX', 'info@techvision.com',       '9876543210', '42, Tech Park, Powai, Mumbai - 400076',             'active',   1, NOW() - INTERVAL 50 DAY),
(2, 'GlobalHardware Pvt Ltd',  '29AABCG4567M1ZY', 'sales@globalhardware.com',  '9876543211', '18, Electronic City Phase 1, Bengaluru - 560100',  'active',   2, NOW() - INTERVAL 48 DAY),
(3, 'SwiftLogistics India',    '06AABCS8901N1ZZ', 'ops@swiftlogistics.com',    '9876543212', '7, Sector 18, Gurugram, Haryana - 122015',          'active',   4, NOW() - INTERVAL 45 DAY),
(4, 'OfficeWorld Supplies',    '07AABCO2345P1ZA', 'orders@officeworld.com',    '9876543213', '33, Connaught Place, New Delhi - 110001',           'active',   3, NOW() - INTERVAL 42 DAY),
(5, 'FurniCraft Industries',   '24AABCF6789Q1ZB', 'info@furnicraft.com',       '9876543214', '9, GIDC Industrial Estate, Ahmedabad - 382445',    'inactive', 5, NOW() - INTERVAL 40 DAY);

-- ============================================================
-- 4. RFQs
-- ============================================================
INSERT INTO `rfqs` (`id`, `title`, `description`, `quantity`, `deadline`, `status`, `created_by`, `created_at`) VALUES
(1, 'Procurement of Laptops for Development Team',
   'Require 50 high-performance laptops for software development team. Minimum specs: Intel i7, 16GB RAM, 512GB SSD, 15 inch display',
   50, NOW() + INTERVAL 30 DAY, 'closed', 2, NOW() - INTERVAL 30 DAY),

(2, 'Office Furniture for New Branch Office',
   'Require office furniture for 20 workstations including ergonomic chairs, adjustable desks, and storage cabinets for new Pune branch',
   20, NOW() + INTERVAL 20 DAY, 'closed', 2, NOW() - INTERVAL 20 DAY),

(3, 'Annual Stationery and Office Supplies',
   'Yearly requirement for office stationery including A4 paper reams, ballpoint pens, files, folders, staplers, and general supplies',
   100, NOW() + INTERVAL 15 DAY, 'open', 2, NOW() - INTERVAL 7 DAY);

-- ============================================================
-- 5. RFQ VENDOR ASSIGNMENTS
-- ============================================================
INSERT INTO `rfq_vendors` (`rfq_id`, `vendor_id`) VALUES
(1, 1),  -- RFQ 1 → TechVision Solutions
(1, 2),  -- RFQ 1 → GlobalHardware Pvt Ltd
(2, 5),  -- RFQ 2 → FurniCraft Industries
(2, 4),  -- RFQ 2 → OfficeWorld Supplies
(3, 4),  -- RFQ 3 → OfficeWorld Supplies
(3, 3),  -- RFQ 3 → SwiftLogistics India
(3, 1);  -- RFQ 3 → TechVision Solutions

-- ============================================================
-- 6. QUOTATIONS
-- ============================================================
INSERT INTO `quotations` (`id`, `rfq_id`, `vendor_id`, `unit_price`, `total_price`, `delivery_days`, `notes`, `status`, `submitted_at`) VALUES
-- RFQ 1 quotations
(1, 1, 1, 85000.00, 4250000.00, 7,  'Includes 1 year on-site warranty and 24x7 technical support', 'selected', NOW() - INTERVAL 22 DAY),
(2, 1, 2, 79000.00, 3950000.00, 14, 'Bulk discount applicable. GST input credit available.',        'rejected', NOW() - INTERVAL 21 DAY),

-- RFQ 2 quotations
(3, 2, 5, 25000.00, 500000.00, 10,  'Includes professional installation and 6-month maintenance',  'selected', NOW() - INTERVAL 12 DAY),
(4, 2, 4, 22000.00, 440000.00, 15,  'Standard quality furniture. Delivery and installation extra.', 'rejected', NOW() - INTERVAL 11 DAY),

-- RFQ 3 quotations
(5, 3, 4, 850.00, 85000.00, 3, 'Same day delivery available for orders placed before 2 PM',        'submitted', NOW() - INTERVAL 2 DAY),
(6, 3, 3, 920.00, 92000.00, 2, 'Premium quality items with express courier delivery',               'submitted', NOW() - INTERVAL 1 DAY);

-- ============================================================
-- 7. APPROVALS
-- ============================================================
INSERT INTO `approvals` (`id`, `quotation_id`, `approver_id`, `decision`, `remarks`, `decided_at`) VALUES
(1, 1, 3, 'approved', 'Best value with 1-year warranty and onsite support included. TechVision has proven track record with our organisation.', NOW() - INTERVAL 5 DAY),
(2, 3, 3, 'approved', 'Reasonable price with professional installation service. FurniCraft provides quality ergonomic furniture.',              NOW() - INTERVAL 2 DAY);

-- ============================================================
-- 8. PURCHASE ORDERS
-- ============================================================
INSERT INTO `purchase_orders` (`id`, `po_number`, `approval_id`, `subtotal`, `tax_amount`, `grand_total`, `status`, `created_at`) VALUES
(1, 'PO-2025-0001', 1, 4250000.00, 765000.00, 5015000.00, 'generated', NOW() - INTERVAL 5 DAY),
(2, 'PO-2025-0002', 2, 500000.00,   90000.00,  590000.00, 'sent',      NOW() - INTERVAL 2 DAY);

-- ============================================================
-- 9. INVOICES
-- ============================================================
INSERT INTO `invoices` (`id`, `po_id`, `invoice_number`, `subtotal`, `tax`, `grand_total`, `status`, `issued_at`) VALUES
(1, 1, 'INV-2025-0001', 4250000.00, 765000.00, 5015000.00, 'sent', NOW() - INTERVAL 3 DAY);

-- ============================================================
-- 10. ACTIVITY LOGS (realistic procurement story)
-- ============================================================
INSERT INTO `activity_logs` (`user_id`, `entity_type`, `entity_id`, `action`, `created_at`) VALUES
(2, 'rfq',            1, 'RFQ_CREATED',          NOW() - INTERVAL 30 DAY),
(2, 'rfq',            1, 'RFQ_PUBLISHED',         NOW() - INTERVAL 29 DAY),
(2, 'quotation',      1, 'QUOTATION_SUBMITTED',   NOW() - INTERVAL 22 DAY),
(2, 'quotation',      2, 'QUOTATION_SUBMITTED',   NOW() - INTERVAL 21 DAY),
(2, 'quotation',      1, 'QUOTATION_SELECTED',    NOW() - INTERVAL 20 DAY),
(3, 'approval',       1, 'APPROVAL_APPROVED',     NOW() - INTERVAL 5 DAY),
(3, 'purchase_order', 1, 'PO_GENERATED',          NOW() - INTERVAL 5 DAY),
(2, 'invoice',        1, 'INVOICE_GENERATED',     NOW() - INTERVAL 4 DAY),
(2, 'invoice',        1, 'INVOICE_EMAILED',       NOW() - INTERVAL 3 DAY),
(3, 'approval',       2, 'APPROVAL_APPROVED',     NOW() - INTERVAL 2 DAY);
