/**
 * VendorBridge ERP — Programmatic Seed Script
 * Run: node database/seed.js
 *
 * Uses bcrypt to hash passwords, connects via .env variables.
 * Clears existing data then inserts complete demo dataset.
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// ── Database connection ──
const createPool = () => mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'vendorbridge',
  waitForConnections: true,
  connectionLimit: 5
});

// ── Bcrypt hash helper ──
const hash = (password) => bcrypt.hash(password, 10);

// ── Utility: log step ──
const step = (msg) => console.log(`\n  ▶  ${msg}`);
const ok   = (msg) => console.log(`  ✓  ${msg}`);

async function seed() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   VendorBridge — Demo Seed Script      ║');
  console.log('╚════════════════════════════════════════╝');

  const pool = createPool();

  try {
    // ── Test connection ──
    const conn = await pool.getConnection();
    console.log('\n  Database connected successfully.\n');
    conn.release();

    // ── Hash all passwords ──
    step('Hashing passwords...');
    const [adminHash, officerHash, managerHash, vendorHash] = await Promise.all([
      hash('Admin@123'),
      hash('Officer@123'),
      hash('Manager@123'),
      hash('Vendor@123')
    ]);
    ok('All passwords hashed.');

    // ── CLEAR EXISTING DATA (FK-safe order) ──
    step('Clearing existing data...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'activity_logs', 'invoices', 'purchase_orders',
      'approvals', 'quotations', 'rfq_vendors',
      'rfqs', 'vendors', 'vendor_categories', 'users'
    ];
    for (const table of tables) {
      await pool.execute(`DELETE FROM \`${table}\``);
      await pool.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
    }
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    ok('All existing data cleared.');

    // ════════════════════════════════════════
    // 1. USERS
    // ════════════════════════════════════════
    step('Inserting users...');
    const users = [
      [1, 'Rajesh Kumar',      'admin@vendorbridge.com',   adminHash,   'admin',   60],
      [2, 'Priya Sharma',      'officer@vendorbridge.com', officerHash, 'officer', 55],
      [3, 'Vikram Mehta',      'manager@vendorbridge.com', managerHash, 'manager', 50],
      [4, 'Arjun Patel',       'vendor1@vendorbridge.com', vendorHash,  'vendor',  45],
      [5, 'Sneha Gupta',       'vendor2@vendorbridge.com', vendorHash,  'vendor',  40],
      [6, 'Ravi Technologies', 'vendor3@vendorbridge.com', vendorHash,  'vendor',  35],
    ];

    for (const [id, name, email, password_hash, role, daysAgo] of users) {
      await pool.execute(
        'INSERT INTO `users` (`id`,`name`,`email`,`password_hash`,`role`,`created_at`) VALUES (?,?,?,?,?, NOW() - INTERVAL ? DAY)',
        [id, name, email, password_hash, role, daysAgo]
      );
    }
    ok(`${users.length} users inserted.`);

    // ════════════════════════════════════════
    // 2. VENDOR CATEGORIES
    // ════════════════════════════════════════
    step('Inserting vendor categories...');
    const categories = [
      [1, 'IT & Software'],
      [2, 'Hardware & Electronics'],
      [3, 'Office Supplies'],
      [4, 'Logistics & Transport'],
      [5, 'Furniture'],
      [6, 'Maintenance & Repair'],
    ];

    for (const [id, name] of categories) {
      await pool.execute('INSERT INTO `vendor_categories` (`id`,`name`) VALUES (?,?)', [id, name]);
    }
    ok(`${categories.length} vendor categories inserted.`);

    // ════════════════════════════════════════
    // 3. VENDOR COMPANIES
    // ════════════════════════════════════════
    step('Inserting vendor companies...');
    const vendorCompanies = [
      [1, 'TechVision Solutions',   '27AABCT1332L1ZX', 'info@techvision.com',      '9876543210', '42, Tech Park, Powai, Mumbai - 400076',           'active',   1, 50],
      [2, 'GlobalHardware Pvt Ltd', '29AABCG4567M1ZY', 'sales@globalhardware.com', '9876543211', '18, Electronic City Phase 1, Bengaluru - 560100', 'active',   2, 48],
      [3, 'SwiftLogistics India',   '06AABCS8901N1ZZ', 'ops@swiftlogistics.com',   '9876543212', '7, Sector 18, Gurugram, Haryana - 122015',         'active',   4, 45],
      [4, 'OfficeWorld Supplies',   '07AABCO2345P1ZA', 'orders@officeworld.com',   '9876543213', '33, Connaught Place, New Delhi - 110001',          'active',   3, 42],
      [5, 'FurniCraft Industries',  '24AABCF6789Q1ZB', 'info@furnicraft.com',      '9876543214', '9, GIDC Industrial Estate, Ahmedabad - 382445',   'inactive', 5, 40],
    ];

    for (const [id, name, gst, email, phone, address, status, catId, daysAgo] of vendorCompanies) {
      await pool.execute(
        'INSERT INTO `vendors` (`id`,`name`,`gst_number`,`email`,`phone`,`address`,`status`,`category_id`,`created_at`) VALUES (?,?,?,?,?,?,?,?, NOW() - INTERVAL ? DAY)',
        [id, name, gst, email, phone, address, status, catId, daysAgo]
      );
    }
    ok(`${vendorCompanies.length} vendor companies inserted.`);

    // ════════════════════════════════════════
    // 4. RFQs
    // ════════════════════════════════════════
    step('Inserting RFQs...');
    const rfqs = [
      [1, 'Procurement of Laptops for Development Team',
       'Require 50 high-performance laptops for software development team. Minimum specs: Intel i7, 16GB RAM, 512GB SSD, 15 inch display',
       50, 30, 'closed', 2, 30],
      [2, 'Office Furniture for New Branch Office',
       'Require office furniture for 20 workstations including ergonomic chairs, adjustable desks, and storage cabinets for new Pune branch',
       20, 20, 'closed', 2, 20],
      [3, 'Annual Stationery and Office Supplies',
       'Yearly requirement for office stationery including A4 paper reams, ballpoint pens, files, folders, staplers, and general supplies',
       100, 15, 'open', 2, 7],
    ];

    for (const [id, title, desc, qty, deadlineDays, status, createdBy, createdAgo] of rfqs) {
      await pool.execute(
        `INSERT INTO \`rfqs\` (\`id\`,\`title\`,\`description\`,\`quantity\`,\`deadline\`,\`status\`,\`created_by\`,\`created_at\`)
         VALUES (?,?,?,?, NOW() + INTERVAL ? DAY, ?,?, NOW() - INTERVAL ? DAY)`,
        [id, title, desc, qty, deadlineDays, status, createdBy, createdAgo]
      );
    }
    ok(`${rfqs.length} RFQs inserted.`);

    // ════════════════════════════════════════
    // 5. RFQ VENDOR ASSIGNMENTS
    // ════════════════════════════════════════
    step('Inserting RFQ vendor assignments...');
    const assignments = [
      [1, 1], [1, 2],      // RFQ 1 → TechVision, GlobalHardware
      [2, 5], [2, 4],      // RFQ 2 → FurniCraft, OfficeWorld
      [3, 4], [3, 3], [3, 1], // RFQ 3 → OfficeWorld, SwiftLogistics, TechVision
    ];

    for (const [rfqId, vendorId] of assignments) {
      await pool.execute('INSERT INTO `rfq_vendors` (`rfq_id`,`vendor_id`) VALUES (?,?)', [rfqId, vendorId]);
    }
    ok(`${assignments.length} RFQ–Vendor assignments inserted.`);

    // ════════════════════════════════════════
    // 6. QUOTATIONS
    // ════════════════════════════════════════
    step('Inserting quotations...');
    const quotations = [
      [1, 1, 1, 85000.00, 4250000.00, 7,  'Includes 1 year on-site warranty and 24x7 technical support', 'selected', 22],
      [2, 1, 2, 79000.00, 3950000.00, 14, 'Bulk discount applicable. GST input credit available.',        'rejected', 21],
      [3, 2, 5, 25000.00,  500000.00, 10, 'Includes professional installation and 6-month maintenance',   'selected', 12],
      [4, 2, 4, 22000.00,  440000.00, 15, 'Standard quality furniture. Delivery and installation extra.', 'rejected', 11],
      [5, 3, 4,   850.00,   85000.00,  3, 'Same day delivery available for orders placed before 2 PM',    'submitted', 2],
      [6, 3, 3,   920.00,   92000.00,  2, 'Premium quality items with express courier delivery',          'submitted', 1],
    ];

    for (const [id, rfqId, vendorId, unitPrice, totalPrice, deliveryDays, notes, status, daysAgo] of quotations) {
      await pool.execute(
        `INSERT INTO \`quotations\` (\`id\`,\`rfq_id\`,\`vendor_id\`,\`unit_price\`,\`total_price\`,\`delivery_days\`,\`notes\`,\`status\`,\`submitted_at\`)
         VALUES (?,?,?,?,?,?,?,?, NOW() - INTERVAL ? DAY)`,
        [id, rfqId, vendorId, unitPrice, totalPrice, deliveryDays, notes, status, daysAgo]
      );
    }
    ok(`${quotations.length} quotations inserted.`);

    // ════════════════════════════════════════
    // 7. APPROVALS
    // ════════════════════════════════════════
    step('Inserting approvals...');
    const approvals = [
      [1, 1, 3, 'approved', 'Best value with 1-year warranty and onsite support included. TechVision has proven track record.', 5],
      [2, 3, 3, 'approved', 'Reasonable price with professional installation service. FurniCraft provides quality ergonomic furniture.', 2],
    ];

    for (const [id, quotationId, approverId, decision, remarks, daysAgo] of approvals) {
      await pool.execute(
        `INSERT INTO \`approvals\` (\`id\`,\`quotation_id\`,\`approver_id\`,\`decision\`,\`remarks\`,\`decided_at\`)
         VALUES (?,?,?,?,?, NOW() - INTERVAL ? DAY)`,
        [id, quotationId, approverId, decision, remarks, daysAgo]
      );
    }
    ok(`${approvals.length} approvals inserted.`);

    // ════════════════════════════════════════
    // 8. PURCHASE ORDERS
    // ════════════════════════════════════════
    step('Inserting purchase orders...');
    const purchaseOrders = [
      [1, 'PO-2025-0001', 1, 4250000.00, 765000.00, 5015000.00, 'generated', 5],
      [2, 'PO-2025-0002', 2,  500000.00,  90000.00,  590000.00, 'sent',      2],
    ];

    for (const [id, poNumber, approvalId, subtotal, taxAmount, grandTotal, status, daysAgo] of purchaseOrders) {
      await pool.execute(
        `INSERT INTO \`purchase_orders\` (\`id\`,\`po_number\`,\`approval_id\`,\`subtotal\`,\`tax_amount\`,\`grand_total\`,\`status\`,\`created_at\`)
         VALUES (?,?,?,?,?,?,?, NOW() - INTERVAL ? DAY)`,
        [id, poNumber, approvalId, subtotal, taxAmount, grandTotal, status, daysAgo]
      );
    }
    ok(`${purchaseOrders.length} purchase orders inserted.`);

    // ════════════════════════════════════════
    // 9. INVOICES
    // ════════════════════════════════════════
    step('Inserting invoices...');
    await pool.execute(
      `INSERT INTO \`invoices\` (\`id\`,\`po_id\`,\`invoice_number\`,\`subtotal\`,\`tax\`,\`grand_total\`,\`status\`,\`issued_at\`)
       VALUES (1, 1, 'INV-2025-0001', 4250000.00, 765000.00, 5015000.00, 'sent', NOW() - INTERVAL 3 DAY)`
    );
    ok('1 invoice inserted.');

    // ════════════════════════════════════════
    // 10. ACTIVITY LOGS
    // ════════════════════════════════════════
    step('Inserting activity logs...');
    const logs = [
      [2, 'rfq',            1, 'RFQ_CREATED',        30],
      [2, 'rfq',            1, 'RFQ_PUBLISHED',       29],
      [2, 'quotation',      1, 'QUOTATION_SUBMITTED', 22],
      [2, 'quotation',      2, 'QUOTATION_SUBMITTED', 21],
      [2, 'quotation',      1, 'QUOTATION_SELECTED',  20],
      [3, 'approval',       1, 'APPROVAL_APPROVED',    5],
      [3, 'purchase_order', 1, 'PO_GENERATED',         5],
      [2, 'invoice',        1, 'INVOICE_GENERATED',    4],
      [2, 'invoice',        1, 'INVOICE_EMAILED',      3],
      [3, 'approval',       2, 'APPROVAL_APPROVED',    2],
    ];

    for (const [userId, entityType, entityId, action, daysAgo] of logs) {
      await pool.execute(
        `INSERT INTO \`activity_logs\` (\`user_id\`,\`entity_type\`,\`entity_id\`,\`action\`,\`created_at\`)
         VALUES (?,?,?,?, NOW() - INTERVAL ? DAY)`,
        [userId, entityType, entityId, action, daysAgo]
      );
    }
    ok(`${logs.length} activity logs inserted.`);

    // ════════════════════════════════════════
    // FINAL SUMMARY
    // ════════════════════════════════════════
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║            Seed Complete! 🎉            ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║  Users:            ${users.length}                     ║`);
    console.log(`║  Vendor Categories:${categories.length}                     ║`);
    console.log(`║  Vendors:          ${vendorCompanies.length}                     ║`);
    console.log(`║  RFQs:             ${rfqs.length}                     ║`);
    console.log(`║  Quotations:       ${quotations.length}                     ║`);
    console.log(`║  Approvals:        ${approvals.length}                     ║`);
    console.log(`║  Purchase Orders:  ${purchaseOrders.length}                     ║`);
    console.log('║  Invoices:         1                     ║');
    console.log(`║  Activity Logs:    ${logs.length}                    ║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║  Demo Accounts:                        ║');
    console.log('║  admin@vendorbridge.com / Admin@123    ║');
    console.log('║  officer@vendorbridge.com / Officer@123║');
    console.log('║  manager@vendorbridge.com / Manager@123║');
    console.log('║  vendor1@vendorbridge.com / Vendor@123 ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n  ✗  Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
