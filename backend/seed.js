import bcrypt from 'bcryptjs';
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  console.log('\n🌱 VendorBridge Database Seeding Started...\n');

  try {
    // ── Step 0: Clean existing data (FK-safe order) ──
    console.log('🧹 Cleaning existing data...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DELETE FROM `activity_logs`');
    await db.execute('DELETE FROM `invoices`');
    await db.execute('DELETE FROM `purchase_orders`');
    await db.execute('DELETE FROM `approvals`');
    await db.execute('DELETE FROM `quotations`');
    await db.execute('DELETE FROM `rfq_vendors`');
    await db.execute('DELETE FROM `rfqs`');
    await db.execute('DELETE FROM `vendors`');
    await db.execute('DELETE FROM `vendor_categories`');
    await db.execute('DELETE FROM `users`');
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Reset auto-increment counters
    const tables = [
      'activity_logs', 'invoices', 'purchase_orders', 'approvals',
      'quotations', 'rfq_vendors', 'rfqs', 'vendors',
      'vendor_categories', 'users'
    ];
    for (const table of tables) {
      await db.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
    }
    console.log('✅ Clean slate ready.\n');

    // ── Step 1: Hash passwords ──
    console.log('🔐 Hashing passwords...');
    const hashedPasswordAdmin   = await bcrypt.hash('Admin@123', 10);
    const hashedPasswordOfficer = await bcrypt.hash('Officer@123', 10);
    const hashedPasswordManager = await bcrypt.hash('Manager@123', 10);
    const hashedPasswordVendor  = await bcrypt.hash('Vendor@123', 10);
    console.log('✅ Passwords hashed.\n');

    // ── Step 2: Insert Users ──
    console.log('👥 Inserting users...');
    const users = [
      ['Rajesh Kumar',      'admin@vendorbridge.com',    hashedPasswordAdmin,   'admin'],
      ['Priya Sharma',      'officer@vendorbridge.com',  hashedPasswordOfficer, 'officer'],
      ['Vikram Mehta',      'manager@vendorbridge.com',  hashedPasswordManager, 'manager'],
      ['Arjun Patel',       'vendor1@vendorbridge.com',  hashedPasswordVendor,  'vendor'],
      ['Sneha Gupta',       'vendor2@vendorbridge.com',  hashedPasswordVendor,  'vendor'],
      ['Ravi Technologies', 'vendor3@vendorbridge.com',  hashedPasswordVendor,  'vendor'],
    ];
    for (const [name, email, hash, role] of users) {
      await db.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role]
      );
    }
    console.log(`   Inserted ${users.length} users.\n`);

    // ── Step 3: Insert Vendor Categories ──
    console.log('📂 Inserting vendor categories...');
    const categories = [
      ['IT & Software'],
      ['Hardware & Electronics'],
      ['Office Supplies'],
      ['Logistics & Transport'],
      ['Furniture'],
      ['Maintenance & Repair'],
    ];
    for (const [name] of categories) {
      await db.execute(
        'INSERT INTO vendor_categories (name) VALUES (?)',
        [name]
      );
    }
    console.log(`   Inserted ${categories.length} categories.\n`);

    // ── Step 4: Insert Vendors ──
    console.log('🏢 Inserting vendors...');
    const vendors = [
      ['TechVision Solutions',   '27AABCT1332L1ZX', 'info@techvision.com',    '9876543210', '42, Tech Park, Powai, Mumbai - 400076',             'active',   1],
      ['GlobalHardware Pvt Ltd', '29AABCG4567M1ZY', 'sales@globalhardware.com','9876543211', '18, Electronic City Phase 1, Bengaluru - 560100',  'active',   2],
      ['SwiftLogistics India',   '06AABCS8901N1ZZ', 'ops@swiftlogistics.com',  '9876543212', '7, Sector 18, Gurugram, Haryana - 122015',          'active',   4],
      ['OfficeWorld Supplies',   '07AABCO2345P1ZA', 'orders@officeworld.com',  '9876543213', '33, Connaught Place, New Delhi - 110001',           'active',   3],
      ['FurniCraft Industries',  '24AABCF6789Q1ZB', 'info@furnicraft.com',     '9876543214', '9, GIDC Industrial Estate, Ahmedabad - 382445',    'inactive', 5],
    ];
    for (const v of vendors) {
      await db.execute(
        'INSERT INTO vendors (name, gst_number, email, phone, address, status, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        v
      );
    }
    console.log(`   Inserted ${vendors.length} vendors.\n`);

    // ── Step 5: Insert RFQs ──
    console.log('📋 Inserting RFQs...');
    const rfqs = [
      ['Procurement of Laptops for Development Team',
       'Require 50 high-performance laptops for software development team. Minimum specs: Intel i7, 16GB RAM, 512GB SSD, 15 inch display',
       50, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'closed', 2],
      ['Office Furniture for New Branch Office',
       'Require office furniture for 20 workstations including ergonomic chairs, adjustable desks, and storage cabinets for new Pune branch',
       20, new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), 'closed', 2],
      ['Annual Stationery and Office Supplies',
       'Yearly requirement for office stationery including A4 paper reams, ballpoint pens, files, folders, staplers, and general supplies',
       100, new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'open', 2],
    ];
    const rfqIds = [];
    for (const [title, desc, qty, deadline, status, createdBy] of rfqs) {
      const [result] = await db.execute(
        'INSERT INTO rfqs (title, description, quantity, deadline, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [title, desc, qty, deadline, status, createdBy]
      );
      rfqIds.push(result.insertId);
    }
    console.log(`   Inserted ${rfqs.length} RFQs.\n`);

    // ── Step 6: Insert RFQ Vendor Assignments ──
    console.log('🔗 Assigning vendors to RFQs...');
    const assignments = [
      [rfqIds[0], 1],
      [rfqIds[0], 2],
      [rfqIds[1], 5],
      [rfqIds[1], 4],
      [rfqIds[2], 4],
      [rfqIds[2], 3],
      [rfqIds[2], 1],
    ];
    for (const [rfqId, vendorId] of assignments) {
      await db.execute(
        'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
        [rfqId, vendorId]
      );
    }
    console.log(`   Inserted ${assignments.length} assignments.\n`);

    // ── Step 7: Insert Quotations ──
    console.log('💬 Inserting quotations...');
    const quotations = [
      [rfqIds[0], 1, 85000, 4250000, 7,  'Includes 1 year on-site warranty and 24x7 technical support', 'selected',  new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)],
      [rfqIds[0], 2, 79000, 3950000, 14, 'Bulk discount applicable. GST input credit available.',        'rejected',  new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)],
      [rfqIds[1], 5, 25000, 500000,  10, 'Includes professional installation and 6-month maintenance',   'selected',  new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)],
      [rfqIds[1], 4, 22000, 440000,  15, 'Standard quality furniture. Delivery and installation extra.',  'rejected',  new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)],
      [rfqIds[2], 4, 850,   85000,   3,  'Same day delivery available for orders placed before 2 PM',    'submitted', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)],
      [rfqIds[2], 3, 920,   92000,   2,  'Premium quality items with express courier delivery',           'submitted', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)],
    ];
    const quotationIds = [];
    for (const q of quotations) {
      const [rfqId, vendorId, unitPrice, totalPrice, deliveryDays, notes, status, submittedAt] = q;
      const [result] = await db.execute(
        'INSERT INTO quotations (rfq_id, vendor_id, unit_price, total_price, delivery_days, notes, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [rfqId, vendorId, unitPrice, totalPrice, deliveryDays, notes, status, submittedAt]
      );
      quotationIds.push(result.insertId);
    }
    console.log(`   Inserted ${quotations.length} quotations.\n`);

    // ── Step 8: Insert Approvals ──
    console.log('✅ Inserting approvals...');
    const approvals = [
      [quotationIds[0], 3, 'approved', 'Best value with 1-year warranty and onsite support included. TechVision has proven track record with our organisation.', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)],
      [quotationIds[2], 3, 'approved', 'Reasonable price with professional installation service. FurniCraft provides quality ergonomic furniture.',                                         new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)],
    ];
    const approvalIds = [];
    for (const a of approvals) {
      const [qId, approverId, decision, remarks, decidedAt] = a;
      const [result] = await db.execute(
        'INSERT INTO approvals (quotation_id, approver_id, decision, remarks, decided_at) VALUES (?, ?, ?, ?, ?)',
        [qId, approverId, decision, remarks, decidedAt]
      );
      approvalIds.push(result.insertId);
    }
    console.log(`   Inserted ${approvals.length} approvals.\n`);

    // ── Step 9: Insert Purchase Orders ──
    console.log('📦 Inserting purchase orders...');
    const pos = [
      ['PO-2025-0001', approvalIds[0], 4250000, 765000, 5015000, 'generated', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)],
      ['PO-2025-0002', approvalIds[1], 500000,  90000,  590000,  'sent',      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)],
    ];
    const poIds = [];
    for (const po of pos) {
      const [poNumber, approvalId, subtotal, tax, grandTotal, status, createdAt] = po;
      const [result] = await db.execute(
        'INSERT INTO purchase_orders (po_number, approval_id, subtotal, tax_amount, grand_total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [poNumber, approvalId, subtotal, tax, grandTotal, status, createdAt]
      );
      poIds.push(result.insertId);
    }
    console.log(`   Inserted ${pos.length} purchase orders.\n`);

    // ── Step 10: Insert Invoices ──
    console.log('🧾 Inserting invoices...');
    const invoices = [
      [poIds[0], 'INV-2025-0001', 4250000, 765000, 5015000, 'sent', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)],
    ];
    for (const inv of invoices) {
      const [poId, invNumber, subtotal, tax, grandTotal, status, issuedAt] = inv;
      await db.execute(
        'INSERT INTO invoices (po_id, invoice_number, subtotal, tax, grand_total, status, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [poId, invNumber, subtotal, tax, grandTotal, status, issuedAt]
      );
    }
    console.log(`   Inserted ${invoices.length} invoices.\n`);

    // ── Step 11: Insert Activity Logs ──
    console.log('📝 Inserting activity logs...');
    const logs = [
      [2, 'rfq',            1, 'RFQ_CREATED',       new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
      [2, 'rfq',            1, 'RFQ_PUBLISHED',     new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)],
      [2, 'quotation',      1, 'QUOTATION_SUBMITTED', new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)],
      [2, 'quotation',      2, 'QUOTATION_SUBMITTED', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)],
      [2, 'quotation',      1, 'QUOTATION_SELECTED',  new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)],
      [3, 'approval',       1, 'APPROVAL_APPROVED',   new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)],
      [3, 'purchase_order', 1, 'PO_GENERATED',        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)],
      [2, 'invoice',        1, 'INVOICE_GENERATED',   new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)],
      [2, 'invoice',        1, 'INVOICE_EMAILED',     new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)],
      [3, 'approval',       2, 'APPROVAL_APPROVED',   new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)],
    ];
    for (const l of logs) {
      const [userId, entityType, entityId, action, createdAt] = l;
      await db.execute(
        'INSERT INTO activity_logs (user_id, entity_type, entity_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
        [userId, entityType, entityId, action, createdAt]
      );
    }
    console.log(`   Inserted ${logs.length} activity logs.\n`);

    // ── Summary ──
    console.log('═══════════════════════════════════════');
    console.log('🎉 Seed Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`   Users:            ${users.length}`);
    console.log(`   Vendor Categories: ${categories.length}`);
    console.log(`   Vendors:          ${vendors.length}`);
    console.log(`   RFQs:             ${rfqs.length}`);
    console.log(`   RFQ Assignments:  ${assignments.length}`);
    console.log(`   Quotations:       ${quotations.length}`);
    console.log(`   Approvals:        ${approvals.length}`);
    console.log(`   Purchase Orders:  ${pos.length}`);
    console.log(`   Invoices:         ${invoices.length}`);
    console.log(`   Activity Logs:    ${logs.length}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
