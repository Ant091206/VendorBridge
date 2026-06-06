import bcrypt from 'bcryptjs';
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  console.log('\n🚀 VendorBridge ERP Massive Seeding Started...\n');

  try {
    // ── Step 0: Clean existing data (FK-safe order) ──
    console.log('🧹 Cleaning existing data...');
    await db.execute('SET FOREIGN_KEY_CHECKS = 0');
    await db.execute('DELETE FROM `password_reset_tokens`');
    await db.execute('DELETE FROM `activity_logs`');
    await db.execute('DELETE FROM `notifications`');
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
      'password_reset_tokens', 'activity_logs', 'notifications', 'invoices', 
      'purchase_orders', 'approvals', 'quotations', 'rfq_vendors', 
      'rfqs', 'vendors', 'vendor_categories', 'users'
    ];
    for (const table of tables) {
      await db.execute(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
    }
    console.log('✅ Clean slate ready.\n');

    // ── Step 1: Pre-hash passwords (Speed Optimization) ──
    console.log('🔐 Hashing passwords...');
    const hashedAdmin = await bcrypt.hash('Admin@123', 10);
    const hashedOfficer = await bcrypt.hash('Officer@123', 10);
    const hashedManager = await bcrypt.hash('Manager@123', 10);
    const hashedVendor = await bcrypt.hash('Vendor@123', 10);
    console.log('✅ Passwords hashed.\n');

    // ── Step 2: Insert 8 Users ──
    console.log('👥 Inserting users...');
    const users = [
      ['Rajesh Kumar', 'admin@vendorbridge.com', hashedAdmin, 'admin'],
      ['Priya Sharma', 'officer@vendorbridge.com', hashedOfficer, 'officer'],
      ['Vikram Mehta', 'manager@vendorbridge.com', hashedManager, 'manager'],
      ['Arjun Patel', 'vendor1@vendorbridge.com', hashedVendor, 'vendor'],
      ['Sneha Gupta', 'vendor2@vendorbridge.com', hashedVendor, 'vendor'],
      ['Ravi Chandra', 'vendor3@vendorbridge.com', hashedVendor, 'vendor'],
      ['Suresh Naidu', 'vendor4@vendorbridge.com', hashedVendor, 'vendor'],
      ['Amit Shah', 'vendor5@vendorbridge.com', hashedVendor, 'vendor'],
    ];
    for (const [name, email, hash, role] of users) {
      await db.execute(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, \'active\')',
        [name, email, hash, role]
      );
    }
    console.log(`   Seeded ${users.length} system users.\n`);

    // ── Step 3: Insert 6 Vendor Categories ──
    console.log('📂 Inserting categories...');
    const categories = [
      'IT & Software',
      'Hardware & Electronics',
      'Office Supplies',
      'Logistics & Transport',
      'Furniture',
      'Maintenance & Repair'
    ];
    const categoryIds = [];
    for (const cat of categories) {
      const [res] = await db.execute('INSERT INTO vendor_categories (name) VALUES (?)', [cat]);
      categoryIds.push(res.insertId);
    }
    console.log(`   Seeded ${categories.length} categories.\n`);

    // ── Step 4: Insert 20 Vendors ──
    console.log('🏢 Inserting vendors...');
    const vendorData = [
      ['TechVision Solutions', '27AABCT1332L1ZX', 'vendor1@vendorbridge.com', '9876543210', '42, Tech Park, Powai, Mumbai - 400076', 1],
      ['GlobalHardware Pvt Ltd', '29AABCG4567M1ZY', 'vendor2@vendorbridge.com', '9876543211', '18, Electronic City Phase 1, Bengaluru - 560100', 2],
      ['SwiftLogistics India', '06AABCS8901N1ZZ', 'vendor3@vendorbridge.com', '9876543212', '7, Sector 18, Gurugram, Haryana - 122015', 4],
      ['OfficeWorld Supplies', '07AABCO2345P1ZA', 'vendor4@vendorbridge.com', '9876543213', '33, Connaught Place, New Delhi - 110001', 3],
      ['FurniCraft Industries', '24AABCF6789Q1ZB', 'vendor5@vendorbridge.com', '9876543214', '9, GIDC Industrial Estate, Ahmedabad - 382445', 5],
      ['AeroConnect Systems', '27AACCS3332A1Z1', 'vendor6@vendorbridge.com', '9876543215', '124, SEZ Zone, Hinjewadi, Pune - 411057', 2],
      ['Apex Software Consult', '29AAPSC4567B1Z2', 'vendor7@vendorbridge.com', '9876543216', '55, Outer Ring Rd, Marathahalli, Bengaluru - 560037', 1],
      ['BlueDart Logistics Ltd', '06AABDL8901C1Z3', 'vendor8@vendorbridge.com', '9876543217', '12, Transport Area, Okhla, New Delhi - 110020', 4],
      ['Raj Stationery Mart', '07AARSM2345D1Z4', 'vendor9@vendorbridge.com', '9876543218', 'Shop 4, Sadar Bazar, Delhi - 110006', 3],
      ['Hindustan Ergonomics', '24AAHFE6789E1Z5', 'vendor10@vendorbridge.com', '9876543219', '88, Timber Market, Ahmedabad - 380002', 5],
      ['Modern Facility Services', '27AAMFS1332F1Z6', 'vendor11@vendorbridge.com', '9876543220', '4, Andheri Kurla Road, Mumbai - 400059', 6],
      ['MicroTech Solutions', '29AAMTS4567G1Z7', 'vendor12@vendorbridge.com', '9876543221', '25, Whitefield Rd, Bengaluru - 560066', 2],
      ['Zenith Cargo Movers', '06AAZCM8901H1Z8', 'vendor13@vendorbridge.com', '9876543222', '31, IGI Airport Cargo Complex, New Delhi - 110037', 4],
      ['PaperKraft Supplies', '07AAPKS2345I1Z9', 'vendor14@vendorbridge.com', '9876543223', '15, Daryaganj, New Delhi - 110002', 3],
      ['Royal Woodcrafts', '24AARWC6789J1Z0', 'vendor15@vendorbridge.com', '9876543224', '102, GIDC, Ahmedabad - 382481', 5],
      ['QuickFix Engineering', '27AAQFE1332K1Z2', 'vendor16@vendorbridge.com', '9876543225', '19, Thane West, Mumbai - 400601', 6],
      ['Intellect Systems', '29AAISY4567L1Z3', 'vendor17@vendorbridge.com', '9876543226', '6, MG Road, Bengaluru - 560001', 1],
      ['Delta Power Solutions', '06AADPS8901M1Z4', 'vendor18@vendorbridge.com', '9876543227', '9, Sector 2, Noida, UP - 201301', 2],
      ['Supreme Packaging', '07AASPA2345N1Z5', 'vendor19@vendorbridge.com', '9876543228', '8, Kirti Nagar, New Delhi - 110015', 3],
      ['Dynamic Workspace Ltd', '24AADWL6789O1Z6', 'vendor20@vendorbridge.com', '9876543229', '44, Satellite Rd, Ahmedabad - 380015', 5],
    ];

    const vendorIds = [];
    for (const v of vendorData) {
      const [res] = await db.execute(
        'INSERT INTO vendors (name, gst_number, email, phone, address, status, category_id) VALUES (?, ?, ?, ?, ?, \'active\', ?)',
        v
      );
      vendorIds.push(res.insertId);
    }
    console.log(`   Seeded ${vendorData.length} vendor profiles.\n`);

    // ── Step 5: Insert 30 RFQs ──
    console.log('📋 Inserting RFQs...');
    const rfqTitles = [
      ['Procurement of High-End Laptops for Developers', 'Require 50 high-performance laptops. Minimum specs: Intel i7/AMD Ryzen 7, 16GB RAM, 512GB SSD, 15" Display', 50, 1], // closed
      ['Office Ergonomic Chairs for Pune Branch', 'Purchase of 100 high-back mesh ergonomic chairs with lumbar support and multi-adjustable armrests.', 100, 5], // closed
      ['Annual Stationery & Office Supplies Contract', 'Yearly contract for office supplies: A4 papers (500 boxes), pens (2000 units), folders (500 units), notebook pads.', 500, 3], // closed
      ['Dual-Band Wi-Fi Routers for Workspace', 'Procurement of 15 enterprise dual-band Wi-Fi 6 routers supporting 100+ concurrent connections each.', 15, 2], // closed
      ['Conference Room Modular Tables', 'Purchase of 3 modular oak conference tables matching linear layout (10-seater configuration).', 3, 5], // closed
      ['Annual AC Maintenance & Repairs Contract', 'Service contract for comprehensive maintenance of 45 split air conditioning systems at HQ.', 45, 6], // closed
      ['IT Helpdesk Software Suite License', '1-year enterprise subscription for IT ticketing and helpdesk software (30 technician agents).', 30, 1], // closed
      ['Heavy-Duty Network Switches', 'Requirement of 10 managed 24-port Gigabit Ethernet switches supporting Power over Ethernet (PoE).', 10, 2], // closed
      ['LED Ceiling Panel Lights for Office Area', 'Procurement of 120 energy-efficient LED panels (2x2 ft, 36W) for workstation ceiling replacement.', 120, 2], // closed
      ['Modular Workstation Partitions', 'Requirement of 40 workstation partitions (4-way partition config) for open office restructuring.', 40, 5], // closed
      ['External Desktop SSD Storage Drives', 'Purchase of 25 portable external SSD drives (2TB, USB-C, read speed 1050MB/s) for media backup.', 25, 2], // closed
      ['Standard Writing Notebooks & Supplies', 'Procurement of 300 classic ruling pads, clip boards, post-it notes, and marker pens for training room.', 300, 3], // closed
      ['LED Projector for Main Conference Hall', 'Procurement of 2 ultra short-throw 4K laser projectors with 5000 lumens brightness.', 2, 2], // closed
      ['Modular Storage File Cabinets', 'Purchase of 15 steel modular storage cabinets with digital security locks for accounting team.', 15, 5], // closed
      ['Breakroom Coffee Machine Commercial-Grade', 'Supply of 4 automatic commercial espresso machines with milk frothers and bean grinders.', 4, 6], // closed
      ['High-Resolution Security Dome Cameras', 'Purchase of 30 indoor IP dome cameras (5MP, night vision, PoE) for lobby and corridor monitoring.', 30, 2], // closed
      ['Workspace Desktop Computers', 'Supply of 40 workstation towers. Spec: Intel Core i5, 8GB RAM, 256GB SSD, Windows 11 pre-loaded.', 40, 1], // closed
      ['Office Paper Shredder Heavy-Duty', 'Requirement of 5 cross-cut heavy duty paper shredders with CD/credit card destruction capacity.', 5, 3], // closed
      ['Ergonomic Footrests for Desks', 'Procurement of 80 adjustable ergonomic under-desk footrests with massage rollers.', 80, 5], // closed
      ['Fire Extinguishers Co2 Refills & New Units', 'Procurement of 20 new CO2 fire extinguishers (4.5kg capacity) and refilling services for 15 existing units.', 35, 6], // closed
      ['LED Smart Displays for Meeting Rooms', 'Supply of 8 smart LED monitors (55-inch, 4K, built-in casting) for collaborative meeting hubs.', 8, 2], // closed
      ['Professional Cleaning Supplies Batch B-2', 'Bulk supply of eco-friendly cleaning detergents, floor disinfectants, garbage bags, and microfiber cloths.', 150, 3], // closed
      ['Server Rack Cabinets 42U', 'Supply of 3 server rack cabinets (42U height, 800mm width, glass front door, cooling fans included).', 3, 2], // open
      ['Electric Standing Height-Adjustable Desks', 'Purchase of 25 motorized height-adjustable desks with presets and steel frame.', 25, 5], // open
      ['High-Speed Wireless Presentation Clickers', 'Procurement of 12 wireless presentation remotes with green laser pointer for boardrooms.', 12, 3], // open
      ['Emergency First Aid Medical Kits', 'Requirement of 15 industrial-grade wall-mountable emergency first aid boxes for workstations.', 15, 3], // open
      ['Logistics Transport Services (Contract-3)', 'Transport contract for shifting warehouse inventory from Mumbai to Pune branch (24 trucks).', 24, 4], // open
      ['IT Security Firewall System Upgrade', 'Enterprise gateway security firewall appliance supporting up to 500 VPN clients concurrent.', 1, 1], // draft
      ['Custom Employee ID Card Lanyards', 'Printing and supply of 500 woven lanyards with metal clips featuring VendorBridge logo.', 500, 3], // draft
      ['Reception Area Leather Sofas', 'Procurement of 2 premium leather 3-seater reception sofas (charcoal grey, modern design).', 2, 5], // draft
    ];

    const rfqIds = [];
    let rfqIndex = 1;
    for (const [title, desc, qty, catId] of rfqTitles) {
      // Status mapping: 1-22 closed, 23-27 open, 28-30 draft
      let status = 'open';
      if (rfqIndex <= 22) status = 'closed';
      else if (rfqIndex >= 28) status = 'draft';

      const deadline = new Date(Date.now() + (30 - rfqIndex) * 24 * 60 * 60 * 1000);
      const [res] = await db.execute(
        'INSERT INTO rfqs (title, description, quantity, deadline, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, 2, DATE_SUB(NOW(), INTERVAL ? DAY))',
        [title, desc, qty, deadline, status, rfqIndex + 5]
      );
      rfqIds.push(res.insertId);
      rfqIndex++;
    }
    console.log(`   Seeded ${rfqIds.length} RFQ records.\n`);

    // ── Step 6: RFQ Vendor Assignments ──
    console.log('🔗 Assigning vendors to RFQs...');
    // We assign 3-5 vendors of matching categories
    for (const rfqId of rfqIds) {
      // Pick 4 random vendors
      const shuffledVendors = [...vendorIds].sort(() => 0.5 - Math.random());
      const selected = shuffledVendors.slice(0, 4);
      for (const vId of selected) {
        await db.execute(
          'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)',
          [rfqId, vId]
        );
      }
    }
    console.log('   Assigned vendors to all RFQs.\n');

    // ── Step 7: Seed 75 Quotations ──
    console.log('💬 Seeding quotations (60+ target)...');
    const quotations = [];
    const quotationIds = [];

    // Base quotes data generator
    for (let rIdx = 0; rIdx < rfqIds.length; rIdx++) {
      const rfqId = rfqIds[rIdx];
      const rfqTitle = rfqTitles[rIdx][0];
      const categoryId = rfqTitles[rIdx][3];

      // Fetch assigned vendors for this RFQ
      const [assignedRows] = await db.execute(
        'SELECT vendor_id FROM rfq_vendors WHERE rfq_id = ?',
        [rfqId]
      );
      const assignedVendorIds = assignedRows.map(r => r.vendor_id);

      // closed RFQs (index 0 to 21, i.e., RFQ 1 to 22)
      if (rIdx < 22) {
        // Submit quotes from all assigned vendors
        let minPriceIdx = 0;
        let lowestPrice = 9999999;
        const tempQuotes = [];

        for (let vIdx = 0; vIdx < assignedVendorIds.length; vIdx++) {
          const vId = assignedVendorIds[vIdx];
          const unitPrice = Math.floor(Math.random() * 5000) + 1500;
          const qty = rfqTitles[rIdx][2];
          const totalPrice = unitPrice * qty;
          const deliveryDays = Math.floor(Math.random() * 10) + 3;

          if (totalPrice < lowestPrice) {
            lowestPrice = totalPrice;
            minPriceIdx = vIdx;
          }

          tempQuotes.push({
            rfqId,
            vendorId: vId,
            unitPrice,
            totalPrice,
            deliveryDays,
            notes: `Seeding official quotation for ${rfqTitle}. Spec fully matched.`,
            status: 'rejected', // Default all to rejected, then mark lowest as selected
            submittedAt: `DATE_SUB(NOW(), INTERVAL ${35 - rIdx} DAY)`
          });
        }

        // Mark the lowest quote as selected
        tempQuotes[minPriceIdx].status = 'selected';

        for (const q of tempQuotes) {
          const [res] = await db.execute(
            `INSERT INTO quotations (rfq_id, vendor_id, unit_price, total_price, delivery_days, notes, status, submitted_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ${q.submittedAt})`,
            [q.rfqId, q.vendorId, q.unitPrice, q.totalPrice, q.deliveryDays, q.notes, q.status]
          );
          q.id = res.insertId;
          quotationIds.push(res.insertId);
          quotations.push(q);
        }
      } 
      // Open RFQs (index 22 to 26, i.e., RFQ 23 to 27)
      else if (rIdx >= 22 && rIdx < 27) {
        // Submit quotes as 'submitted' or 'draft'
        for (let vIdx = 0; vIdx < 2; vIdx++) {
          const vId = assignedVendorIds[vIdx];
          const unitPrice = Math.floor(Math.random() * 4000) + 1000;
          const qty = rfqTitles[rIdx][2];
          const totalPrice = unitPrice * qty;
          const deliveryDays = Math.floor(Math.random() * 12) + 5;
          const qStatus = vIdx === 0 ? 'submitted' : 'draft';

          const [res] = await db.execute(
            `INSERT INTO quotations (rfq_id, vendor_id, unit_price, total_price, delivery_days, notes, status, submitted_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 2 DAY))`,
            [rfqId, vId, unitPrice, totalPrice, deliveryDays, `Bidding for open RFQ: ${rfqTitle}`, qStatus]
          );
          quotationIds.push(res.insertId);
          quotations.push({ id: res.insertId, rfqId, vendorId: vId, unitPrice, totalPrice, deliveryDays, status: qStatus });
        }
      }
      // Draft RFQs (index 27 to 29)
      else {
        // Only draft quotes
        const vId = assignedVendorIds[0];
        const unitPrice = Math.floor(Math.random() * 3000) + 800;
        const qty = rfqTitles[rIdx][2];
        const totalPrice = unitPrice * qty;
        const [res] = await db.execute(
          `INSERT INTO quotations (rfq_id, vendor_id, unit_price, total_price, delivery_days, notes, status, submitted_at) 
           VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL)`,
          [rfqId, vId, unitPrice, totalPrice, 8, `Draft proposal notes`]
        );
        quotationIds.push(res.insertId);
        quotations.push({ id: res.insertId, rfqId, vendorId: vId, unitPrice, totalPrice, deliveryDays: 8, status: 'draft' });
      }
    }
    console.log(`   Seeded ${quotations.length} total quotation bids.\n`);

    // ── Step 8: Seed 32 Approvals ──
    console.log('✅ Seeding approval workflows (32 records)...');
    // We need 20 approved approvals, 2 rejected approvals, and 10 pending approvals.
    const selectedQuotations = quotations.filter(q => q.status === 'selected');
    const approvalIds = [];
    const approvalMap = [];

    // Let's loop through the 22 selected quotations from closed RFQs
    for (let sIdx = 0; sIdx < selectedQuotations.length; sIdx++) {
      const q = selectedQuotations[sIdx];
      // 20 Approved, 2 Rejected
      const decision = sIdx < 20 ? 'approved' : 'rejected';
      const remarks = decision === 'approved' 
        ? 'Proposal matching all specifications and representing optimized value. Recommended for PO dispatch.'
        : 'Quotation amount exceeds current department budget allocations. Return to Procurement Officer.';
      const decidedAt = `DATE_SUB(NOW(), INTERVAL ${30 - sIdx} DAY)`;

      const [res] = await db.execute(
        `INSERT INTO approvals (quotation_id, approver_id, decision, remarks, decided_at) 
         VALUES (?, 3, ?, ?, ${decidedAt})`,
        [q.id, decision, remarks]
      );
      approvalIds.push(res.insertId);
      approvalMap.push({ id: res.insertId, quotationId: q.id, decision, remarks, rfqId: q.rfqId, totalPrice: q.totalPrice });
    }

    // Now insert 10 Pending approvals linked to submitted quotes of open RFQs
    const openSubmittedQuotes = quotations.filter(q => q.status === 'submitted').slice(0, 10);
    for (let pIdx = 0; pIdx < openSubmittedQuotes.length; pIdx++) {
      const q = openSubmittedQuotes[pIdx];
      // Temporarily mark the quote as selected to support pending approval
      await db.execute('UPDATE quotations SET status = \'selected\' WHERE id = ?', [q.id]);
      
      const [res] = await db.execute(
        `INSERT INTO approvals (quotation_id, approver_id, decision, remarks, decided_at) 
         VALUES (?, 3, 'pending', NULL, NULL)`,
        [q.id]
      );
      approvalIds.push(res.insertId);
      approvalMap.push({ id: res.insertId, quotationId: q.id, decision: 'pending', remarks: null, rfqId: q.rfqId, totalPrice: q.totalPrice });
    }
    console.log(`   Seeded ${approvalMap.length} approvals (20 Approved, 2 Rejected, 10 Pending).\n`);

    // ── Step 9: Seed 20 Purchase Orders ──
    console.log('📦 Seeding purchase orders (20 records)...');
    const approvedApprovals = approvalMap.filter(a => a.decision === 'approved');
    const poIds = [];
    const poMap = [];

    let poCount = 1;
    for (const a of approvedApprovals) {
      const poNumber = `PO-2026-${String(poCount).padStart(4, '0')}`;
      const subtotal = parseFloat(a.totalPrice);
      const tax = subtotal * 0.18;
      const grandTotal = subtotal + tax;

      // Status mix: 8 completed, 8 sent, 4 generated
      let status = 'generated';
      if (poCount <= 8) status = 'completed';
      else if (poCount <= 16) status = 'sent';

      const [res] = await db.execute(
        `INSERT INTO purchase_orders (po_number, approval_id, subtotal, tax_amount, grand_total, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ${30 - poCount} DAY))`,
        [poNumber, a.id, subtotal, tax, grandTotal, status]
      );
      poIds.push(res.insertId);
      poMap.push({ id: res.insertId, poNumber, subtotal, tax, grandTotal, status });
      poCount++;
    }
    console.log(`   Seeded ${poMap.length} Purchase Orders.\n`);

    // ── Step 10: Seed 20 Invoices ──
    console.log('🧾 Seeding invoices (20 records)...');
    // We map an invoice to each of the 20 Purchase Orders
    let invCount = 1;
    for (const po of poMap) {
      const invoiceNumber = `INV-2026-${String(invCount).padStart(4, '0')}`;
      const subtotal = po.subtotal;
      const tax = po.tax;
      const grandTotal = po.grandTotal;

      // Status mix: 8 paid (for completed POs), 8 sent (for sent POs), 4 generated (for generated POs)
      let status = 'generated';
      if (invCount <= 8) status = 'paid';
      else if (invCount <= 16) status = 'sent';

      await db.execute(
        `INSERT INTO invoices (po_id, invoice_number, subtotal, tax, grand_total, status, issued_at) 
         VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ${28 - invCount} DAY))`,
        [po.id, invoiceNumber, subtotal, tax, grandTotal, status]
      );
      invCount++;
    }
    console.log(`   Seeded ${invCount - 1} invoices.\n`);

    // ── Step 11: Seed 200+ Activity Logs ──
    console.log('📝 Seeding activity logs (200+ records)...');
    let logCount = 0;
    const modules = ['Authentication', 'Vendors', 'RFQs', 'Quotations', 'Approval Workflow', 'Purchase Orders', 'Invoices'];
    const actionsPool = [
      { action: 'USER_LOGIN', desc: 'User logged in successfully', mod: 'Authentication' },
      { action: 'USER_LOGOUT', desc: 'User logged out', mod: 'Authentication' },
      { action: 'VENDOR_CREATED', desc: 'New vendor profile created', mod: 'Vendors' },
      { action: 'VENDOR_UPDATED', desc: 'Vendor company details updated', mod: 'Vendors' },
      { action: 'RFQ_CREATED', desc: 'Created request for quotation', mod: 'RFQs' },
      { action: 'RFQ_PUBLISHED', desc: 'RFQ published and sent to assigned suppliers', mod: 'RFQs' },
      { action: 'QUOTATION_SUBMITTED', desc: 'Supplier quotation submitted', mod: 'Quotations' },
      { action: 'QUOTATION_SELECTED', desc: 'Winning quotation selected by Procurement Officer', mod: 'Quotations' },
      { action: 'APPROVAL_REQUESTED', desc: 'Sent winning quotation for manager approval', mod: 'Approval Workflow' },
      { action: 'APPROVAL_APPROVED', desc: 'RFQ quotation selection approved', mod: 'Approval Workflow' },
      { action: 'PO_GENERATED', desc: 'Purchase Order generated automatically from approved quotation', mod: 'Purchase Orders' },
      { action: 'PO_SENT', desc: 'Purchase Order dispatched to vendor', mod: 'Purchase Orders' },
      { action: 'INVOICE_GENERATED', desc: 'Tax invoice generated from Purchase Order', mod: 'Invoices' },
      { action: 'INVOICE_EMAILED', desc: 'Tax invoice emailed to supplier', mod: 'Invoices' },
      { action: 'INVOICE_PAID', desc: 'Invoice payment status updated to paid', mod: 'Invoices' },
    ];

    // Seed 220 random activity logs spanning the last 60 days
    for (let i = 1; i <= 220; i++) {
      const rUser = users[Math.floor(Math.random() * users.length)];
      const act = actionsPool[Math.floor(Math.random() * actionsPool.length)];
      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const entityId = Math.floor(Math.random() * 15) + 1;
      const entityType = act.mod.toLowerCase().replace(' ', '_');

      await db.execute(
        `INSERT INTO activity_logs (user_id, user_name, role, module, entity_type, entity_id, action, description, ip_address, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '192.168.1.${Math.floor(Math.random() * 254) + 1}', DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [
          Math.floor(Math.random() * 8) + 1, // random user ID from 1 to 8
          rUser[0],
          rUser[3],
          act.mod,
          entityType,
          entityId,
          act.action,
          `${act.desc} (ID: ${entityId})`,
          daysAgo
        ]
      );
      logCount++;
    }
    console.log(`   Seeded ${logCount} activity logs.\n`);

    // ── Step 12: Seed 100+ Notifications ──
    console.log('🔔 Seeding user notifications (100+ records)...');
    let notifCount = 0;
    const notificationTemplates = [
      { title: 'New RFQ Assigned', msg: 'You have been assigned to bid for RFQ', type: 'rfq' },
      { title: 'Quotation Submitted', msg: 'A supplier submitted a quotation for RFQ', type: 'quotation' },
      { title: 'Quotation Selected', msg: 'Your quotation was selected for RFQ', type: 'quotation' },
      { title: 'Approval Requested', msg: 'Approval request created for RFQ', type: 'approval' },
      { title: 'Approval Granted', msg: 'Your procurement request was approved', type: 'approval' },
      { title: 'PO Dispatched', msg: 'Purchase Order generated and sent', type: 'purchase_order' },
      { title: 'Invoice Paid', msg: 'Payment processed successfully for Invoice', type: 'invoice' }
    ];

    // Seed 110 notifications
    for (let i = 1; i <= 110; i++) {
      const uId = Math.floor(Math.random() * 8) + 1;
      const temp = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
      const isRead = Math.random() > 0.4 ? 1 : 0;
      const refId = Math.floor(Math.random() * 20) + 1;
      const daysAgo = Math.floor(Math.random() * 30) + 1;

      await db.execute(
        `INSERT INTO notifications (user_id, title, message, type, is_read, reference_type, reference_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
        [uId, temp.title, `${temp.msg} (Ref ID: ${refId})`, temp.type, isRead, temp.type, refId, daysAgo]
      );
      notifCount++;
    }
    console.log(`   Seeded ${notifCount} notifications.\n`);

    // ── Final Verification Output Summary ──
    console.log('═════════════════════════════════════════════════════════');
    console.log('🎉 Database Reset and Seeding Completed Successfully!');
    console.log('═════════════════════════════════════════════════════════');
    console.log(`   System Users:          ${users.length}`);
    console.log(`   Vendor Categories:     ${categories.length}`);
    console.log(`   Vendors:               ${vendorData.length}`);
    console.log(`   RFQs:                  ${rfqTitles.length}`);
    console.log(`   Quotations Bids:       ${quotations.length}`);
    console.log(`   Approvals:             ${approvalMap.length}`);
    console.log(`   Purchase Orders:       ${poMap.length}`);
    console.log(`   Invoices:              ${poMap.length}`);
    console.log(`   Activity Logs:         ${logCount}`);
    console.log(`   Notifications:         ${notifCount}`);
    console.log('═════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seed();
